import { useState, useRef } from 'react'
import { ROWS, ROW_LABELS, SEAT_NAMES } from '../data'

export default function SeatsPage() {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  const highlighted = new Set()
  if (query.length >= 2) {
    ROWS.flat().forEach(n => {
      if (SEAT_NAMES[n]?.includes(query)) highlighted.add(n)
    })
  }

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.secHdr}>자리 <em style={{ color: 'var(--d)', fontStyle: 'normal' }}>안내</em></div>

        {/* 검색 */}
        <div style={s.searchWrap}>
          <span style={s.searchIco}>🔍</span>
          <input
            ref={inputRef}
            style={s.searchInp}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="이름으로 내 자리 찾기 (2글자 이상)"
          />
          {query && (
            <button style={s.searchX} onClick={() => { setQuery(''); inputRef.current?.focus() }}>✕</button>
          )}
        </div>

        {/* 좌석 그리드 */}
        <div style={s.sgWrap}>
          <div style={s.sgLbl}>중앙 네이비석 · 172–233 구역</div>
          <div style={s.sg}>
            {ROWS.map((row, ri) => (
              <>
                <div key={'lbl'+ri} style={s.sgRl}>{ROW_LABELS[ri]}</div>
                {row.map(n => {
                  const hl = highlighted.has(n)
                  return (
                    <div key={n} id={'sc'+n} style={{ ...s.sc, ...(hl ? s.scHl : {}) }}>
                      <div style={{ ...s.scN, ...(hl ? { color: 'var(--y2)' } : {}) }}>{n}</div>
                      <div style={{ ...s.scName, ...(hl ? { color: 'var(--y2)', fontWeight: 900 } : {}) }}>
                        {SEAT_NAMES[n] || ''}
                      </div>
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>

        {/* 좌석 안내 카드 */}
        <div style={s.gateCard}>
          <div style={s.gateT1}>입장 게이트</div>
          <div style={s.gateT2}>3루 쪽 게이트 이용</div>
          <div style={s.gateT3}>317구역 — 네이비석 중앙</div>
        </div>

        {/* 입장 안내 카드 */}
        <div style={s.entryCard}>
          <div style={s.entryTitle}>🎟️ 입장 안내</div>
          <div style={s.entryRow}>
            <span style={s.entryIcon}>🎟️</span>
            <div>
              <div style={s.entryLabel}>티켓 수령</div>
              <div style={s.entryValue}>종합운동장역 6번 출구 앞 공터</div>
              <div style={s.entrySub}>18:10부터 수령 시작</div>
            </div>
          </div>
          <div style={s.entryDivider} />
          <div style={s.entryRow}>
            <span style={s.entryIcon}>⚠️</span>
            <div>
              <div style={s.entryLabel}>늦게 도착하시는 분</div>
              <div style={s.entryValue}>18:30 이후 도착 예정이시면</div>
              <div style={s.entrySub}>미리 연락 주세요 — 별도 안내드릴게요</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { flex: '0 0 100%', width: '100%', height: '100%', overflowY: 'auto', padding: '18px 14px 72px', scrollbarWidth: 'none' },
  inner: { maxWidth: 640, margin: '0 auto' },
  secHdr: { fontSize: 22, fontWeight: 800, color: 'var(--w)', letterSpacing: '-.4px', marginBottom: 14 },
  searchWrap: { position: 'relative', marginBottom: 12 },
  searchInp: { width: '100%', background: 'var(--card)', border: 'none', borderRadius: 'var(--rs)', boxShadow: 'var(--shadow-sm)', color: 'var(--w)', fontFamily: 'var(--body)', fontSize: 15, padding: '11px 38px 11px 36px', outline: 'none' },
  searchIco: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--g)', pointerEvents: 'none' },
  searchX: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'var(--g)', border: 'none', borderRadius: '50%', width: 18, height: 18, color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  sgWrap: { background: 'var(--card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', padding: 14, marginBottom: 10, overflowX: 'auto' },
  sgLbl: { fontSize: 10, fontWeight: 600, color: 'var(--g)', letterSpacing: '.6px', textTransform: 'uppercase', marginBottom: 10 },
  sg: { display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, minWidth: 280, maxWidth: 520, margin: '0 auto' },
  sgRl: { gridColumn: '1 / -1', fontSize: 9, color: 'var(--g)', padding: '4px 0 1px', fontWeight: 500 },
  sc: { aspectRatio: '1', background: 'rgba(27,45,110,.07)', border: '1px solid rgba(27,45,110,.2)', borderRadius: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 2 },
  scHl: { background: 'rgba(255,149,0,.22)', border: '1px solid var(--y)', animation: 'glow .9s ease-in-out infinite alternate' },
  scN: { fontSize: '6.5px', color: 'var(--d)', fontWeight: 600, lineHeight: 1.1 },
  scName: { fontSize: '9.5px', fontWeight: 700, color: 'var(--w)', lineHeight: 1.1, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  gateCard: { background: 'linear-gradient(135deg,rgba(27,45,110,.1),rgba(27,45,110,.04))', border: '1px solid rgba(27,45,110,.2)', borderRadius: 'var(--r)', padding: 14, boxShadow: 'var(--shadow-sm)', marginBottom: 10 },
  gateT1: { fontSize: 10, color: 'var(--d)', fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 2 },
  gateT2: { fontSize: 16, fontWeight: 700, color: 'var(--w)' },
  gateT3: { fontSize: 12, color: 'var(--g)', marginTop: 2 },
  entryCard: { background: 'var(--card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', padding: 16 },
  entryTitle: { fontSize: 14, fontWeight: 800, color: 'var(--w)', marginBottom: 12 },
  entryRow: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  entryIcon: { fontSize: 20, flexShrink: 0, marginTop: 1 },
  entryLabel: { fontSize: 10, fontWeight: 700, color: 'var(--g)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 },
  entryValue: { fontSize: 14, fontWeight: 600, color: 'var(--w)' },
  entrySub: { fontSize: 12, color: 'var(--g)', marginTop: 2 },
  entryDivider: { height: 1, background: 'var(--sep2)', margin: '12px 0' },
}
