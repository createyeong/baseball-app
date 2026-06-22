export default function HomePage({ onNav }) {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        {/* 매치업 카드 */}
        <div style={s.heroCard}>
          <div style={s.matchup}>
            <div style={{ ...s.mt, background: 'var(--d-light)' }}>
              <img src="/doosan.svg" style={s.teamLogo} alt="두산" />
              <div style={s.teamName}>두산 베어스</div>
            </div>
            <div style={s.vs}>VS</div>
            <div style={{ ...s.mt, background: 'var(--k-light)' }}>
              <img src="/kia.svg" style={s.teamLogo} alt="기아" />
              <div style={s.teamName}>기아 타이거즈</div>
            </div>
          </div>
          <div style={s.heroBody}>
            <InfoRow icon="🕕" label="집합 시간" value="오후 6:15 (경기 6:30)" />
            <InfoRow icon="📍" label="장소" value="잠실야구장" />
            <InfoRow icon="🪑" label="좌석" value="317구역 · 중앙 네이비석" />
            <InfoRow icon="🚇" label="교통" value="잠실역 2·5호선 / 잠실새내역 2호선" />
          </div>
        </div>

        {/* 퀵 버튼 */}
        <QuickBtn emoji="🪑" title="자리 확인" sub="내 좌석 번호 찾기" onClick={() => onNav(1)} />
        <QuickBtn emoji="⚾" title="예측 참여" sub="승리팀·점수 예측하기" onClick={() => onNav(2)} />
        <QuickBtn emoji="🍗" title="먹거리 탐색" sub="잠실 맛집 & 꿀팁" onClick={() => onNav(3)} />
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
  heroCard: { background: 'var(--card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow)', marginBottom: 12, overflow: 'hidden' },
  matchup: { display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--sep)' },
  mt: { flex: 1, padding: '16px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  vs: { padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--g)', borderLeft: '1px solid var(--sep)', borderRight: '1px solid var(--sep)' },
  teamLogo: { width: 64, height: 64, objectFit: 'contain', display: 'block' },
  teamName: { fontSize: 12, fontWeight: 700, color: 'var(--g3)' },
  heroBody: { padding: '4px 14px 14px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderTop: '1px solid var(--sep2)' },
  infoIcon: { fontSize: 18, width: 32, textAlign: 'center', flexShrink: 0 },
  infoLbl: { fontSize: 10, fontWeight: 600, color: 'var(--g)', marginBottom: 1 },
  infoVal: { fontSize: 14, fontWeight: 600, color: 'var(--w)' },
  quickBtn: { background: 'var(--card)', border: 'none', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', width: '100%', marginBottom: 10, fontFamily: 'var(--body)' },
  quickTitle: { fontSize: 15, fontWeight: 700, color: 'var(--w)', marginBottom: 2 },
  quickSub: { fontSize: 12, color: 'var(--g)' },
  quickArrow: { marginLeft: 'auto', fontSize: 20, color: 'var(--g)' },
}
