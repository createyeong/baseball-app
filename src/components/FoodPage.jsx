import { useState } from 'react'
import { FOOD_ITEMS } from '../data'

export default function FoodPage() {
  const [open, setOpen] = useState(null)

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.secHdr}>잠실 <em style={{ color: 'var(--d)', fontStyle: 'normal' }}>먹거리</em></div>
        <div style={{ fontSize: 12, color: 'var(--g)', marginBottom: 12 }}>탭하면 상세 메뉴 & 위치 정보가 나와요</div>

        <div style={s.foodList}>
          {FOOD_ITEMS.map((item, i) => (
            <div key={i} style={s.foodItem} onClick={() => setOpen(open === i ? null : i)}>
              <div style={s.foodHeader}>
                <span style={s.foodEmoji}>{item.emoji}</span>
                <div style={s.foodMain}>
                  <div style={s.foodName}>{item.name}</div>
                  <div style={s.foodSub}>{item.sub}</div>
                </div>
                <span style={{ ...s.foodArrow, transform: open === i ? 'rotate(90deg)' : 'none' }}>›</span>
              </div>
              {open === i && (
                <div style={s.foodDetail}>
                  <div style={s.foodLoc}>{item.loc}</div>
                  <div style={s.foodMenu}>{item.menu}</div>
                  <div style={s.foodTip}>{item.tip}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={s.tipCard}>
          <div style={s.tipTtl}>💡 먹거리 꿀팁</div>
          <ul style={s.tipList}>
            <li><strong>1층엔 식당 없음</strong> — 음료·스낵 편의점만 있어요</li>
            <li><strong>2층이 핵심</strong> — 주요 매장 대부분 2층에 위치</li>
            <li>3층은 KFC·BBQ·와팡 등 2층과 겹치는 매장이 많아 줄이 짧아요</li>
            <li>경기 시작 전 미리 사두기 — 이닝 중간엔 줄 2~3배 길어짐</li>
            <li>새마을시장 (도보 15분) 포장해 오면 선택지가 훨씬 많아요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { flex: '0 0 100%', width: '100%', height: '100%', overflowY: 'auto', padding: '18px 14px 72px', scrollbarWidth: 'none' },
  inner: { maxWidth: 640, margin: '0 auto' },
  secHdr: { fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 14 },
  foodList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  foodItem: { background: 'var(--card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', cursor: 'pointer' },
  foodHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: 14 },
  foodEmoji: { fontSize: 28, flexShrink: 0 },
  foodMain: { flex: 1 },
  foodName: { fontSize: 16, fontWeight: 700, color: 'var(--w)', marginBottom: 2 },
  foodSub: { fontSize: 12, color: 'var(--g)' },
  foodArrow: { fontSize: 12, color: 'var(--g)', transition: 'transform .2s' },
  foodDetail: { padding: '0 14px 14px', borderTop: '1px solid var(--sep2)' },
  foodLoc: { fontSize: 12, fontWeight: 600, color: 'var(--d)', marginBottom: 6, marginTop: 10 },
  foodMenu: { fontSize: 13, color: 'var(--g3)', lineHeight: 1.65 },
  foodTip: { fontSize: 12, color: 'var(--y2)', fontWeight: 600, marginTop: 6 },
  tipCard: { background: 'var(--card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', padding: 16 },
  tipTtl: { fontSize: 14, fontWeight: 700, marginBottom: 10 },
  tipList: { paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--g3)', lineHeight: 1.55 },
}
