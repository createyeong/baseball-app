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
          {FOOD_ITEMS.reduce((acc, item, i) => {
            const prev = FOOD_ITEMS[i - 1]
            if (!prev || prev.cat !== item.cat) {
              acc.push(<div key={item.cat} style={s.catHdr}>{item.cat}</div>)
            }
            acc.push(
              <button
                key={item.name}
                type="button"
                aria-expanded={open === i}
                style={s.foodItem}
                onClick={() => setOpen(open === i ? null : i)}
              >
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
              </button>
            )
            return acc
          }, [])}
        </div>

        <div style={s.tipCard}>
          <div style={s.tipTtl}>💡 먹거리 꿀팁</div>
          <ul style={s.tipList}>
            <li><strong>경기 시작 전</strong>에 미리 사두기 — 이닝 중간엔 줄 2~3배 길어짐</li>
            <li><strong>3층 매장</strong>은 같은 브랜드라도 줄이 훨씬 짧아요</li>
            <li><strong>2.5층 브뤼셀프라이</strong>는 위치가 특이해요 — 계단 중간 층</li>
            <li>이동성 중요하면 타코잇·잠실원샷·꼬치류 추천</li>
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
  catHdr: { fontSize: 13, fontWeight: 700, color: 'var(--g)', marginTop: 8, marginBottom: 2, paddingLeft: 2 },
  foodItem: { background: 'var(--card)', border: 'none', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', cursor: 'pointer', width: '100%', padding: 0, textAlign: 'left', fontFamily: 'var(--body)', color: 'inherit' },
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
