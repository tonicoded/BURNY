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

const tokenomics = [
  ['LAUNCH', 'PUMP.FUN'], ['LAUNCH SUPPLY', '1B $BURNY'], ['CREATOR REWARDS', '50 / 50'],
  ['FIRE SHARE', '50% BUYBACK + BURN'], ['GROWTH SHARE', '50% BUILD + MEMES']
]

const memes = [
  { title: 'BURNY × PONKE', image: '/meme-burny-ponke-launch-v1.png', copy: 'Two legends. One launchpad. Maximum send.' },
  { title: 'THE BURN ENGINE', image: '/meme-burn-engine-v1.png', copy: 'Creator rewards enter. Supply leaves.' },
  { title: 'MEME ALLIANCE', image: '/meme-alliance-v1.png', copy: 'BURNY, PONKE and the whole timeline charging forward.' }
]

const faqs = [
  ['What is BURNY?', 'BURNY is a fire-powered meme coin with a simple idea: every transaction feeds the flame and reduces supply.'],
  ['How does the burn mechanism work?', 'A portion of every eligible transaction is permanently sent out of circulation. The exact launch configuration will be published before trading opens.'],
  ['Is the supply actually reduced?', 'Yes. Burned tokens are permanently removed from the circulating supply and can be verified on-chain.'],
  ['Where can I buy $BURNY?', 'The official swap and chart links will appear here at launch. Always verify the contract address on this website.'],
  ['What chain is BURNY on?', 'BURNY is designed for Solana: fast, accessible, and made for the meme economy.'],
  ['Is liquidity locked?', 'Liquidity lock details and verification links will be published before launch.']
]

const reveal = { initial: { opacity: 0, y: 35 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .2 }, transition: { duration: .55 } }

function Button({ children, dark = false, href = '#buy', className = '' }) {
  return <motion.a whileTap={{ scale: .94 }} whileHover={{ y: -3 }} className={`comic-button ${dark ? 'dark' : ''} ${className}`} href={href}>{children}</motion.a>
}

function Embers() {
  return <div className="embers" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--i': i, '--x': `${(i * 37) % 100}%`, '--d': `${4 + (i % 6)}s` }} />)}</div>
}

function Hero() {
  return <section className="hero" id="top">
    <img className="hero-bg" src="/burny-city-v2.png" alt="A fiery illustrated city at sunset" />
    <div className="hero-shade" />
    <Embers />
    <div className="hero-brandbar">
      <a className="hero-wordmark" href="#top" aria-label="BURNY home"><img src="/burny-flame-face.png?v=2" alt="" /></a>
      <nav className="hero-nav">{navLinks.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <div className="hero-brand-actions"><a className="hero-telegram" href="#community" aria-label="Telegram"><Send /></a><Button href="#buy" className="hero-buy">BUY $BURNY</Button></div>
    </div>
    <div className="hero-layout container">
      <motion.div className="hero-copy" initial={{ opacity: 0, x: -35 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .65 }}>
        <span className="eyebrow hero-tagline">BURNY — BORN TO BURN</span>
        <span className="launch-chip">LAUNCHING ON PUMP.FUN</span>
        <h1 aria-label="Less supply, more riches">
          <motion.span initial={{ opacity: 0, x: -28, scale: .82 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: .55, delay: .18, type: 'spring', stiffness: 180 }}>LESS SUPPLY</motion.span>
          <motion.b className="hero-impact-arrow" aria-hidden="true" initial={{ opacity: 0, scale: 0, rotate: -18 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: .35, delay: .58, type: 'spring', stiffness: 240 }}>↓</motion.b>
          <motion.em initial={{ opacity: 0, x: -28, scale: .82 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: .55, delay: .7, type: 'spring', stiffness: 180 }}>MORE RICHES</motion.em>
        </h1>
        <p>Every transaction burns. Supply goes down. BURNY goes up.</p>
        <div className="button-row"><Button>BUY $BURNY</Button><Button dark href="#burn">VIEW THE BURN <ArrowRight size={18}/></Button></div>
        <div className="hero-proof"><span><Flame fill="currentColor"/> DEFLATIONARY</span><span><ShieldCheck/> COMMUNITY DRIVEN</span><span><Globe2/> WORLDWIDE MEMES</span></div>
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
    <motion.div className="big-copy" {...reveal}><p>BURNY launches through the Pump.fun bonding curve. Then our creator-rewards router turns half of every creator reward received into market buybacks and permanent burns.</p><div className="mini-features"><span><Flame/> 50% TO THE FIRE</span><span><Globe2/> COMMUNITY FIRST</span><span><Gem/> BUILT TO MEME</span></div></motion.div>
  </div></section>
}

function BurnMechanism() {
  const cards = [[ShoppingBag, 'PUMP.FUN TRADES', 'Eligible trading activity produces creator rewards under Pump.fun rules.'], [Zap, 'AUTO BUYBACK', '50% of rewards received are routed to automatically buy $BURNY from the market.'], [Flame, 'BURN SUPPLY', 'Bought-back tokens are sent out of circulation. The remaining 50% fuels growth.']]
  const [count, setCount] = useState(24391820)
  useEffect(() => { const id = setInterval(() => setCount(v => v + Math.floor(Math.random() * 19)), 1800); return () => clearInterval(id) }, [])
  return <section className="section inferno" id="burn"><div className="container"><motion.div className="section-heading light" {...reveal}><span className="eyebrow">THE 50 / 50 ENGINE</span><h2>REWARDS IN.<br/>SUPPLY OUT.</h2><p>Creator rewards actually received are split by the BURNY router: half to buyback and burn, half to building the brand.</p></motion.div>
    <div className="process">{cards.map(([Icon, title, copy], i) => <motion.div className="process-wrap" key={title} {...reveal} transition={{ delay: i * .12 }}><div className="process-card"><span className="step">0{i + 1}</span><Icon size={48}/><h3>{title}</h3><p>{copy}</p></div>{i < 2 && <ArrowRight className="process-arrow"/>}</motion.div>)}</div>
    <motion.div className="reward-router" {...reveal}>
      <div><span>50%</span><strong>AUTO BUYBACK<br/>+ BURN</strong></div>
      <div className="router-core" aria-label="Automatic fifty-fifty creator rewards split"><GitFork/><b>AUTO<br/>SPLIT</b></div>
      <div><span>50%</span><strong>GROWTH<br/>+ MEMES</strong></div>
    </motion.div>
    <motion.div className="burn-counter" {...reveal}><span>COMMUNITY BURN METER</span><strong>{count.toLocaleString('en-US')} <small>$BURNY</small></strong><div className="live-dot">DEMO UNTIL LAUNCH</div></motion.div>
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
  return <section className="section dark-section" id="tokenomics"><div className="container token-grid"><motion.div {...reveal}><span className="eyebrow">PUMP.FUN TOKENOMICS</span><h2>FAIR LAUNCH.<br/><span className="yellow">50 / 50 FIRE.</span></h2><p className="section-copy">Pump.fun determines platform fees through its smart contracts. BURNY's 50/50 policy applies to creator rewards actually received by our reward router.</p></motion.div>
    <motion.div className="burn-ring" {...reveal}><div><Flame fill="currentColor"/><strong>50%</strong><span>TO THE FIRE</span></div></motion.div>
    <div className="token-list">{tokenomics.map(([k, v]) => <motion.div key={k} {...reveal}><span>{k}</span><strong>{v}</strong></motion.div>)}</div>
  </div></section>
}

function BurnEngine() {
  return <section className="section engine"><div className="container"><motion.div className="section-heading centered" {...reveal}><span className="eyebrow">THE BURN ENGINE</span><h2>ONE TX. ONE LESS.</h2><p>Each transaction permanently removes tokens from circulation.</p></motion.div>
    <motion.div className="engine-track" {...reveal}>
      <div className="coin before"><Flame/><strong>100</strong><span>$BURNY</span></div>
      <div className="burn-chamber" aria-label="One BURNY permanently burned">
        <div className="burn-chamber-flame"><Flame fill="currentColor"/></div>
        <strong>−1 $BURNY</strong><span>PERMANENTLY BURNED</span>
        <div className="burn-embers" aria-hidden="true"><i/><i/><i/></div>
      </div>
      <ArrowRight className="engine-arrow"/>
      <div className="coin after"><Check/><strong>99</strong><span>$BURNY</span></div>
    </motion.div>
  </div></section>
}

function HowToBuy() {
  const steps = [[Wallet, 'CREATE WALLET', 'Set up a Solana wallet you control.'], [Gem, 'GET SOL', 'Add SOL for your swap and network fee.'], [Zap, 'CONNECT', 'Open the official swap and connect.'], [Flame, 'SWAP FOR $BURNY', 'Paste the verified contract and fire away.']]
  return <section className="section yellow-section" id="buy"><div className="container"><motion.div className="section-heading centered" {...reveal}><span className="eyebrow">PUMP.FUN LAUNCH</span><h2>ENTER THE<br/>BONDING CURVE.</h2><p>Official Pump.fun link and contract address appear here at launch. Always verify before swapping.</p></motion.div><div className="buy-steps">{steps.map(([Icon, title, copy], i) => <motion.div className="buy-step" key={title} {...reveal} transition={{ delay: i * .1 }}><span className="step-num">{i + 1}</span><Icon/><h3>{title}</h3><p>{copy}</p></motion.div>)}</div><div className="center"><Button dark>BUY ON PUMP.FUN <ArrowRight/></Button></div></div></section>
}

function Community() {
  return <section className="community" id="community"><div className="container"><motion.div className="community-banner" {...reveal}><Embers/><div><span className="eyebrow">BURN TOGETHER</span><h2>THE FIRE GETS<br/>BIGGER TOGETHER.</h2><p>Memes, updates, burns and a community that keeps the flame moving.</p><div className="button-row"><Button><Send/> TELEGRAM</Button><Button><X/> X / TWITTER</Button><Button><Sparkles/> DEXSCREENER</Button></div></div><div className="community-flame"><Flame fill="currentColor"/></div></motion.div></div></section>
}

function FAQ() {
  const [open, setOpen] = useState(0)
  return <section className="section cream" id="faq"><div className="container faq-grid"><motion.div {...reveal}><span className="eyebrow">FAQ</span><h2>STILL<br/><span className="hot">CURIOUS?</span></h2><p className="section-copy">Good. Never ape into anything without doing your own research.</p></motion.div><div className="faq-list">{faqs.map(([q, a], i) => <motion.div className={`faq-item ${open === i ? 'open' : ''}`} key={q} {...reveal}><button onClick={() => setOpen(open === i ? -1 : i)}><span>{q}</span><ChevronDown/></button><AnimatePresence initial={false}>{open === i && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{a}</motion.p>}</AnimatePresence></motion.div>)}</div></div></section>
}

function Footer() {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard?.writeText('CONTRACT COMING SOON'); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return <footer><div className="container"><div className="footer-main"><a className="footer-wordmark" href="#top" aria-label="BURNY home"><img src="/burny-flame-face.png?v=2" alt="" /></a><h2>BUILT TO BURN.</h2><div className="footer-socials"><a href="#community"><Send/></a><a href="#community"><X/></a><a href="#community"><Globe2/></a></div></div><button className="contract" onClick={copy}><span>CONTRACT</span><strong>{copied ? 'COPIED!' : 'COMING SOON'}</strong><Copy/></button><div className="footer-bottom"><span>© 2026 BURNY</span><p>$BURNY is a meme coin. Crypto is risky. Do your own research and never spend more than you can afford to lose.</p></div></div></footer>
}

export default function App() {
  return <><main><Hero/><Marquee/><About/><BurnMechanism/><MemeGallery/><Tokenomics/><BurnEngine/><HowToBuy/><Community/><FAQ/></main><Footer/></>
}

