import 'dotenv/config'

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import bs58 from 'bs58'
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createBurnCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from '@solana/spl-token'
import { OnlinePumpSdk } from '@pump-fun/pump-sdk'

const LAMPORTS_PER_SOL = 1_000_000_000n
const NATIVE_MINT = 'So11111111111111111111111111111111111111112'
const PUMP_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
const PUMP_AMM_PROGRAM_ID = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA'
const PUMP_FEES_PROGRAM_ID = 'pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ'
const COMPUTE_BUDGET_PROGRAM_ID = 'ComputeBudget111111111111111111111111111111'
const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111'
const DEFAULT_MINT = 'FBJ3Pm1ngPYfEGhcvWBBKpShdyd1Z6iNt6cByqeDpump'
const STATE_DIR = path.resolve('.buyback-burn')
const STATE_PATH = path.join(STATE_DIR, 'state.json')
const LOCK_PATH = path.join(STATE_DIR, 'worker.lock')

const ALLOWED_TRANSACTION_PROGRAMS = new Set([
  PUMP_PROGRAM_ID,
  PUMP_AMM_PROGRAM_ID,
  PUMP_FEES_PROGRAM_ID,
  TOKEN_PROGRAM_ID.toBase58(),
  TOKEN_2022_PROGRAM_ID.toBase58(),
  ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
  COMPUTE_BUDGET_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
])

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required in .env`)
  return value
}

function numberSetting(name, fallback, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  const raw = process.env[name]?.trim()
  const value = raw ? Number(raw) : fallback
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be a number between ${min} and ${max}`)
  }
  return value
}

function solToLamports(value) {
  const text = String(value)
  if (!/^\d+(\.\d{1,9})?$/.test(text)) throw new Error(`Invalid SOL amount: ${text}`)
  const [whole, fraction = ''] = text.split('.')
  return BigInt(whole) * LAMPORTS_PER_SOL + BigInt(fraction.padEnd(9, '0'))
}

function formatSol(lamports) {
  const sign = lamports < 0n ? '-' : ''
  const absolute = lamports < 0n ? -lamports : lamports
  const whole = absolute / LAMPORTS_PER_SOL
  const fraction = (absolute % LAMPORTS_PER_SOL).toString().padStart(9, '0').replace(/0+$/, '')
  return `${sign}${whole}${fraction ? `.${fraction}` : ''}`
}

function loadWallet() {
  const raw = required('CREATOR_PRIVATE_KEY')
  let bytes
  try {
    if (raw.startsWith('[')) {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('not an array')
      bytes = Uint8Array.from(parsed)
    } else {
      bytes = bs58.decode(raw)
    }
    if (bytes.length !== 64) throw new Error('wrong length')
    return Keypair.fromSecretKey(bytes)
  } catch {
    throw new Error('CREATOR_PRIVATE_KEY must be a 64-byte Solana secret key (base58 or JSON byte array)')
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(20_000),
    headers: { 'content-type': 'application/json', ...options.headers },
  })
  const responseText = await response.text()
  let body
  try { body = responseText ? JSON.parse(responseText) : {} } catch { body = { message: responseText } }
  if (!response.ok) throw new Error(`${url} returned ${response.status}: ${body.error || body.message || 'request failed'}`)
  return body
}

async function loadState() {
  try {
    const parsed = JSON.parse(await fs.readFile(STATE_PATH, 'utf8'))
    return {
      accruedBuybackLamports: String(parsed.accruedBuybackLamports || '0'),
      pendingBurnBaseUnits: String(parsed.pendingBurnBaseUnits || '0'),
      lastClaimSignature: parsed.lastClaimSignature || null,
      lastBuySignature: parsed.lastBuySignature || null,
      lastBurnSignature: parsed.lastBurnSignature || null,
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return {
      accruedBuybackLamports: '0',
      pendingBurnBaseUnits: '0',
      lastClaimSignature: null,
      lastBuySignature: null,
      lastBurnSignature: null,
    }
  }
}

async function saveState(state) {
  await fs.mkdir(STATE_DIR, { recursive: true })
  const temporary = `${STATE_PATH}.tmp`
  await fs.writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  await fs.rename(temporary, STATE_PATH)
}

async function acquireLock() {
  await fs.mkdir(STATE_DIR, { recursive: true })
  try {
    const handle = await fs.open(LOCK_PATH, 'wx', 0o600)
    await handle.writeFile(`${process.pid}\n`)
    return handle
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    const existingPid = Number((await fs.readFile(LOCK_PATH, 'utf8')).trim())
    try {
      process.kill(existingPid, 0)
      throw new Error(`Another buyback-and-burn worker is already running (PID ${existingPid})`)
    } catch (processError) {
      if (processError.code !== 'ESRCH') throw processError
      await fs.unlink(LOCK_PATH)
      return acquireLock()
    }
  }
}

async function releaseLock(handle) {
  await handle?.close()
  await fs.unlink(LOCK_PATH).catch((error) => {
    if (error.code !== 'ENOENT') throw error
  })
}

async function tokenBalance(connection, tokenAccount) {
  const account = await connection.getAccountInfo(tokenAccount, 'confirmed')
  if (!account) return 0n
  const balance = await connection.getTokenAccountBalance(tokenAccount, 'confirmed')
  return BigInt(balance.value.amount)
}

async function validateApiTransaction(connection, transaction) {
  const feePayer = transaction.message.staticAccountKeys[0]
  if (!feePayer) throw new Error('Pump transaction has no fee payer')
  const lookupAccounts = []
  for (const lookup of transaction.message.addressTableLookups) {
    const result = await connection.getAddressLookupTable(lookup.accountKey)
    if (!result.value) throw new Error(`Missing address lookup table ${lookup.accountKey.toBase58()}`)
    lookupAccounts.push(result.value)
  }
  const programs = TransactionMessage.decompile(transaction.message, {
    addressLookupTableAccounts: lookupAccounts,
  }).instructions.map((instruction) => instruction.programId.toBase58())
  const unexpected = programs.filter((program) => !ALLOWED_TRANSACTION_PROGRAMS.has(program))
  if (unexpected.length) {
    throw new Error(`Pump transaction contains unexpected program(s): ${[...new Set(unexpected)].join(', ')}`)
  }
  return feePayer
}

async function signSimulateSend(connection, transaction, wallet, label) {
  const feePayer = await validateApiTransaction(connection, transaction)
  if (!feePayer.equals(wallet.publicKey)) {
    throw new Error(`${label} transaction has an unexpected fee payer: ${feePayer.toBase58()}`)
  }
  transaction.sign([wallet])
  const simulation = await connection.simulateTransaction(transaction, {
    commitment: 'confirmed',
    sigVerify: true,
  })
  if (simulation.value.err) {
    const logs = simulation.value.logs ? `\n${simulation.value.logs.join('\n')}` : ''
    throw new Error(`${label} simulation failed: ${JSON.stringify(simulation.value.err)}${logs}`)
  }
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    preflightCommitment: 'confirmed',
    skipPreflight: false,
    maxRetries: 3,
  })
  const confirmation = await connection.confirmTransaction(signature, 'confirmed')
  if (confirmation.value.err) throw new Error(`${label} failed: ${JSON.stringify(confirmation.value.err)}`)
  console.log(`${label}: https://solscan.io/tx/${signature}`)
  return signature
}

async function buildPumpTransaction(apiUrl, endpoint, body) {
  const response = await fetchJson(`${apiUrl}${endpoint}`, {
    method: 'POST',
    body: JSON.stringify({ ...body, frontRunningProtection: false, tipAmount: 0, encoding: 'base64' }),
  })
  if (!response.transaction) throw new Error(`Pump API ${endpoint} did not return a transaction`)
  return { response, transaction: VersionedTransaction.deserialize(Buffer.from(response.transaction, 'base64')) }
}

async function burnPending({ connection, wallet, mint, tokenProgram, decimals, tokenAccount, state, live }) {
  let pending = BigInt(state.pendingBurnBaseUnits)
  if (pending <= 0n) return
  const available = await tokenBalance(connection, tokenAccount)
  pending = pending > available ? available : pending
  if (pending <= 0n) {
    state.pendingBurnBaseUnits = '0'
    await saveState(state)
    return
  }
  console.log(`Pending burn: ${pending} base units`)
  if (!live) return

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  const transaction = new Transaction({ feePayer: wallet.publicKey, blockhash, lastValidBlockHeight }).add(
    createBurnCheckedInstruction(tokenAccount, mint, wallet.publicKey, pending, decimals, [], tokenProgram),
  )
  transaction.sign(wallet)
  const simulation = await connection.simulateTransaction(transaction, undefined, true)
  if (simulation.value.err) throw new Error(`Burn simulation failed: ${JSON.stringify(simulation.value.err)}`)
  const signature = await connection.sendRawTransaction(transaction.serialize(), { skipPreflight: false, maxRetries: 3 })
  const confirmation = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
  if (confirmation.value.err) throw new Error(`Burn failed: ${JSON.stringify(confirmation.value.err)}`)
  state.pendingBurnBaseUnits = (BigInt(state.pendingBurnBaseUnits) - pending).toString()
  state.lastBurnSignature = signature
  await saveState(state)
  console.log(`Burn confirmed: https://solscan.io/tx/${signature}`)
}

async function runCycle() {
  const live = (process.env.RUN_MODE || 'dry-run').trim() === 'live'
  const rpcUrl = required('SOLANA_RPC_URL')
  if (!/^https:\/\//i.test(rpcUrl)) throw new Error('SOLANA_RPC_URL must be an HTTPS URL')

  const wallet = loadWallet()
  const mint = new PublicKey(process.env.TOKEN_MINT?.trim() || DEFAULT_MINT)
  const apiUrl = (process.env.PUMP_API_URL || 'https://fun-block.pump.fun').replace(/\/$/, '')
  const buybackPercent = numberSetting('BUYBACK_PERCENT', 50, { min: 1, max: 100 })
  const slippagePct = numberSetting('SLIPPAGE_PERCENT', 2, { min: 0.1, max: 20 })
  const minClaim = solToLamports(process.env.MIN_CLAIM_SOL || '0.01')
  const minBuy = solToLamports(process.env.MIN_BUY_SOL || '0.005')
  const reserve = solToLamports(process.env.MIN_WALLET_RESERVE_SOL || '0.02')
  const connection = new Connection(rpcUrl, 'confirmed')
  const state = await loadState()

  const [coin, mintAccountInfo] = await Promise.all([
    fetchJson(`https://frontend-api-v3.pump.fun/coins/${mint.toBase58()}`),
    connection.getAccountInfo(mint, 'confirmed'),
  ])
  if (!mintAccountInfo) throw new Error('Token mint does not exist on the configured RPC network')
  if (coin.mint !== mint.toBase58()) throw new Error('Pump.fun returned a different token mint')
  if (coin.creator !== wallet.publicKey.toBase58()) {
    throw new Error(`This key belongs to ${wallet.publicKey.toBase58()}, but Pump.fun lists ${coin.creator} as the BURNY creator`)
  }
  const tokenProgram = mintAccountInfo.owner
  if (!tokenProgram.equals(TOKEN_PROGRAM_ID) && !tokenProgram.equals(TOKEN_2022_PROGRAM_ID)) {
    throw new Error(`Unsupported mint owner: ${tokenProgram.toBase58()}`)
  }
  const mintInfo = await getMint(connection, mint, 'confirmed', tokenProgram)
  const tokenAccount = getAssociatedTokenAddressSync(mint, wallet.publicKey, false, tokenProgram)

  console.log(`Mode: ${live ? 'LIVE' : 'DRY RUN'}`)
  console.log(`Creator: ${wallet.publicKey.toBase58()}`)
  console.log(`Token: ${coin.name} (${coin.symbol}) ${mint.toBase58()}`)

  await burnPending({ connection, wallet, mint, tokenProgram, decimals: mintInfo.decimals, tokenAccount, state, live })
  if (live && BigInt(state.pendingBurnBaseUnits) > 0n) {
    console.log('A previous burn is still pending, so this cycle will not claim or buy more.')
    return
  }

  const pump = new OnlinePumpSdk(connection)
  const claimable = BigInt((await pump.getCreatorVaultBalanceBothPrograms(wallet.publicKey)).toString())
  const accrued = BigInt(state.accruedBuybackLamports)
  console.log(`Claimable creator fees: ${formatSol(claimable)} SOL`)
  console.log(`Saved buyback allocation: ${formatSol(accrued)} SOL`)

  if (!live) {
    console.log('Dry run complete. No transaction was signed or sent.')
    return
  }

  if (claimable >= minClaim) {
    const before = BigInt(await connection.getBalance(wallet.publicKey, 'confirmed'))
    const { response, transaction } = await buildPumpTransaction(apiUrl, '/agents/collect-fees', {
      mint: mint.toBase58(),
      user: wallet.publicKey.toBase58(),
    })
    if (response.creator && response.creator !== wallet.publicKey.toBase58()) {
      throw new Error(`Pump fee transaction resolved a different creator: ${response.creator}`)
    }
    state.lastClaimSignature = await signSimulateSend(connection, transaction, wallet, 'Fee claim confirmed')
    const after = BigInt(await connection.getBalance(wallet.publicKey, 'confirmed'))
    const received = after > before ? after - before : 0n
    const allocation = received * BigInt(Math.round(buybackPercent * 100)) / 10_000n
    state.accruedBuybackLamports = (BigInt(state.accruedBuybackLamports) + allocation).toString()
    await saveState(state)
    console.log(`Net fees received: ${formatSol(received)} SOL; ${buybackPercent}% allocated: ${formatSol(allocation)} SOL`)
  } else {
    console.log(`Skipping claim until at least ${formatSol(minClaim)} SOL is available.`)
  }

  const requestedBuy = BigInt(state.accruedBuybackLamports)
  if (requestedBuy < minBuy) {
    console.log(`Skipping buy until the saved allocation reaches ${formatSol(minBuy)} SOL.`)
    return
  }
  const walletBalance = BigInt(await connection.getBalance(wallet.publicKey, 'confirmed'))
  if (walletBalance - requestedBuy < reserve) {
    console.log(`Skipping buy: it would leave less than the ${formatSol(reserve)} SOL wallet reserve.`)
    return
  }

  const beforeTokenBalance = await tokenBalance(connection, tokenAccount)
  const { transaction: buyTransaction } = await buildPumpTransaction(apiUrl, '/agents/swap', {
    inputMint: NATIVE_MINT,
    outputMint: mint.toBase58(),
    amount: requestedBuy.toString(),
    user: wallet.publicKey.toBase58(),
    feePayer: wallet.publicKey.toBase58(),
    slippagePct,
  })
  state.lastBuySignature = await signSimulateSend(connection, buyTransaction, wallet, 'Buyback confirmed')
  state.accruedBuybackLamports = '0'
  const afterTokenBalance = await tokenBalance(connection, tokenAccount)
  const bought = afterTokenBalance > beforeTokenBalance ? afterTokenBalance - beforeTokenBalance : 0n
  state.pendingBurnBaseUnits = (BigInt(state.pendingBurnBaseUnits) + bought).toString()
  await saveState(state)
  console.log(`Bought ${bought} base units; queued the exact received amount for burning.`)

  await burnPending({ connection, wallet, mint, tokenProgram, decimals: mintInfo.decimals, tokenAccount, state, live })
}

async function main() {
  const watch = process.argv.includes('--watch')
  if (!watch && !process.argv.includes('--once')) throw new Error('Use --once or --watch')
  const intervalSeconds = numberSetting('INTERVAL_SECONDS', 900, { min: 60, max: 86_400 })
  const lock = await acquireLock()
  const stop = async () => {
    await releaseLock(lock)
    process.exit(0)
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  try {
    do {
      try {
        await runCycle()
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ${error.message}`)
        if (!watch) process.exitCode = 1
      }
      if (!watch) break
      console.log(`Next check in ${intervalSeconds} seconds.`)
      await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000))
    } while (true)
  } finally {
    await releaseLock(lock)
  }
}

main()
