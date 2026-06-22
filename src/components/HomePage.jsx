export default function HomePage({ onNav }) {
  return (
    <div style={s.page}>
      <div style={s.inner}>

        {/* 히어로 — 다크 네이비 */}
        <div style={s.heroCard}>
          <div style={s.heroBg}>
            <div style={s.heroDate}>2026 · 06 · 26 FRI · 잠실야구장</div>
            <div style={s.heroMatchup}>
              <div style={s.heroTeam}>
                <img src="/doosan.svg" style={s.heroLogo} alt="두산" />
                <div style={s.heroTeamName}>두산 베어스</div>
              </div>
              <div style={s.heroVsWrap}>
                <div style={s.heroVs}>VS</div>
              </div>
              <div style={s.heroTeam}>
                <img src="/kia.svg" style={s.heroLogo} alt="기아" />
                <div style={s.heroTeamName}>기아 타이거즈</div>
              </div>
            </div>
          </div>
          {/* 인포 */}
          <div style={s.heroBody}>
            <InfoRow icon="🎟️" label="티켓 수령" value="오후 6시 10분" />
            <InfoRow icon="⚾" label="경기 시작" value="오후 6시 30분" />
            <InfoRow icon="📍" label="장소" value="잠실야구장" />
            <InfoRow icon="🪑" label="좌석" value="317구역 · 중앙 네이비석" />
            <InfoRow icon="🚇" label="교통" value="종합운동장역 2·9호선" />
          </div>
        </div>

        {/* 퀵 버튼 */}
        <QuickBtn emoji="🎟️" title="입장 안내" sub="티켓 수령 & 늦은 도착 등록" onClick={() => onNav(1)} />
        <QuickBtn emoji="🪑" title="자리 확인" sub="내 좌석 번호 찾기" onClick={() => onNav(2)} />
        <QuickBtn emoji="⚾" title="예측 참여" sub="승리팀·점수 예측하기" onClick={() => onNav(3)} />
        <QuickBtn emoji="🍗" title="먹거리 탐색" sub="잠실 맛집 & 꿀팁" onClick={() => onNav(4)} />
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoIcon}>{icon}</span>
      <div>
        <div style={s.infoLbl}>{label}</div>
        <div style={s.infoVal}>{value}</div>
      </div>
    </div>
  )
}

function QuickBtn({ emoji, title, sub, onClick }) {
  return (
    <button onClick={onClick} style={s.quickBtn}>
      <span style={{ fontSize: 28 }}>{emoji}</span>
      <div>
        <div style={s.quickTitle}>{title}</div>
        <div style={s.quickSub}>{sub}</div>
      </div>
      <span style={s.quickArrow}>›</span>
    </button>
  )
}

const s = {
  page: { flex: '0 0 100%', width: '100%', height: '100%', overflowY: 'auto', padding: '18px 14px 72px', scrollbarWidth: 'none' },
  inner: { maxWidth: 640, margin: '0 auto' },

  heroCard: { borderRadius: 'var(--r)', boxShadow: 'var(--shadow)', marginBottom: 12, overflow: 'hidden' },
  heroBg: {
    background: 'linear-gradient(160deg, #0d1e5c 0%, #1B2D6E 50%, #15244a 100%)',
    padding: '24px 20px 28px',
    textAlign: 'center',
  },
  heroDate: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.45)', letterSpacing: '.8px', marginBottom: 20 },
  heroMatchup: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 },
  heroTeam: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  heroLogo: { width: 90, height: 90, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.4))' },
  heroTeamName: { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.85)' },
  heroVsWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  heroVs: { fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,.5)', letterSpacing: 1 },

  heroBody: { background: '#fff', padding: '4px 16px 14px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderTop: '1px solid var(--sep2)' },
  infoIcon: { fontSize: 18, width: 32, textAlign: 'center', flexShrink: 0 },
  infoLbl: { fontSize: 10, fontWeight: 600, color: 'var(--g)', marginBottom: 1 },
  infoVal: { fontSize: 14, fontWeight: 600, color: 'var(--w)' },

  quickBtn: { background: 'var(--card)', border: 'none', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', width: '100%', marginBottom: 10, fontFamily: 'var(--body)' },
  quickTitle: { fontSize: 15, fontWeight: 700, color: 'var(--w)', marginBottom: 2 },
  quickSub: { fontSize: 12, color: 'var(--g)' },
  quickArrow: { marginLeft: 'auto', fontSize: 20, color: 'var(--g)' },
}
