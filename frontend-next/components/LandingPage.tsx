'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './LandingPage.module.css'
import { useLandingMotion } from './useLandingMotion'
import { useSignalField, type SignalRange } from './useSignalField'

type Props = {
  onOpenAuth: (mode?: 'login' | 'register') => void
}

type RangeKey = SignalRange
type MonitorType = 'Website' | 'API' | 'Status page'
type Interval = '1 min' | '5 min' | '15 min'
type Channel = 'Email' | 'Webhook'
type BadgeTheme = 'dark' | 'light'
type LandingTheme = 'dark' | 'light'

const rangeData: Record<RangeKey, { label: string; uptime: string; bars: number; down: number[] }> = {
  '24h': { label: 'Last 24 hours', uptime: '100.00%', bars: 24, down: [] },
  '7d': { label: 'Last 7 days', uptime: '99.99%', bars: 28, down: [11] },
  '30d': { label: 'Last 30 days', uptime: '99.98%', bars: 30, down: [9, 22] },
}

const monitorTypes: Record<MonitorType, { host: string; path: string }> = {
  Website: { host: 'your-site.com', path: 'Homepage' },
  API: { host: 'api.your-site.com', path: 'Health endpoint' },
  'Status page': { host: 'status.your-site.com', path: 'Public page' },
}

const faqs = [
  {
    q: 'What can I monitor?',
    a: 'Any public web address: a marketing site, an API endpoint, or a status page.',
  },
  {
    q: 'How often does it check?',
    a: 'Every five minutes by default. Each check records the status, the response time, and why it failed.',
  },
  {
    q: 'How will I know?',
    a: 'Email and webhook alerts, sent when a monitor changes state.',
  },
  {
    q: 'Can I share the result?',
    a: 'Yes. Publish a status page for any monitor and share it with people who do not have an account.',
  },
]

function Timeline({ bars, down, className }: { bars: number; down: number[]; className?: string }) {
  return (
    <div className={`${styles.timeline} ${className ?? ''}`} aria-hidden="true" data-timeline>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={`${styles.bar} ${down.includes(i) ? styles.barDown : ''}`}
        />
      ))}
    </div>
  )
}

export default function LandingPage({ onOpenAuth }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const signalCanvasRef = useRef<HTMLCanvasElement>(null)
  const featuresCanvasRef = useRef<HTMLCanvasElement>(null)
  const statusCanvasRef = useRef<HTMLCanvasElement>(null)
  const faqCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctaCanvasRef = useRef<HTMLCanvasElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [range, setRange] = useState<RangeKey>('30d')
  const [monitorType, setMonitorType] = useState<MonitorType>('Website')
  const [interval, setInterval] = useState<Interval>('5 min')
  const [channel, setChannel] = useState<Channel>('Email')
  const [publicPage, setPublicPage] = useState(true)
  const [badgeTheme, setBadgeTheme] = useState<BadgeTheme>('dark')
  const [activeFaq, setActiveFaq] = useState(0)
  const [landingTheme, setLandingTheme] = useState<LandingTheme>('dark')

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem('kingx_landing_theme')
    } catch {
      return
    }
    if (saved !== 'dark' && saved !== 'light') return
    const next = saved
    const id = window.setTimeout(() => setLandingTheme(next), 0)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    const html = document.documentElement
    const previousBody = document.body.style.backgroundColor
    const previousHtml = html.style.backgroundColor
    const previousScheme = html.style.colorScheme
    const background = landingTheme === 'dark' ? '#050607' : '#f3f1ea'
    document.body.style.backgroundColor = background
    html.style.backgroundColor = background
    html.style.colorScheme = landingTheme
    return () => {
      document.body.style.backgroundColor = previousBody
      html.style.backgroundColor = previousHtml
      html.style.colorScheme = previousScheme
    }
  }, [landingTheme])

  useEffect(() => {
    const html = document.documentElement
    const previousPadding = html.style.scrollPaddingTop
    const previousBehavior = html.style.scrollBehavior
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches
    html.style.scrollPaddingTop = '88px'
    if (!reduceMotion && coarsePointer) html.style.scrollBehavior = 'smooth'
    return () => {
      html.style.scrollPaddingTop = previousPadding
      html.style.scrollBehavior = previousBehavior
    }
  }, [])

  useLandingMotion(rootRef)
  useSignalField(signalCanvasRef, landingTheme, range)
  useSignalField(featuresCanvasRef, landingTheme, range)
  useSignalField(statusCanvasRef, landingTheme, range)
  useSignalField(faqCanvasRef, landingTheme, range)
  useSignalField(ctaCanvasRef, landingTheme, range, true)

  const selectedRange = rangeData[range]
  const selectedMonitor = monitorTypes[monitorType]

  const toggleLandingTheme = () => {
    const next = landingTheme === 'dark' ? 'light' : 'dark'
    setLandingTheme(next)
    try {
      localStorage.setItem('kingx_landing_theme', next)
    } catch {
      return
    }
  }

  return (
    <div className={styles.root} ref={rootRef} data-theme={landingTheme}>
      <a href="#main" className={styles.skipLink}>Skip to content</a>

      <header className={styles.header}>
        <div className={`${styles.shell} ${styles.headerRow}`}>
          <a href="#top" className={styles.brand} aria-label="KingX home">
            <span className={styles.brandMark} aria-hidden="true" />
            KingX
          </a>

          <div className={styles.headerActions}>
            <nav className={styles.nav} aria-label="Main">
              <a href="#product" className={styles.navLink}>Product</a>
              <a href="#status-page" className={styles.navLink}>Status pages</a>
              <a href="#questions" className={styles.navLink}>Questions</a>
              <button type="button" className={styles.navAction} onClick={() => onOpenAuth('login')}>Sign in</button>
            </nav>

            <button
              type="button"
              className={styles.themeToggle}
              role="switch"
              aria-checked={landingTheme === 'light'}
              aria-label="Light theme"
              onClick={toggleLandingTheme}
            >
              <span className={styles.themeTrack} aria-hidden="true">
                <span className={styles.themeThumb} />
              </span>
              <span className={styles.themeText}>{landingTheme === 'light' ? 'Light' : 'Dark'}</span>
            </button>

            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="landing-menu"
            >
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="landing-menu" className={styles.menu}>
            <a href="#product" className={styles.menuLink} onClick={() => setMenuOpen(false)}>Product</a>
            <a href="#status-page" className={styles.menuLink} onClick={() => setMenuOpen(false)}>Status pages</a>
            <a href="#questions" className={styles.menuLink} onClick={() => setMenuOpen(false)}>Questions</a>
            <button
              type="button"
              className={styles.menuAction}
              onClick={() => { setMenuOpen(false); onOpenAuth('login') }}
            >
              Sign in
            </button>
          </div>
        )}
      </header>

      <main id="main">
        <section className={styles.hero} id="top" aria-labelledby="hero-title">
          <canvas ref={signalCanvasRef} className={styles.signalField} aria-hidden="true" />

          <div className={`${styles.shell} ${styles.heroStage}`}>
            <div className={styles.heroGrid}>
              <div className={styles.heroIntro}>
                <h1 id="hero-title" className={styles.heroHeadline}>
                  <span>{"You'll know"}</span>
                  <span>when it breaks.</span>
                </h1>

                <p className={styles.heroCopy}>
                  KingX checks your sites every five minutes and tells you the moment one stops responding.
                </p>

                <div className={styles.heroActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => onOpenAuth('register')}
                  >
                    Start monitoring
                  </button>
                </div>
              </div>

              <div className={styles.heroFrame}>
                <div className={styles.heroScene} data-hero-scene>
                  <div className={styles.heroTilt} data-hero-tilt>
                    <div className={styles.statusCard} data-ui="true" aria-label="Monitor preview">
                      <div className={styles.statusTop}>
                        <span className={styles.previewLabel}>Preview</span>
                        <span className={styles.previewLabel}>{selectedMonitor.path}</span>
                      </div>

                      <div className={styles.statusMonitor}>
                        <span className={`${styles.dot} ${styles.dotLive}`} aria-hidden="true" />
                        <div className={styles.monitorText}>
                          <span className={styles.monitorHost}>{selectedMonitor.host}</span>
                          <span className={styles.monitorPath}>{monitorType}</span>
                        </div>
                        <span className={styles.statusState}>Operational</span>
                      </div>

                      <div className={styles.uptimeRow}>
                        <span className={styles.uptimeValue}>{selectedRange.uptime}</span>
                        <span className={styles.uptimeMeta}>{selectedRange.label}<br />Uptime</span>
                      </div>

                      <fieldset className={styles.range}>
                        <legend className={styles.srOnly}>Time range</legend>
                        {(['24h', '7d', '30d'] as RangeKey[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            className={styles.rangeButton}
                            aria-pressed={range === key}
                            onClick={() => setRange(key)}
                          >
                            {key}
                          </button>
                        ))}
                      </fieldset>

                      <Timeline bars={selectedRange.bars} down={selectedRange.down} />

                      <div className={styles.statusFooter}>
                        <span>Response 182 ms</span>
                        <span>Checked 30s ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.heroFoot} aria-hidden="true">
              <span>Signal preview</span>
              <span className={styles.heroHint}>
                <span className={styles.hintPointer}>Move to disturb</span>
                <span className={styles.hintTouch}>Tap to disturb</span>
              </span>
            </div>
          </div>
        </section>

        <section id="product" className={styles.features} aria-labelledby="product-title">
          <canvas ref={featuresCanvasRef} className={styles.signalField} aria-hidden="true" />

          <div className={`${styles.shell} ${styles.featuresGrid}`}>
            <div className={styles.featuresSticky}>
              <div className={styles.outputDepth} data-reveal>
                <div className={styles.outputCard} data-ui="true" aria-label="Monitor configuration preview">
                  <div className={styles.outputTop}>
                    <span className={styles.previewLabel}>Preview</span>
                    <span className={styles.previewLabel}>{monitorType}</span>
                  </div>
                  <p className={styles.outputHost}>{selectedMonitor.host}</p>
                  <p className={styles.outputPath}>{selectedMonitor.path}</p>

                  <div className={styles.outputState}>
                    <span className={styles.dot} aria-hidden="true" />
                    <span>Operational</span>
                  </div>

                  <div className={styles.outputUptimeRow}>
                    <span className={styles.outputUptime}>{rangeData['30d'].uptime}</span>
                    <span className={styles.outputUptimeMeta}>Last 30 days<br />Uptime</span>
                  </div>

                  <Timeline bars={30} down={[9, 22]} className={styles.outputTimeline} />

                  <div className={styles.outputMeta}>
                    <div className={styles.outputMetaItem}>
                      <span className={styles.outputMetaLabel}>Check</span>
                      <span className={styles.outputMetaValue}>{interval}</span>
                    </div>
                    <div className={styles.outputMetaItem}>
                      <span className={styles.outputMetaLabel}>Alert</span>
                      <span className={styles.outputMetaValue}>{channel}</span>
                    </div>
                    <div className={styles.outputMetaItem}>
                      <span className={styles.outputMetaLabel}>Page</span>
                      <span className={styles.outputMetaValue}>{publicPage ? 'Public' : 'Private'}</span>
                    </div>
                  </div>

                  <p className={styles.outputMetaCompact}>
                    {interval}, {channel}, {publicPage ? 'Public' : 'Private'}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.featuresContent}>
              <div className={styles.sectionHead}>
                <h2 id="product-title">Watch, record, tell.</h2>
                <p data-reveal style={{ '--reveal-delay': '70ms' } as React.CSSProperties}>
                  Set an address once. KingX handles the rest.
                </p>
              </div>

              <div className={styles.featureBlock}>
                <h3>Watch any endpoint.</h3>
                <p data-reveal style={{ '--reveal-delay': '70ms' } as React.CSSProperties}>
                  A website, an API, or a status page. One address is enough to begin.
                </p>
                <div
                  className={styles.controlGroup}
                  role="group"
                  aria-label="Monitor type"
                  data-reveal
                  style={{ '--reveal-delay': '140ms' } as React.CSSProperties}
                >
                  {(['Website', 'API', 'Status page'] as MonitorType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={styles.controlButton}
                      aria-pressed={monitorType === type}
                      onClick={() => setMonitorType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.featureBlock}>
                <h3>Choose the rhythm.</h3>
                <p data-reveal style={{ '--reveal-delay': '70ms' } as React.CSSProperties}>
                  Check as often as you need. Every result is recorded.
                </p>
                <div
                  className={styles.controlGroup}
                  role="group"
                  aria-label="Check interval"
                  data-reveal
                  style={{ '--reveal-delay': '140ms' } as React.CSSProperties}
                >
                  {(['1 min', '5 min', '15 min'] as Interval[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={styles.controlButton}
                      aria-pressed={interval === value}
                      onClick={() => setInterval(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.featureBlock}>
                <h3>Tell the right people.</h3>
                <p data-reveal style={{ '--reveal-delay': '70ms' } as React.CSSProperties}>
                  Send an alert by email or webhook when the state changes.
                </p>
                <div
                  className={styles.controlGroup}
                  role="group"
                  aria-label="Alert channel"
                  data-reveal
                  style={{ '--reveal-delay': '140ms' } as React.CSSProperties}
                >
                  {(['Email', 'Webhook'] as Channel[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={styles.controlButton}
                      aria-pressed={channel === value}
                      onClick={() => setChannel(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.featureBlock}>
                <h3>Share the answer.</h3>
                <p data-reveal style={{ '--reveal-delay': '70ms' } as React.CSSProperties}>
                  Publish a status page your customers can read without an account.
                </p>
                <button
                  type="button"
                  className={styles.toggle}
                  role="switch"
                  aria-checked={publicPage}
                  onClick={() => setPublicPage(!publicPage)}
                  data-reveal
                  style={{ '--reveal-delay': '140ms' } as React.CSSProperties}
                >
                  <span className={styles.toggleTrack} aria-hidden="true">
                    <span className={styles.toggleThumb} />
                  </span>
                  <span>Public status page</span>
                  <span className={styles.toggleState}>{publicPage ? 'On' : 'Off'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="status-page" className={styles.statusSection} aria-labelledby="status-title">
          <canvas ref={statusCanvasRef} className={styles.signalField} aria-hidden="true" />

          <div className={`${styles.shell} ${styles.statusGrid}`}>
            <div className={styles.statusCopy}>
              <h2 id="status-title">The page your customers check.</h2>
              <p data-reveal style={{ '--reveal-delay': '70ms' } as React.CSSProperties}>
                Publish a plain status page. It shows what is up, what is down, and what changed, without exposing your dashboard.
              </p>

              <dl className={styles.statusFacts}>
                <div>
                  <dt>Access</dt>
                  <dd>Public link</dd>
                </div>
                <div>
                  <dt>Account</dt>
                  <dd>Not required</dd>
                </div>
                <div>
                  <dt>Exposes</dt>
                  <dd>Status only</dd>
                </div>
              </dl>

              <div
                className={styles.badgeDepth}
                data-reveal
                style={{ '--reveal-delay': '140ms' } as React.CSSProperties}
              >
                <div className={styles.badgeCard} data-ui="true" aria-label="Status badge preview">
                  <div>
                    <p className={styles.badgeLabel}>Status badge</p>
                    <div className={`${styles.badgePreview} ${badgeTheme === 'light' ? styles.badgePreviewLight : ''}`}>
                      <span className={styles.dot} aria-hidden="true" />
                      <span className={styles.badgeText}>Operational</span>
                      <span className={styles.badgeMeta}>99.98%</span>
                    </div>
                  </div>
                  <div className={styles.badgeControl} role="group" aria-label="Badge theme">
                    {(['dark', 'light'] as BadgeTheme[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={styles.badgeButton}
                        aria-pressed={badgeTheme === value}
                        onClick={() => setBadgeTheme(value)}
                      >
                        {value === 'dark' ? 'Dark' : 'Light'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={styles.statusPanelDepth}
              data-reveal
              style={{ '--reveal-delay': '140ms' } as React.CSSProperties}
            >
              <div className={styles.statusPanel}>
                <div className={styles.statusPanelBar}>
                  <span className={styles.statusPanelUrl}>status.your-site.com</span>
                  <span className={styles.statusPanelTag}>Public</span>
                </div>

                <div className={styles.statusPanelHead}>
                  <div>
                    <span className={styles.previewLabel}>Preview</span>
                    <p className={styles.statusPanelTitle}>Your status page</p>
                  </div>
                  <span className={styles.statusPanelState}>
                    <span className={styles.dot} aria-hidden="true" />
                    Operational
                  </span>
                </div>

                <div className={styles.statusPanelRows} data-ui="true" aria-label="Status page rows preview">
                  {[
                    { name: 'Website', uptime: '99.98%' },
                    { name: 'API', uptime: '99.99%' },
                    { name: 'Status page', uptime: '100.00%' },
                  ].map((row) => (
                    <div className={styles.statusPanelRow} key={row.name}>
                      <span className={styles.statusPanelName}>{row.name}</span>
                      <span className={styles.statusPanelState}>
                        <span className={styles.dot} aria-hidden="true" />
                        Operational
                      </span>
                      <span className={styles.statusPanelUptime}>{row.uptime}</span>
                    </div>
                  ))}
                </div>

                <Timeline bars={30} down={[9, 22]} className={styles.statusTimeline} />

                <div className={styles.statusPanelFootRow}>
                  <p className={styles.statusPanelFoot}>Updated 30 seconds ago</p>
                  <span className={styles.statusPanelFootMeta}>Read only</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="questions" className={styles.faq} aria-labelledby="faq-title">
          <canvas ref={faqCanvasRef} className={styles.signalField} aria-hidden="true" />

          <div className={`${styles.shell} ${styles.faqGrid}`}>
            <div>
              <h2 id="faq-title">Questions, answered.</h2>
              <div className={styles.faqList}>
                {faqs.map((item, i) => (
                  <div
                    key={item.q}
                    className={`${styles.faqItem} ${activeFaq === i ? styles.faqItemActive : ''}`}
                    data-reveal
                    style={{ '--reveal-delay': `${i * 60}ms` } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      className={styles.faqQuestion}
                      aria-expanded={activeFaq === i}
                      aria-controls={`faq-inline-${i}`}
                      onClick={() => setActiveFaq(i)}
                      onMouseEnter={() => setActiveFaq(i)}
                      onFocus={() => setActiveFaq(i)}
                    >
                      <span className={styles.faqText}>{item.q}</span>
                      <span className={styles.faqMark} aria-hidden="true" />
                    </button>
                    <p id={`faq-inline-${i}`} className={styles.faqInline} hidden={activeFaq !== i}>
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.faqAnswerPane} aria-live="polite">
              <span className={styles.faqGlyph} aria-hidden="true">?</span>
              <p key={activeFaq} className={styles.faqAnswer}>{faqs[activeFaq].a}</p>
            </div>
          </div>
        </section>

        <section className={styles.cta} aria-labelledby="cta-title">
          <canvas ref={ctaCanvasRef} className={styles.signalField} aria-hidden="true" />
          <span className={styles.ctaOrbit} aria-hidden="true" />
          <div className={`${styles.shell} ${styles.ctaShell}`}>
            <div className={styles.ctaInner}>
              <div className={styles.ctaCopyBlock}>
                <h2 id="cta-title" className={styles.ctaTitle}>Start with one URL.</h2>
                <p className={styles.ctaCopy} data-reveal style={{ '--reveal-delay': '70ms' } as React.CSSProperties}>
                  Create an account, add a site, and see the first check.
                </p>
              </div>
              <button type="button" className={styles.ctaButton} onClick={() => onOpenAuth('register')}>
                Create your account
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerRow}`}>
          <div className={styles.footerIdentity}>
            <a href="#top" className={styles.footerBrand} aria-label="KingX home">
              <span className={styles.brandMark} aria-hidden="true" />
              KingX
            </a>
            <p>Know the moment a site stops responding.</p>
          </div>

          <nav className={styles.footerNav} aria-label="Footer">
            <a href="#product" className={styles.footerLink}>Product</a>
            <a href="#status-page" className={styles.footerLink}>Status pages</a>
            <a href="#questions" className={styles.footerLink}>Questions</a>
          </nav>

          <a href="#top" className={styles.footerTop}>Back to top</a>
        </div>

        <div className={`${styles.shell} ${styles.footerBase}`}>
          <p>KingX, uptime monitoring.</p>
          <p>{new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
