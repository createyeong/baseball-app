import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

const TIME_SLOTS = ['6:45', '7:00', '7:15', '7:30', '7:45', '8:00 이후']

export default function EntryPage() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.secHdr}>입장 <em style={{ color: 'var(--d)', fontStyle: 'normal' }}>안내</em></div>

        {/* 티켓 수령 */}
        <div style={s.card}>
          <div style={s.cardTitle}>🎟️ 티켓 수령</div>
          <div style={s.infoRow}>
            <span style={s.infoIcon}>📍</span>
            <div>
              <div style={s.infoLbl}>수령 장소</div>
              <div style={s.infoVal}>종합운동장역 6번 출구 앞 공터</div>
            </div>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoIcon}>🕕</span>
            <div>
              <div style={s.infoLbl}>수령 시작</div>
              <div style={s.infoVal}>오후 6시 10분부터</div>
            </div>
          </div>
        </div>

        {/* 늦은 도착 배너 */}
        <div style={s.lateBanner}>
          <div style={s.lateBannerLeft}>
            <div style={s.lateBannerTitle}>⚠️ 6:30 이후 도착 예정이신가요?</div>
            <div style={s.lateBannerSub}>도착 예정 시간을 미리 남겨주세요 — 별도로 안내드릴게요</div>
          </div>
          <button style={s.lateBtn} onClick={() => setModalOpen(true)}>
            등록하기
          </button>
        </div>

        {/* 입장 안내 */}
        <div style={s.card}>
          <div style={s.cardTitle}>🚪 입장 안내</div>
          <div style={s.infoRow}>
            <span style={s.infoIcon}>🪑</span>
            <div>
              <div style={s.infoLbl}>좌석</div>
              <div style={s.infoVal}>317구역 · 중앙 네이비석</div>
            </div>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoIcon}>🚪</span>
            <div>
              <div style={s.infoLbl}>게이트</div>
              <div style={s.infoVal}>3루 쪽 게이트 이용</div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && createPortal(
        <LateModal onClose={() => setModalOpen(false)} onSaved={() => setModalOpen(false)} />,
        document.body
      )}
    </div>
  )
}

function LateModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [time, setTime] = useState('')
  const [message, setMessage] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    if (!name.trim()) { setErr('이름을 입력해주세요'); return }
    if (!time) { setErr('도착 예정 시간을 선택해주세요'); return }
    setErr('')

    const { error } = await supabase
      .from('late_arrivals')
      .upsert({ name: name.trim(), arrival_time: time, message: message.trim() }, { onConflict: 'name' })

    if (error) { setErr('저장 실패: ' + error.message); return }
    setDone(true)
  }

  if (done) return (
    <div style={s.modalOv}>
      <div style={{ ...s.modalSheet, borderRadius: 'var(--r)', maxWidth: 360, margin: '0 auto 40px' }}>
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>✅ 등록 완료</span>
          <button style={s.modalX} onClick={onSaved}>✕</button>
        </div>
        <div style={{ padding: '24px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{name}님 등록됐어요!</div>
          <div style={{ fontSize: 13, color: 'var(--g)' }}>도착 예정 {time} · 인솔 선생님께 전달될 거예요</div>
          <button style={{ ...s.submitBtn, marginTop: 20 }} onClick={onSaved}>확인</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.modalOv}>
      <div style={s.modalSheet}>
        <div style={s.modalHandle} />
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>⏰ 늦은 도착 등록</span>
          <button style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <div style={s.fg}>
            <label style={s.flbl}>이름</label>
            <input style={s.finp} value={name} onChange={e => setName(e.target.value)} placeholder="이름을 입력하세요" maxLength={10} />
          </div>

          <div style={s.fg}>
            <label style={s.flbl}>도착 예정 시간</label>
            <div style={s.timeGrid}>
              {TIME_SLOTS.map(t => (
                <button
                  key={t}
                  style={{ ...s.timeBtn, ...(time === t ? s.timeBtnSel : {}) }}
                  onClick={() => setTime(t)}
                >{t}</button>
              ))}
            </div>
          </div>

          <div style={s.fg}>
            <label style={s.flbl}>추가 전달사항 (선택)</label>
            <input style={s.finp} value={message} onChange={e => setMessage(e.target.value)} placeholder="ex) 지하철 지연 중이에요" maxLength={50} />
          </div>

          {err && <div style={s.ferr}>{err}</div>}
          <button style={s.submitBtn} onClick={submit}>등록하기</button>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { flex: '0 0 100%', width: '100%', height: '100%', overflowY: 'auto', padding: '18px 14px 72px', scrollbarWidth: 'none' },
  inner: { maxWidth: 640, margin: '0 auto' },
  secHdr: { fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', marginBottom: 14 },
  card: { background: 'var(--card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', padding: '14px 16px', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: 800, color: 'var(--w)', marginBottom: 10 },
  infoRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid var(--sep2)' },
  infoIcon: { fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 },
  infoLbl: { fontSize: 10, fontWeight: 600, color: 'var(--g)', marginBottom: 1 },
  infoVal: { fontSize: 14, fontWeight: 600, color: 'var(--w)' },
  lateBanner: { background: 'linear-gradient(135deg, rgba(255,149,0,.12), rgba(255,109,0,.06))', border: '1px solid rgba(255,149,0,.35)', borderRadius: 'var(--r)', padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' },
  lateBannerLeft: { flex: 1 },
  lateBannerTitle: { fontSize: 14, fontWeight: 700, color: 'var(--w)', marginBottom: 3 },
  lateBannerSub: { fontSize: 12, color: 'var(--g)', lineHeight: 1.5 },
  lateBtn: { background: 'var(--y2)', color: '#fff', border: 'none', borderRadius: 'var(--rxs)', fontFamily: 'var(--body)', fontSize: 13, fontWeight: 700, padding: '9px 14px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' },
  modalOv: { display: 'flex', position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', alignItems: 'flex-end', justifyContent: 'center' },
  modalSheet: { background: 'rgba(250,250,252,.98)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', paddingBottom: 20, animation: 'up .3s cubic-bezier(.4,0,.2,1)' },
  modalHandle: { width: 36, height: 4, background: 'var(--card3)', borderRadius: 2, margin: '11px auto 0' },
  modalHdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid var(--sep)' },
  modalTtl: { fontSize: 16, fontWeight: 700, color: 'var(--w)' },
  modalX: { background: 'var(--card2)', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
  modalBody: { padding: '14px 18px' },
  fg: { marginBottom: 16 },
  flbl: { fontSize: 11, fontWeight: 600, color: 'var(--g)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7, display: 'block' },
  finp: { width: '100%', background: 'var(--card2)', border: '1px solid var(--sep)', borderRadius: 'var(--rxs)', color: 'var(--w)', fontFamily: 'var(--body)', fontSize: 15, padding: '10px 12px', outline: 'none' },
  timeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  timeBtn: { padding: '10px 8px', border: '2px solid var(--sep)', borderRadius: 'var(--rxs)', background: 'var(--card2)', fontFamily: 'var(--body)', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--g3)', transition: 'all .15s' },
  timeBtnSel: { background: 'rgba(255,109,0,.1)', borderColor: 'var(--y2)', color: 'var(--y2)' },
  ferr: { fontSize: 12, color: 'var(--k)', background: 'var(--k-light)', padding: '7px 10px', borderRadius: 'var(--rxs)', marginBottom: 8 },
  submitBtn: { width: '100%', padding: 14, background: 'var(--y2)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontFamily: 'var(--body)', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
}
