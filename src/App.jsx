import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowDown, ArrowRight, Check, ChevronDown, Copy, Flame, Gem, GitFork,
  Globe2, Send, ShieldCheck, ShoppingBag, Sparkles, Wallet,
  X, Zap
} from 'lucide-react'

const navLinks = [
  ['ABOUT', '#about'], ['BURN MECHANISM', '#burn'], ['TOKENOMICS', '#tokenomics'],
  ['MEMES', '#memes'], ['HOW TO BUY', '#buy'], ['FAQ', '#faq']
]

const MINT = 'FBJ3Pm1ngPYfEGhcvWBBKpShdyd1Z6iNt6cByqeDpump'
const PUMP_URL = `https://pump.fun/coin/${MINT}`
const EXPLORER_URL = `https://solscan.io/token/${MINT}`
const TELEGRAM_URL = 'https://t.me/burnyonsolana'
const X_URL = 'https://x.com/burnyonsol'
const SOLANA_RPC_URLS = ['https://rpc.solanatracker.io/public', 'https://api.mainnet-beta.solana.com']
const INITIAL_SUPPLY = 1_000_000_000_000_000n
const LAST_VERIFIED_BURN = 926_136_182_617n

// Pump.fun mint metadata verified 2026-09-11. Supply uses 6 token decimals.
const tokenomics = [
  ['TOKEN', 'BURNY ($BURNY)'], ['NETWORK', 'SOLANA'], ['LAUNCHPAD', 'PUMP.FUN'],
  ['LAUNCH SUPPLY', '1,000,000,000 BURNY'], ['DECIMALS', '6'],
  ['TOKEN STANDARD', 'TOKEN-2022'], ['LAUNCHED', '11 SEP 2026'],
  ['AUTO BUYBACK + BURN', '50% OF CREATOR REWARDS'],
  ['COMMUNITY RESERVE', '50% OF CREATOR REWARDS']
]

const memes = [
  { title: 'BURNY × PONKE', image: '/meme-burny-ponke-launch-v1.png', copy: 'Two legends. One launchpad. Maximum send.' },
  { title: 'THE BURN ENGINE', image: '/meme-burn-engine-v1.png', copy: 'Creator rewards enter. Supply leaves.' },
  { title: 'MEME ALLIANCE', image: '/meme-alliance-v1.png', copy: 'BURNY, PONKE and the whole timeline charging forward.' }
]

const faqs = [
  ['What is BURNY?', 'BURNY is a community-driven meme coin on Solana, now live on Pump.fun.'],
  ['How does the burn mechanism work?', 'Every hour, the BURNY engine checks accrued creator rewards. Once the minimum is reached, 50% of the net rewards buys BURNY and the exact tokens received are permanently burned. The other 50% stays in the creator wallet.'],
  ['Has any supply been burned?', 'Yes. The live counter reads the Token-2022 mint supply directly from Solana and compares it with the 1 billion launch supply. Every completed burn can be verified on-chain.'],
  ['Where can I buy $BURNY?', 'Use the Buy on Pump.fun buttons on this website. Confirm the full contract address shown below before trading.'],
  ['What is the token supply?', 'Pump.fun reports a launch supply of 1,000,000,000 BURNY with 6 decimals. Check Solscan for current on-chain supply.'],
  ['Is liquidity locked?', 'A liquidity lock has not been independently verified here. Consult the live Pump.fun page and on-chain records for the current pool and launch status.']
]

const reveal = { initial: { opacity: 0, y: 35 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .2 }, transition: { duration: .55 } }

function Button({ children, dark = false, href = PUMP_URL, className = '' }) {
  return <motion.a whileTap={{ scale: .94 }} whileHover={{ y: -3 }} className={`comic-button ${dark ? 'dark' : ''} ${className}`} href={href}>{children}</motion.a>
}

function Embers() {
  return <div className="embers" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--i': i, '--x': `${(i * 37) % 100}%`, '--d': `${4 + (i % 6)}s` }} />)}</div>
}

function formatBurny(baseUnits) {
  const whole = baseUnits / 1_000_000n
  const fraction = (baseUnits % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '')
  return `${whole.toLocaleString('en-US')}${fraction ? `.${fraction}` : ''}`
}

function LiveBurnHero() {
  const [burn, setBurn] = useState({
    burned: LAST_VERIFIED_BURN,
    supply: INITIAL_SUPPLY - LAST_VERIFIED_BURN,
    live: false,
  })

  useEffect(() => {
    let active = true
    const refresh = async () => {
      for (const rpcUrl of SOLANA_RPC_URLS) {
        try {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 1, method: 'getTokenSupply',
              params: [MINT, { commitment: 'confirmed' }],
            }),
          })
          if (!response.ok) throw new Error('RPC unavailable')
          const payload = await response.json()
          const supply = BigInt(payload?.result?.value?.amount)
          if (supply < 0n || supply > INITIAL_SUPPLY) throw new Error('Invalid supply')
          if (active) setBurn({ burned: INITIAL_SUPPLY - supply, supply, live: true })
          return
        } catch {
          // Try the next public RPC; preserve the last verified snapshot if both fail.
        }
      }
      if (active) setBurn((current) => ({ ...current, live: false }))
    }
    refresh()
    const timer = setInterval(refresh, 60_000)
    return () => { active = false; clearInterval(timer) }
  }, [])

  return <motion.aside className="live-burn-hero" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 }} aria-live="polite">
    <div className="live-burn-flame"><Flame fill="currentColor"/></div>
    <div className="live-burn-total">
      <span><i className={burn.live ? 'online' : ''}/>{burn.live ? 'LIVE ON-CHAIN BURN' : 'LAST VERIFIED BURN'}</span>
      <strong>{formatBurny(burn.burned)}</strong>
      <small>$BURNY DESTROYED FOREVER</small>
    </div>
    <div className="live-burn-supply"><span>CURRENT SUPPLY</span><strong>{formatBurny(burn.supply)}</strong></div>
    <a href={EXPLORER_URL} target="_blank" rel="noreferrer">VERIFY SUPPLY <ArrowRight/></a>
  </motion.aside>
}

function Hero() {
  return <section className="hero" id="top">
    <img className="hero-bg" src="/burny-city-v2.png" alt="A fiery illustrated city at sunset" />
    <div className="hero-shade" />
    <Embers />
    <div className="hero-brandbar">
      <a className="hero-wordmark" href="#top" aria-label="BURNY home"><img src="/logo.png?v=1" alt="" /></a>
      <nav className="hero-nav">{navLinks.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <div className="hero-brand-actions"><a className="hero-telegram" href={TELEGRAM_URL} aria-label="Telegram"><Send /></a><Button href={PUMP_URL} className="hero-buy">BUY $BURNY</Button></div>
    </div>
    <LiveBurnHero />
    <div className="hero-layout container">
      <motion.div className="hero-copy" initial={{ opacity: 0, x: -35 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .65 }}>
        <span className="eyebrow hero-tagline">BURNY — BORN TO BURN</span>
        <span className="launch-chip">LIVE ON PUMP.FUN • SOLANA</span>
        <h1 aria-label="Less supply, more riches">
          <motion.span initial={{ opacity: 0, x: -28, scale: .82 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: .55, delay: .18, type: 'spring', stiffness: 180 }}>LESS SUPPLY</motion.span>
          <motion.b className="hero-impact-arrow" aria-hidden="true" initial={{ opacity: 0, scale: 0, rotate: -18 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: .35, delay: .58, type: 'spring', stiffness: 240 }}>↓</motion.b>
          <motion.em initial={{ opacity: 0, x: -28, scale: .82 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: .55, delay: .7, type: 'spring', stiffness: 180 }}>MORE RICHES</motion.em>
        </h1>
        <p>BURNY is live on Solana. Join the community and bring the fire.</p>
        <div className="button-row"><Button>BUY $BURNY</Button><Button dark href="#burn">VIEW THE BURN <ArrowRight size={18}/></Button></div>
        <div className="hero-proof"><span><Flame fill="currentColor"/> LIVE ON PUMP.FUN</span><span><ShieldCheck/> COMMUNITY DRIVEN</span><span><Globe2/> WORLDWIDE MEMES</span></div>
      </motion.div>
      <motion.div className="hero-mascot" initial={{ opacity: 0, y: 45, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .7, delay: .08 }}>
        <div className="mascot-halo" /><div className="mascot-fire-aura" aria-hidden="true"><i/><i/><i/></div>
        <img className="mascot-scene" src="/burny-hero-composite-v5.png" alt="BURNY urinating on a sad inflation coin" />
      </motion.div>
    </div>
    <a className="scroll-cue" href="#about"><span>ENTER THE FIRE</span><ArrowDown /></a>
  </section>
}

function Marquee() {
  const text = 'BURN • BURN • BURN • LESS SUPPLY • MORE FIRE • '
  return <div className="marquee"><div>{text.repeat(6)}</div></div>
}

function About() {
  return <section className="section cream" id="about"><div className="container split about-grid">
    <motion.div {...reveal}><span className="eyebrow">BORN ON PUMP.FUN</span><h2>MEME POWER.<br/><span className="hot">REAL FIRE.</span></h2></motion.div>
    <motion.div className="big-copy" {...reveal}><p>BURNY was born to burn. But we were born to burn together. Every holder brings the fire; every contribution makes $BURNY stronger.</p><div className="mini-features"><span><Flame/> BURN FEAR</span><span><Globe2/> BURN DOUBT</span><span><Gem/> BURN LIMITS</span></div></motion.div>
  </div></section>
}

function BurnMechanism() {
  const cards = [[ShoppingBag, 'REWARDS BUILD', 'Trading activity produces creator rewards under Pump.fun rules.'], [Zap, '50% AUTO BUYBACK', 'Every hour, half of the net claimed rewards is used to buy BURNY.'], [Flame, 'ON-CHAIN BURN', 'The exact tokens bought are permanently burned through Token-2022.']]
  return <section className="section inferno" id="burn"><div className="container"><motion.div className="section-heading light" {...reveal}><span className="eyebrow">THE 50 / 50 ENGINE</span><h2>FEAR OUT.<br/>FIRE IN.</h2><p>The engine checks creator rewards hourly. Half buys and burns BURNY; half stays in the creator wallet.</p></motion.div>
    <div className="process">{cards.map(([Icon, title, copy], i) => <motion.div className="process-wrap" key={title} {...reveal} transition={{ delay: i * .12 }}><div className="process-card"><span className="step">0{i + 1}</span><Icon size={48}/><h3>{title}</h3><p>{copy}</p></div>{i < 2 && <ArrowRight className="process-arrow"/>}</motion.div>)}</div>
    <motion.div className="reward-router" {...reveal}>
      <div><span>50%</span><strong>AUTO BUYBACK<br/>+ BURN</strong></div>
      <div className="router-core" aria-label="Automated fifty-fifty creator rewards allocation"><GitFork/><b>HOURLY<br/>SPLIT</b></div>
      <div><span>50%</span><strong>STAYS IN<br/>THE WALLET</strong></div>
    </motion.div>
    <motion.div className="burn-counter" {...reveal}><span>AUTOMATION LIVE</span><p>The counter above reads the mint supply directly from Solana. No estimates, no simulated numbers.</p><Button href={EXPLORER_URL}>VERIFY SUPPLY ON SOLSCAN <ArrowRight/></Button></motion.div>
  </div></section>
}

function MemeGallery() {
  const [active, setActive] = useState(null)
  return <section className="section cream meme-world" id="memes"><div className="container"><motion.div className="section-heading" {...reveal}><span className="eyebrow">THE BURNY CINEMATIC UNIVERSE</span><h2>MEMES WITH<br/><span className="hot">MAXIMUM HEAT.</span></h2></motion.div>
    <div className="meme-grid">{memes.map((m, i) => <motion.button key={m.title} className={`meme-card m${i + 1}`} whileHover={{ scale: 1.018, rotate: i % 2 ? 0.5 : -0.5 }} onClick={() => setActive(m)} {...reveal}><img src={m.image} alt={m.title} loading="lazy"/><div><h3>{m.title}</h3><p>{m.copy}</p></div></motion.button>)}</div>
    <AnimatePresence>{active && <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActive(null)}><motion.div initial={{ scale: .8 }} animate={{ scale: 1 }} className="lightbox-card meme-lightbox"><button aria-label="Close"><X/></button><img src={active.image} alt={active.title}/><div><h3>{active.title}</h3><p>{active.copy}</p></div></motion.div></motion.div>}</AnimatePresence>
  </div></section>
}

function Tokenomics() {
  return <section className="section dark-section" id="tokenomics"><div className="container token-grid"><motion.div {...reveal}><span className="eyebrow">BURN TOGETHER TOKENOMICS</span><h2>LIVE ON SOLANA.<br/><span className="yellow">RISE TOGETHER.</span></h2><p className="section-copy">Launched on Pump.fun on 11 September 2026. The live 50 / 50 engine applies to creator rewards received, not token supply or a tax on each transfer. Trading fees follow the platform’s current rules.</p></motion.div>
    <motion.div className="burn-ring" {...reveal}><div><Flame fill="currentColor"/><strong>50%</strong><span>AUTO BUY + BURN</span></div></motion.div>
    <div className="token-list">{tokenomics.map(([k, v]) => <motion.div key={k} {...reveal}><span>{k}</span><strong>{v}</strong></motion.div>)}</div>
  </div></section>
}

function HowToBuy() {
  const steps = [[Wallet, 'CREATE WALLET', 'Set up a Solana wallet you control.'], [Gem, 'GET SOL', 'Add SOL for your swap and network fee.'], [Zap, 'CONNECT', 'Open the official BURNY page on Pump.fun and connect your wallet.'], [Flame, 'SWAP FOR $BURNY', 'Verify the contract below, review the quote and confirm your trade.']]
  return <section className="section yellow-section" id="buy"><div className="container"><motion.div className="section-heading centered" {...reveal}><span className="eyebrow">PUMP.FUN LAUNCH</span><h2>BUY THE<br/>REAL $BURNY.</h2><p>BURNY is live. Use the official token page and match the complete Solana contract address before swapping.</p></motion.div><div className="buy-steps">{steps.map(([Icon, title, copy], i) => <motion.div className="buy-step" key={title} {...reveal} transition={{ delay: i * .1 }}><span className="step-num">{i + 1}</span><Icon/><h3>{title}</h3><p>{copy}</p></motion.div>)}</div><ContractAddress/><div className="center"><Button dark>BUY ON PUMP.FUN <ArrowRight/></Button></div></div></section>
}

function Community() {
  return <section className="community" id="community"><div className="container"><motion.div className="community-banner" {...reveal}><Embers/><div><span className="eyebrow">THE $BURNY ARMY</span><h2>BURN TOGETHER.<br/><span>RISE TOGETHER.</span></h2><p>BURNY was born to burn. We were born to burn together. Hold, participate, contribute — bring the fire.</p><div className="community-chant"><span>WE PARTICIPATE.</span><span>WE CONTRIBUTE.</span><span>WE BURN TOGETHER.</span></div><div className="button-row"><Button href={TELEGRAM_URL}><Send/> JOIN THE ARMY</Button><Button href={X_URL}><X/> X / TWITTER</Button><Button href={PUMP_URL}><Sparkles/> LIVE CHART</Button></div></div><div className="community-flame"><Flame fill="currentColor"/></div></motion.div></div></section>
}

function FAQ() {
  const [open, setOpen] = useState(0)
  return <section className="section cream" id="faq"><div className="container faq-grid"><motion.div {...reveal}><span className="eyebrow">FAQ</span><h2>STILL<br/><span className="hot">CURIOUS?</span></h2><p className="section-copy">Good. Never ape into anything without doing your own research.</p></motion.div><div className="faq-list">{faqs.map(([q, a], i) => <motion.div className={`faq-item ${open === i ? 'open' : ''}`} key={q} {...reveal}><button onClick={() => setOpen(open === i ? -1 : i)}><span>{q}</span><ChevronDown/></button><AnimatePresence initial={false}>{open === i && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{a}</motion.p>}</AnimatePresence></motion.div>)}</div></div></section>
}

function ContractAddress() {
  const [copyStatus, setCopyStatus] = useState('')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MINT)
      setCopyStatus('Copied!')
    } catch {
      setCopyStatus('Copy unavailable. Select the address to copy it manually.')
    }
  }
  return <div className="contract-wrap"><div className="contract"><span>SOLANA CONTRACT</span><strong>{MINT}</strong><button onClick={copy} aria-label="Copy BURNY contract address"><Copy/></button></div><p role="status">{copyStatus}</p></div>
}

function Footer() {
  return <footer><div className="container"><div className="footer-main"><a className="footer-wordmark" href="#top" aria-label="BURNY home"><img src="/logo.png?v=1" alt="" /></a><h2>BUILT TO BURN.</h2><div className="footer-socials"><a href={TELEGRAM_URL} aria-label="BURNY Telegram"><Send/></a><a href={X_URL} aria-label="BURNY on X"><X/></a><a href={EXPLORER_URL} aria-label="BURNY on Solscan"><Globe2/></a></div></div><ContractAddress/><div className="footer-bottom"><span>© 2026 BURNY</span><p>$BURNY is a meme coin. Crypto is risky. Do your own research and never spend more than you can afford to lose.</p></div></div></footer>
}

export default function App() {
  return <><main><Hero/><Marquee/><About/><BurnMechanism/><MemeGallery/><Tokenomics/><HowToBuy/><Community/><FAQ/></main><Footer/></>
}
