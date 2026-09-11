# BURNY

Responsive comic-style landing page for the BURNY meme coin.

## Run locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Creator-fee buyback and burn

The worker in `scripts/buyback-burn.mjs` automates this cycle:

1. Verify that the configured private key belongs to the creator address Pump.fun reports for BURNY.
2. Wait until creator fees reach `MIN_CLAIM_SOL`, then claim them through Pump.fun's official transaction builder.
3. Allocate 50% of the net SOL received to a BURNY buy with slippage protection.
4. Burn exactly the BURNY tokens received by that buy using SPL Token `BurnChecked`.
5. Keep the other 50% in the creator wallet.

The key is loaded only by the local Node worker. It is never imported by the React website, printed, or included in a build. `.env` and the worker state directory are ignored by Git.

### Configure

```bash
cp .env.example .env
```

Fill in `CREATOR_PRIVATE_KEY` and an HTTPS `SOLANA_RPC_URL`. The private key may be a base58 secret or a 64-byte JSON array. Keep `RUN_MODE=dry-run` for the first check:

```bash
pnpm buyback-burn:once
```

Confirm the displayed creator address, mint, and claimable amount. Then set `RUN_MODE=live` and run one live cycle:

```bash
pnpm buyback-burn:once
```

After the claim, buy, and burn links are confirmed on Solscan, start continuous checks:

```bash
pnpm buyback-burn:watch
```

Keep that process running on a trusted machine. The wallet needs enough SOL for network fees and the configured `MIN_WALLET_RESERVE_SOL`. Failed burns remain recorded in `.buyback-burn/state.json` and are retried before any new claim or buy.

On this Mac, `scripts/com.burny.buyback-burn.plist` can run one live cycle every hour through `launchd`. Its output is written to `.buyback-burn/launchd.log` and errors to `.buyback-burn/launchd-error.log`.
