import { useState } from 'react'
import HomePage from './components/HomePage'
import SeatsPage from './components/SeatsPage'
import PredictionsPage from './components/PredictionsPage'
import FoodPage from './components/FoodPage'

const TABS = ['홈', '자리', '예측', '먹거리']

export default function App() {
  const [tab, setTab] = useState(0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
        @keyframes up { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes glow { from { box-shadow: 0 0 6px rgba(255,149,0,.4) } to { box-shadow: 0 0 14px rgba(255,149,0,.75) } }
        @keyframes glowCardD { from { box-shadow: 0 0 8px rgba(27,45,110,.2) } to { box-shadow: 0 0 22px rgba(27,45,110,.5) } }
        @keyframes glowCardK { from { box-shadow: 0 0 8px rgba(206,14,45,.2) } to { box-shadow: 0 0 22px rgba(206,14,45,.5) } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <nav aria-label="주요 메뉴" style={s.nav}>
        <div style={s.navLogo}>⚾ <span style={{ color: 'var(--d)' }}>분당우리</span> 고등부</div>
        <div style={s.navTabs}>
          {TABS.map((t, i) => (
            <button key={t} type="button" aria-current={tab === i ? 'page' : undefined} style={{ ...s.navTab, ...(tab === i ? s.navTabActive : {}) }} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>
      </nav>

      <div style={s.pw}>
        <div style={{ ...s.slider, transform: `translateX(-${tab * 100}%)` }}>
          <HomePage onNav={setTab} />
          <SeatsPage />
          <PredictionsPage />
          <FoodPage />
        </div>
      </div>
    </>
  )
}

const s = {
  nav: { position: 'relative', zIndex: 10, height: 52, background: 'rgba(242,242,247,.95)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid var(--sep)', display: 'flex', alignItems: 'center', padding: '0 14px', flexShrink: 0 },
  navLogo: { fontSize: 14, fontWeight: 800, color: 'var(--w)', marginRight: 'auto', letterSpacing: '-.3px', lineHeight: 1.2 },
  navTabs: { display: 'flex', gap: 2 },
  navTab: { fontSize: 12, fontWeight: 500, color: 'var(--g)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 9px', borderRadius: 8, transition: 'all .15s', whiteSpace: 'nowrap', fontFamily: 'var(--body)' },
  navTabActive: { color: 'var(--d)', background: 'var(--d-light)', fontWeight: 700 },
  pw: { flex: 1, overflow: 'hidden', position: 'relative' },
  slider: { display: 'flex', height: '100%', transition: 'transform .38s cubic-bezier(.4,0,.2,1)' },
}
