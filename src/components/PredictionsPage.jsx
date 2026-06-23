import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

function calcDistance(p, score) {
  if (score.d === null || score.k === null) return Infinity
  return Math.abs(p.score_doosan - score.d) + Math.abs(p.score_kia - score.k)
}

// 아직 가능성 있는 예측인지 (현재 스코어를 이미 넘기지 않았는지)
function isPossible(p, score) {
  if (score.d === null || score.k === null) return true
  return p.score_doosan >= score.d && p.score_kia >= score.k
}

const DEADLINE = new Date('2026-06-26T18:30:00+09:00')

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => DEADLINE - Date.now())
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(DEADLINE - Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return timeLeft
}

export default function PredictionsPage() {
  const [preds, setPreds] = useState([])
  const [score, setScore] = useState({ d: null, k: null, inning: null, half: '초', status: '경기 전', predictions_locked: false })
  const [modalOpen, setModalOpen] = useState(false)
  const [gearMenu, setGearMenu] = useState(false)
  const [pinTarget, setPinTarget] = useState(null) // 'score' | 'delete' | 'late'
  const [scoreModal, setScoreModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [lateModal, setLateModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [editTarget, setEditTarget] = useState(null) // { pred, pin }
  const [editPinModal, setEditPinModal] = useState(null) // prediction object waiting for PIN
  const [toast, setToast] = useState('')

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchPreds = useCallback(async () => {
    const { data, error } = await supabase
      .from('predictions')
      .select('id, name, team, score_doosan, score_kia, cheer, created_at')
      .order('created_at', { ascending: true })
    if (!error && data) setPreds(data)
  }, [])

  const fetchScore = useCallback(async () => {
    const { data, error } = await supabase.from('live_score').select('*').eq('id', 1).single()
    if (!error && data) setScore(data)
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      fetchPreds()
      fetchScore()
    }, 0)
    const predSub = supabase
      .channel('predictions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, fetchPreds)
      .subscribe()
    const scoreSub = supabase
      .channel('live_score')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_score' }, fetchScore)
      .subscribe()
    return () => {
      window.clearTimeout(initialLoad)
      supabase.removeChannel(predSub)
      supabase.removeChannel(scoreSub)
    }
  }, [fetchPreds, fetchScore])

  const total = preds.length
  const dc = preds.filter(p => p.team === '두산').length
  const kc = total - dc
  const dp = total > 0 ? Math.round(dc / total * 100) : 50
  const kp = 100 - dp

  // 가능한 예측 먼저, 그 안에서 현재 스코어와 가까운 순으로 정렬
  const sortedPreds = [...preds].sort((a, b) => {
    const aPossible = isPossible(a, score)
    const bPossible = isPossible(b, score)
    if (aPossible !== bPossible) return aPossible ? -1 : 1
    return calcDistance(a, score) - calcDistance(b, score)
  })
  function openGearMenu() { setGearMenu(true) }
  function handleGearSelect(target) {
    setGearMenu(false)
    setPinTarget(target)
  }
  function handlePinSuccess(password) {
    setAdminPassword(password)
    if (pinTarget === 'score') setScoreModal(true)
    if (pinTarget === 'delete') setDeleteModal(true)
    if (pinTarget === 'late') setLateModal(true)
    setPinTarget(null)
  }

  const timeLeft = useCountdown()
  const deadlinePassed = timeLeft <= 0
  const isLocked = score.predictions_locked || deadlinePassed

  return (
    <div style={s.page}>
      <div style={s.inner}>

        {/* 실시간 스코어 */}
        <div style={s.scoreLiveCard}>
          <div style={s.slcTop} />
          <div style={s.slcBody}>
            <div style={s.slcHeader}>
              <span style={s.slcTitle}>실시간 스코어</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...s.slcStatus, color: score.status === '진행 중' ? 'var(--grn)' : 'var(--g)', background: score.status === '진행 중' ? 'rgba(52,199,89,.1)' : 'rgba(0,0,0,.06)' }}>
                  {score.status}
                </span>
                <button type="button" aria-label="관리자 메뉴 열기" style={s.gearBtn} onClick={openGearMenu} title="관리자">⚙️</button>
              </div>
            </div>
            <div style={s.slcMain}>
              <div style={s.slcTeam}>
                <img src="/doosan.svg" style={s.slcLogo} alt="두산" />
                <div style={s.slcTeamName}>두산</div>
                <div style={{ ...s.slcScore, color: 'var(--d)' }}>{score.d !== null ? score.d : '-'}</div>
              </div>
              <div style={s.slcMid}>
                {score.status === '진행 중' && (
                  <>
                    <div style={s.slcInning}>{score.inning ? `${score.inning}회` : ''}</div>
                    <div style={s.slcHalf}>{score.half || ''}</div>
                  </>
                )}
                <div style={s.slcColon}>:</div>
              </div>
              <div style={s.slcTeam}>
                <img src="/kia.svg" style={s.slcLogo} alt="기아" />
                <div style={s.slcTeamName}>기아</div>
                <div style={{ ...s.slcScore, color: 'var(--k)' }}>{score.k !== null ? score.k : '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 예측 섹션 헤더 */}
        <div style={s.predSecDivider}>
          <div style={s.predSecLine} />
          <div style={s.predSecHdr}>스코어 <em style={{ color: 'var(--d)', fontStyle: 'normal' }}>예측하기</em></div>
          <div style={s.predSecLine} />
        </div>

        {/* 응원 배틀 */}
        <div style={s.battleCard}>
          <div style={s.bcTop} />
          <div style={s.bcLogos}>
            <div style={s.bcTeam}><img src="/doosan.svg" style={s.bcLogo} alt="두산" /><span style={s.bcName}>두산</span></div>
            <div style={s.bcVs}>VS</div>
            <div style={s.bcTeam}><img src="/kia.svg" style={s.bcLogo} alt="기아" /><span style={s.bcName}>기아</span></div>
          </div>
          <div style={s.bcRatioWrap}>
            <div style={s.bcBarRow}>
              <div style={{ ...s.bcBarD, width: `${dp}%` }}>{dp > 12 ? `${dp}%` : ''}</div>
              <div style={s.bcBarK}>{kp > 12 ? `${kp}%` : ''}</div>
            </div>
            <div style={s.bcNums}>
              <span style={{ ...s.bcNum, color: 'var(--d2)' }}>두산 {dc}명</span>
              <span style={{ ...s.bcNum, color: 'var(--k2)' }}>기아 {kc}명</span>
            </div>
          </div>
          <div style={s.bcFoot}>
            {!isLocked && <Countdown timeLeft={timeLeft} />}
            {isLocked ? (
              <div style={s.lockedMsg}>🔒 예측이 마감됐어요</div>
            ) : (
              <button style={s.predBtn} onClick={() => setModalOpen(true)}>⚾ 예측 남기기</button>
            )}
            <div style={s.predSub}>{total === 0 ? '아직 아무도 예측하지 않았어요' : `총 ${total}명 참여 중!`}</div>
          </div>
        </div>

        {/* 예측 목록 */}
        {total > 0 && (
          <div>
            <div style={s.listHdr}>
              <span style={{ ...s.lh, color: 'var(--d)' }}>두산</span>
              <span style={{ ...s.lh, color: 'var(--g)' }}>이름</span>
              <span style={{ ...s.lh, color: 'var(--k)' }}>기아</span>
            </div>
            <div style={s.predList}>
              {sortedPreds.map((p) => (
                <PredCard
                  key={p.id}
                  p={p}
                  isTop={calcDistance(p, score) === 0}
                  possible={isPossible(p, score)}
                  onEdit={isLocked ? null : () => setEditPinModal(p)}
                />
              ))}
            </div>
            {!isLocked && <div style={s.editHint}>예측 카드를 탭하면 비밀번호로 수정할 수 있어요</div>}
          </div>
        )}
      </div>

      {toast && createPortal(
        <div style={s.toast}>{toast}</div>,
        document.body
      )}
      {modalOpen && createPortal(<PredModal onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchPreds() }} onClosed={() => { setModalOpen(false); showToast('⏰ 예측이 종료되었습니다') }} />, document.body)}
      {editPinModal && createPortal(<EditPinModal pred={editPinModal} onClose={() => setEditPinModal(null)} onSuccess={(pin) => { setEditTarget({ pred: editPinModal, pin }); setEditPinModal(null) }} />, document.body)}
      {editTarget && createPortal(<EditModal pred={editTarget.pred} pin={editTarget.pin} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); fetchPreds() }} />, document.body)}
      {gearMenu && createPortal(<GearMenu onClose={() => setGearMenu(false)} onSelect={handleGearSelect} />, document.body)}
      {pinTarget && createPortal(<PinModal onClose={() => setPinTarget(null)} onSuccess={handlePinSuccess} />, document.body)}
      {scoreModal && createPortal(<ScoreModal score={score} password={adminPassword} onClose={() => setScoreModal(false)} onSaved={() => { setScoreModal(false); fetchScore() }} />, document.body)}
      {deleteModal && createPortal(<DeleteModal preds={preds} password={adminPassword} locked={score.predictions_locked} onClose={() => setDeleteModal(false)} onDeleted={fetchPreds} onToggleLock={fetchScore} />, document.body)}
      {lateModal && createPortal(<LateListModal password={adminPassword} onClose={() => setLateModal(false)} />, document.body)}
    </div>
  )
}

function Countdown({ timeLeft }) {
  if (timeLeft <= 0) return null
  const totalSec = Math.floor(timeLeft / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  const pad = n => String(n).padStart(2, '0')
  return (
    <div style={cd.wrap}>
      <span style={cd.label}>⏳ 예측 마감까지</span>
      <div style={cd.nums}>
        {d > 0 && <><span style={cd.num}>{d}</span><span style={cd.unit}>일</span></>}
        <span style={cd.num}>{pad(h)}</span><span style={cd.unit}>시간</span>
        <span style={cd.num}>{pad(m)}</span><span style={cd.unit}>분</span>
        <span style={cd.num}>{pad(sec)}</span><span style={cd.unit}>초</span>
      </div>
    </div>
  )
}

const cd = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(27,45,110,.06)', border: '1px solid rgba(27,45,110,.15)', borderRadius: 'var(--rxs)', padding: '10px 12px', marginBottom: 10, gap: 5 },
  label: { fontSize: 11, fontWeight: 600, color: 'var(--g)' },
  nums: { display: 'flex', alignItems: 'baseline', gap: 3 },
  num: { fontSize: 20, fontWeight: 800, color: 'var(--d)', fontVariantNumeric: 'tabular-nums' },
  unit: { fontSize: 11, fontWeight: 600, color: 'var(--g)', marginRight: 3 },
}

function PredCard({ p, isTop, possible, onEdit }) {
  const isD = p.team === '두산'
  // 예측 기준 승리팀 (테두리 방향 결정)
  const predDWin = p.score_doosan > p.score_kia
  const predKWin = p.score_kia > p.score_doosan
  // 현재 스코어 기준 어느 팀 점수가 낮게 예측됐는지 (흐리기)
  const dWin = p.score_doosan > p.score_kia
  const kWin = p.score_kia > p.score_doosan

  const glowAnim = predDWin ? 'glowCardD 1.6s ease-in-out infinite alternate' : 'glowCardK 1.6s ease-in-out infinite alternate'

  const cardStyle = {
    ...s.pc,
    opacity: possible ? 1 : 0.4,
    ...(predDWin ? { borderLeft: '3px solid var(--d)' } : {}),
    ...(predKWin ? { borderRight: '3px solid var(--k)' } : {}),
    ...(!predDWin && !predKWin ? { borderLeft: '3px solid var(--g)' } : {}),
    ...(isTop ? {
      border: `2px solid ${predDWin ? '#3A56B0' : '#E8334A'}`,
      ...(predDWin ? { borderLeft: '3px solid #3A56B0' } : { borderRight: '3px solid #E8334A' }),
      boxShadow: predDWin
        ? '0 0 0 1px rgba(27,45,110,.15), 0 4px 20px rgba(27,45,110,.25)'
        : '0 0 0 1px rgba(206,14,45,.15), 0 4px 20px rgba(206,14,45,.25)',
      animation: glowAnim,
    } : {}),
  }

  return (
    <div style={{ ...cardStyle, cursor: onEdit ? 'pointer' : 'default' }} onClick={onEdit || undefined}>
      {isTop && (
        <div style={{ ...s.topBadge, background: predDWin ? 'var(--d)' : 'var(--k)' }}>
          🎯 예상 적중
        </div>
      )}
      <div style={s.pcBody}>
        <div style={{ ...s.pcScore, color: 'var(--d)', opacity: kWin ? 0.45 : 1 }}>{p.score_doosan}</div>
        <div style={s.pcCenter}>
          <div style={s.pcName}>{p.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 3 }}>
            <img src={isD ? '/doosan.svg' : '/kia.svg'} style={s.pcLogo} alt={p.team} />
            <span style={{ ...s.pcTlbl, color: isD ? 'var(--d)' : 'var(--k)' }}>{p.team}{p.cheer ? ` · "${p.cheer}"` : ''}</span>
          </div>
        </div>
        <div style={{ ...s.pcScore, color: 'var(--k)', opacity: dWin ? 0.45 : 1 }}>{p.score_kia}</div>
      </div>
    </div>
  )
}

function GearMenu({ onClose, onSelect }) {
  return (
    <div style={s.modalOv} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modalSheet, borderRadius: 'var(--r)', maxWidth: 340, margin: '0 auto 40px' }}>
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>⚙️ 관리자 메뉴</span>
          <button type="button" aria-label="관리자 메뉴 닫기" style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '8px 0 12px' }}>
          <button style={s.menuItem} onClick={() => onSelect('score')}>
            <span style={s.menuIcon}>📊</span>
            <div>
              <div style={s.menuLabel}>현재 점수 수정하기</div>
              <div style={s.menuSub}>실시간 스코어를 업데이트해요</div>
            </div>
            <span style={{ fontSize: 16, color: 'var(--g)' }}>›</span>
          </button>
          <div style={{ height: 1, background: 'var(--sep2)', margin: '0 18px' }} />
          <button style={s.menuItem} onClick={() => onSelect('delete')}>
            <span style={s.menuIcon}>🗑️</span>
            <div>
              <div style={s.menuLabel}>예측 삭제하기</div>
              <div style={s.menuSub}>잘못 올려진 예측을 삭제해요</div>
            </div>
            <span style={{ fontSize: 16, color: 'var(--g)' }}>›</span>
          </button>
          <div style={{ height: 1, background: 'var(--sep2)', margin: '0 18px' }} />
          <button style={s.menuItem} onClick={() => onSelect('late')}>
            <span style={s.menuIcon}>⏰</span>
            <div>
              <div style={s.menuLabel}>늦은 도착 명단</div>
              <div style={s.menuSub}>늦게 도착 예정인 인원 확인</div>
            </div>
            <span style={{ fontSize: 16, color: 'var(--g)' }}>›</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ preds, password, locked, onClose, onDeleted, onToggleLock }) {
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function del(id) {
    if (!window.confirm('이 예측을 삭제할까요? 삭제 후에는 되돌릴 수 없어요.')) return
    setError('')
    setBusyId(id)
    const { data, error: rpcError } = await supabase.rpc('admin_delete_prediction', {
      p_password: password,
      p_id: id,
    })
    setBusyId(null)
    if (rpcError || data !== true) {
      setError(rpcError?.message || '삭제에 실패했어요.')
      return
    }
    await onDeleted()
  }

  async function toggleLock() {
    setError('')
    setBusyId('lock')
    const { data, error: rpcError } = await supabase.rpc('admin_set_predictions_locked', {
      p_password: password,
      p_locked: !locked,
    })
    setBusyId(null)
    if (rpcError || data !== true) {
      setError(rpcError?.message || '예측 마감 변경에 실패했어요.')
      return
    }
    await onToggleLock()
  }
  return (
    <div style={s.modalOv} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modalSheet}>
        <div style={s.modalHandle} />
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>⚙️ 예측 관리</span>
          <button type="button" aria-label="예측 관리 닫기" style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>

          {/* 예측 마감 토글 */}
          <div style={s.lockRow}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--w)' }}>예측 마감</div>
              <div style={{ fontSize: 12, color: 'var(--g)', marginTop: 2 }}>켜면 더 이상 예측을 남길 수 없어요</div>
            </div>
            <button type="button" aria-label={locked ? '예측 접수 다시 열기' : '예측 접수 마감하기'} disabled={busyId === 'lock'} style={{ ...s.toggle, background: locked ? 'var(--grn)' : 'var(--card3)', opacity: busyId === 'lock' ? .5 : 1 }} onClick={toggleLock}>
              <div style={{ ...s.toggleKnob, transform: locked ? 'translateX(20px)' : 'translateX(2px)' }} />
            </button>
          </div>

          {error && <div style={{ ...s.ferr, marginTop: 12 }}>{error}</div>}
          <div style={{ height: 1, background: 'var(--sep)', margin: '14px 0' }} />

          {/* 예측 삭제 목록 */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--g)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>예측 삭제</div>
          {preds.length === 0 && <div style={{ color: 'var(--g)', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>삭제할 예측이 없어요</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {preds.map(p => {
              const isD = p.team === '두산'
              return (
                <div key={p.id} style={s.delRow}>
                  <img src={isD ? '/doosan.svg' : '/kia.svg'} style={{ width: 28, height: 28, objectFit: 'contain' }} alt={p.team} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--g)' }}>{p.score_doosan} : {p.score_kia}{p.cheer ? ` · "${p.cheer}"` : ''}</div>
                  </div>
                  <button type="button" disabled={busyId === p.id} style={{ ...s.delBtn, opacity: busyId === p.id ? .5 : 1 }} onClick={() => del(p.id)}>
                    {busyId === p.id ? '삭제 중…' : '삭제'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function PredModal({ onClose, onSaved, onClosed }) {
  const [name, setName] = useState('')
  const [team, setTeam] = useState('')
  const [sd, setSd] = useState(0)
  const [sk, setSk] = useState(0)
  const [cheer, setCheer] = useState('')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')

  async function submit() {
    const miss = []
    if (!name.trim()) miss.push('이름')
    if (!team) miss.push('응원팀')
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) miss.push('수정 비밀번호 (숫자 4자리)')
    if (miss.length) { setErr('누락된 항목 → ' + miss.join(', ')); return }
    const { data, error } = await supabase.rpc('create_prediction', {
      p_name: name.trim(),
      p_team: team,
      p_score_doosan: sd,
      p_score_kia: sk,
      p_cheer: cheer.trim() || null,
      p_pin: pin,
    })
    if (error) {
      setErr(error.code === '23505' ? '이미 같은 이름으로 등록된 예측이 있어요.' : '저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
      return
    }
    if (data === false) {
      onClosed()
      return
    }
    onSaved()
  }

  return (
    <div style={s.modalOv} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
        <div style={s.modalHandle} />
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>⚾ 예측 남기기</span>
          <button type="button" aria-label="예측 입력 닫기" style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <FormGroup label="이름">
            <input style={s.finp} value={name} onChange={e => setName(e.target.value)} placeholder="이름을 입력하세요" maxLength={10} />
          </FormGroup>
          <FormGroup label="응원팀">
            <div style={s.tgrid}>
              <button type="button" style={{ ...s.tbtn, ...(team === '두산' ? s.tbtnD : {}) }} onClick={() => setTeam('두산')}>
                <img src="/doosan.svg" style={s.tbtnLogo} alt="두산" /> 두산
              </button>
              <button type="button" style={{ ...s.tbtn, ...(team === '기아' ? s.tbtnK : {}) }} onClick={() => setTeam('기아')}>
                <img src="/kia.svg" style={s.tbtnLogo} alt="기아" /> 기아
              </button>
            </div>
          </FormGroup>
          <FormGroup label="예측 점수">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <ScoreAdj label="두산" color="var(--d)" val={sd} onChange={setSd} />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--g)' }}>:</span>
              <ScoreAdj label="기아" color="var(--k)" val={sk} onChange={setSk} />
            </div>
          </FormGroup>
          <FormGroup label="응원 한마디 (선택)">
            <input style={s.finp} value={cheer} onChange={e => setCheer(e.target.value)} placeholder="ex) 오늘은 꼭 이겨라!" maxLength={30} />
          </FormGroup>
          <FormGroup label="수정 비밀번호 (숫자 4자리)">
            <input
              style={{ ...s.finp, letterSpacing: 8, textAlign: 'center', fontSize: 20, fontWeight: 700 }}
              type="number" inputMode="numeric" maxLength={4} value={pin}
              onChange={e => setPin(e.target.value.slice(0, 4))}
              placeholder="• • • •"
            />
            <div style={{ fontSize: 11, color: 'var(--g)', marginTop: 5 }}>예측을 나중에 수정할 때 필요해요. 꼭 기억해두세요!</div>
          </FormGroup>
          {err && <div style={s.ferr}>{err}</div>}
          <button type="button" style={s.modalSubmit} onClick={submit}>예측 제출하기</button>
        </div>
      </div>
    </div>
  )
}

function ScoreAdj({ label, color, val, onChange }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--g)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <button type="button" aria-label={`${label} 점수 내리기`} style={s.adjBtn} onClick={() => onChange(Math.max(0, val - 1))}>−</button>
        <span style={{ fontSize: 28, fontWeight: 800, color, minWidth: 36, textAlign: 'center' }}>{val}</span>
        <button type="button" aria-label={`${label} 점수 올리기`} style={s.adjBtn} onClick={() => onChange(Math.min(30, val + 1))}>+</button>
      </div>
    </div>
  )
}

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={s.flbl}>{label}</label>
      {children}
    </div>
  )
}

function PinModal({ onClose, onSuccess }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [checking, setChecking] = useState(false)

  async function check() {
    if (!pin) return
    setChecking(true)
    setErr('')
    const { data, error } = await supabase.rpc('admin_check_password', { p_password: pin })
    setChecking(false)
    if (error || data !== true) {
      setErr('비밀번호가 틀렸거나 보안 설정이 아직 적용되지 않았어요.')
      return
    }
    onSuccess(pin)
  }

  return (
    <div style={s.modalOv} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modalSheet, borderRadius: 'var(--r)', maxWidth: 340, margin: '0 auto 40px' }}>
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>🔐 관리자 인증</span>
          <button type="button" aria-label="관리자 인증 닫기" style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <input
            style={{ ...s.finp, textAlign: 'center', fontSize: 18, animation: err ? 'shake .3s ease' : 'none' }}
            type="password" maxLength={64} value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="관리자 비밀번호"
            autoFocus
          />
          {err && <div style={{ ...s.ferr, marginTop: 8 }}>{err}</div>}
          <button type="button" disabled={checking} style={{ ...s.modalSubmit, opacity: checking ? .5 : 1 }} onClick={check}>
            {checking ? '확인 중…' : '확인'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ScoreModal({ score, password, onClose, onSaved }) {
  const [d, setD] = useState(score.d ?? 0)
  const [k, setK] = useState(score.k ?? 0)
  const [inning, setInning] = useState(score.inning ?? 1)
  const [half, setHalf] = useState(score.half ?? '초')
  const [status, setStatus] = useState(score.status ?? '경기 전')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    setError('')
    const { data, error: rpcError } = await supabase.rpc('admin_update_score', {
      p_password: password,
      p_d: d,
      p_k: k,
      p_inning: inning,
      p_half: half,
      p_status: status,
    })
    setSaving(false)
    if (rpcError || data !== true) {
      setError(rpcError?.message || '점수 저장에 실패했어요.')
      return
    }
    onSaved()
  }

  return (
    <div style={s.modalOv} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modalSheet, borderRadius: 'var(--r)', maxWidth: 340, margin: '0 auto 40px' }}>
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>📊 스코어 입력</span>
          <button type="button" aria-label="스코어 입력 닫기" style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <ScoreField label="두산" value={d} onChange={setD} color="var(--d)" />
            <ScoreField label="기아" value={k} onChange={setK} color="var(--k)" />
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <ScoreField label="이닝" value={inning} onChange={setInning} />
            <div style={{ flex: 1 }}>
              <label style={s.flbl}>초/말</label>
              <select style={s.finp} value={half} onChange={e => setHalf(e.target.value)}>
                <option value="초">초</option><option value="말">말</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={s.flbl}>상태</label>
            <select style={s.finp} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="경기 전">경기 전</option>
              <option value="진행 중">진행 중</option>
              <option value="경기 종료">경기 종료</option>
            </select>
          </div>
          {error && <div style={s.ferr}>{error}</div>}
          <button type="button" disabled={saving} style={{ ...s.modalSubmit, opacity: saving ? .5 : 1 }} onClick={save}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditPinModal({ pred, onClose, onSuccess }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [checking, setChecking] = useState(false)

  async function check() {
    if (pin.length !== 4) { setErr('숫자 4자리를 입력해주세요'); return }
    setChecking(true)
    setErr('')
    const { data, error } = await supabase.rpc('check_prediction_pin', {
      p_id: pred.id,
      p_pin: pin,
    })
    setChecking(false)
    if (error || data !== true) { setErr('비밀번호가 틀렸어요'); return }
    onSuccess(pin)
  }

  return (
    <div style={s.modalOv}>
      <div style={{ ...s.modalSheet, borderRadius: 'var(--r)', maxWidth: 340, margin: '0 auto 40px' }}>
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>🔐 수정 비밀번호</span>
          <button style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <div style={{ fontSize: 14, color: 'var(--g)', marginBottom: 14, textAlign: 'center' }}>
            <strong style={{ color: 'var(--w)' }}>{pred.name}</strong>님의 예측 수정 비밀번호를 입력하세요
          </div>
          <input
            style={{ ...s.finp, letterSpacing: 12, textAlign: 'center', fontSize: 24, fontWeight: 800, animation: err ? 'shake .3s ease' : 'none' }}
            type="number" inputMode="numeric" maxLength={4} value={pin}
            onChange={e => setPin(e.target.value.slice(0, 4))}
            onKeyDown={e => e.key === 'Enter' && check()}
            autoFocus
          />
          {err && <div style={{ ...s.ferr, marginTop: 8 }}>{err}</div>}
          <button style={{ ...s.modalSubmit, marginTop: 12, opacity: checking ? .5 : 1 }} disabled={checking} onClick={check}>
            {checking ? '확인 중…' : '확인'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({ pred, pin, onClose, onSaved }) {
  const [name, setName] = useState(pred.name)
  const [team, setTeam] = useState(pred.team)
  const [sd, setSd] = useState(pred.score_doosan)
  const [sk, setSk] = useState(pred.score_kia)
  const [cheer, setCheer] = useState(pred.cheer || '')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function save() {
    if (!name.trim()) { setErr('이름을 입력해주세요'); return }
    setSaving(true); setErr('')
    const { data, error } = await supabase.rpc('update_prediction_by_pin', {
      p_id: pred.id, p_pin: pin,
      p_name: name.trim(), p_team: team,
      p_score_doosan: sd, p_score_kia: sk,
      p_cheer: cheer.trim() || null,
    })
    setSaving(false)
    if (error || data === false) { setErr(error?.message || '수정에 실패했어요. 다시 시도해주세요.'); return }
    onSaved()
  }

  async function remove() {
    setSaving(true); setErr('')
    const { data, error } = await supabase.rpc('delete_prediction_by_pin', {
      p_id: pred.id, p_pin: pin,
    })
    setSaving(false)
    if (error || data === false) { setErr(error?.message || '삭제에 실패했어요.'); return }
    onSaved()
  }

  return (
    <div style={s.modalOv}>
      <div style={s.modalSheet}>
        <div style={s.modalHandle} />
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>✏️ 예측 수정</span>
          <button style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <FormGroup label="이름">
            <input style={s.finp} value={name} onChange={e => setName(e.target.value)} maxLength={10} />
          </FormGroup>
          <FormGroup label="응원팀">
            <div style={s.tgrid}>
              <button type="button" style={{ ...s.tbtn, ...(team === '두산' ? s.tbtnD : {}) }} onClick={() => setTeam('두산')}>
                <img src="/doosan.svg" style={s.tbtnLogo} alt="두산" /> 두산
              </button>
              <button type="button" style={{ ...s.tbtn, ...(team === '기아' ? s.tbtnK : {}) }} onClick={() => setTeam('기아')}>
                <img src="/kia.svg" style={s.tbtnLogo} alt="기아" /> 기아
              </button>
            </div>
          </FormGroup>
          <FormGroup label="예측 점수">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <ScoreAdj label="두산" color="var(--d)" val={sd} onChange={setSd} />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--g)' }}>:</span>
              <ScoreAdj label="기아" color="var(--k)" val={sk} onChange={setSk} />
            </div>
          </FormGroup>
          <FormGroup label="응원 한마디 (선택)">
            <input style={s.finp} value={cheer} onChange={e => setCheer(e.target.value)} placeholder="ex) 오늘은 꼭 이겨라!" maxLength={30} />
          </FormGroup>
          {err && <div style={s.ferr}>{err}</div>}
          <button style={{ ...s.modalSubmit, opacity: saving ? .5 : 1 }} disabled={saving} onClick={save}>
            {saving ? '저장 중…' : '수정 저장하기'}
          </button>
          <div style={{ height: 1, background: 'var(--sep)', margin: '14px 0' }} />
          {!confirmDelete ? (
            <button style={{ ...s.modalSubmit, background: 'transparent', color: 'var(--k)', border: '1px solid var(--k)' }} onClick={() => setConfirmDelete(true)}>
              🗑️ 예측 삭제하기
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--g)', marginBottom: 10 }}>정말 삭제할까요? 되돌릴 수 없어요.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...s.modalSubmit, flex: 1, background: 'var(--card2)', color: 'var(--w)' }} onClick={() => setConfirmDelete(false)}>취소</button>
                <button style={{ ...s.modalSubmit, flex: 1, background: 'var(--k)', opacity: saving ? .5 : 1 }} disabled={saving} onClick={remove}>삭제</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LateListModal({ password, onClose }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.rpc('admin_list_late_arrivals', { p_password: password })
      .then(({ data }) => { setRows(data || []); setLoading(false) })
  }, [password])

  async function remove(name) {
    const { data } = await supabase.rpc('admin_delete_late_arrival', { p_password: password, p_name: name })
    if (data === true) setRows(r => r.filter(x => x.name !== name))
  }

  return (
    <div style={s.modalOv}>
      <div style={s.modalSheet}>
        <div style={s.modalHandle} />
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>⏰ 늦은 도착 명단 ({rows.length})</span>
          <button style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          {loading && <div style={{ color: 'var(--g)', textAlign: 'center', padding: 20 }}>불러오는 중…</div>}
          {!loading && rows.length === 0 && (
            <div style={{ color: 'var(--g)', textAlign: 'center', padding: 20 }}>등록된 늦은 도착이 없어요</div>
          )}
          {rows.map(r => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--sep2)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--w)' }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--g)', marginTop: 2 }}>
                  {r.arrival_time}{r.message ? ` · ${r.message}` : ''}
                </div>
              </div>
              <button
                onClick={() => remove(r.name)}
                style={{ background: 'var(--k-light)', color: 'var(--k)', border: 'none', borderRadius: 'var(--rxs)', padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--body)' }}
              >삭제</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScoreField({ label, value, onChange, color }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={s.flbl}>{label}</label>
      <input style={{ ...s.finp, color: color || 'var(--w)', fontWeight: 700 }}
        type="number" min={0} max={30} value={value}
        onChange={e => onChange(Math.max(0, Math.min(30, Number(e.target.value) || 0)))} />
    </div>
  )
}

const s = {
  page: { flex: '0 0 100%', width: '100%', height: '100%', overflowY: 'auto', padding: '18px 14px 72px', scrollbarWidth: 'none' },
  inner: { maxWidth: 640, margin: '0 auto' },
  secHdr: { fontSize: 22, fontWeight: 800, color: 'var(--w)', letterSpacing: '-.4px', marginBottom: 14 },
  predSecDivider: { display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' },
  predSecLine: { flex: 1, height: 1, background: 'var(--sep)' },
  predSecHdr: { fontSize: 16, fontWeight: 800, color: 'var(--w)', whiteSpace: 'nowrap', letterSpacing: '-.3px' },
  scoreLiveCard: { background: 'var(--card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow)', marginBottom: 12, overflow: 'hidden' },
  slcTop: { height: 3, background: 'linear-gradient(90deg, var(--d) 50%, var(--k) 50%)' },
  slcBody: { padding: 16 },
  slcHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  slcTitle: { fontSize: 12, fontWeight: 700, color: 'var(--g)', textTransform: 'uppercase', letterSpacing: '.6px' },
  slcStatus: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 },
  slcMain: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 },
  slcTeam: { textAlign: 'center' },
  slcTeamName: { fontSize: 11, fontWeight: 700, color: 'var(--g2)', marginBottom: 4, marginTop: 4 },
  slcScore: { fontSize: 38, fontWeight: 900, lineHeight: 1 },
  slcMid: { textAlign: 'center', padding: '0 6px' },
  slcInning: { fontSize: 11, fontWeight: 700, color: 'var(--g)', marginBottom: 4 },
  slcColon: { fontSize: 20, fontWeight: 800, color: 'var(--g2)' },
  slcHalf: { fontSize: 10, color: 'var(--g)', marginTop: 2 },
  slcLogo: { width: 44, height: 44, objectFit: 'contain', display: 'block', margin: '0 auto 6px' },
  gearBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 4px', opacity: 0.5, lineHeight: 1 },
  battleCard: { background: 'var(--card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow)', marginBottom: 12, overflow: 'hidden' },
  bcTop: { height: 3, background: 'linear-gradient(90deg, var(--d) 50%, var(--k) 50%)' },
  bcLogos: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', padding: '16px 12px 10px' },
  bcTeam: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 },
  bcLogo: { width: 60, height: 60, objectFit: 'contain', display: 'block' },
  bcName: { fontSize: 12, fontWeight: 700, color: 'var(--g3)' },
  bcVs: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--g)' },
  bcRatioWrap: { padding: '0 14px 14px' },
  bcBarRow: { display: 'flex', height: 32, borderRadius: 10, overflow: 'hidden', gap: 2, marginBottom: 6 },
  bcBarD: { background: 'var(--d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', transition: 'width .6s ease', minWidth: 0, overflow: 'hidden', borderRadius: '8px 0 0 8px' },
  bcBarK: { background: 'var(--k)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', borderRadius: '0 8px 8px 0' },
  bcNums: { display: 'flex', justifyContent: 'space-between' },
  bcNum: { fontSize: 11, fontWeight: 500, color: 'var(--g)' },
  bcFoot: { padding: '12px 14px', borderTop: '1px solid var(--sep)', textAlign: 'center' },
  predBtn: { background: 'var(--d)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontFamily: 'var(--body)', fontSize: 14, fontWeight: 700, padding: '11px 24px', cursor: 'pointer' },
  predSub: { fontSize: 11, color: 'var(--g)', marginTop: 7 },
  listHdr: { display: 'grid', gridTemplateColumns: '44px 1fr 44px', gap: 6, padding: '0 12px 6px', marginTop: 4 },
  lh: { fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.4px' },
  predList: { display: 'flex', flexDirection: 'column', gap: 7 },
  pc: { background: 'var(--card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  topBadge: { color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', textAlign: 'center' },
  pcBody: { display: 'grid', gridTemplateColumns: '44px 1fr 44px', alignItems: 'center', gap: 6, padding: '8px 12px' },
  editHint: { fontSize: 11, color: 'var(--g)', textAlign: 'center', marginTop: 10, padding: '6px 0' },
  toast: { position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', background: 'rgba(30,30,30,.92)', color: '#fff', fontSize: 14, fontWeight: 600, padding: '11px 20px', borderRadius: 20, zIndex: 999, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' },
  pcScore: { fontSize: 24, fontWeight: 800, textAlign: 'center', lineHeight: 1 },
  pcCenter: { textAlign: 'center' },
  pcName: { fontSize: 15, fontWeight: 700, color: 'var(--w)', marginBottom: 2 },
  pcLogo: { width: 18, height: 18, objectFit: 'contain' },
  pcTlbl: { fontSize: 12, fontWeight: 700 },
  menuItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontFamily: 'var(--body)', textAlign: 'left' },
  menuIcon: { fontSize: 22, flexShrink: 0 },
  menuLabel: { fontSize: 15, fontWeight: 600, color: 'var(--w)', marginBottom: 2 },
  menuSub: { fontSize: 12, color: 'var(--g)' },
  lockedMsg: { fontSize: 14, fontWeight: 700, color: 'var(--g)', background: 'var(--card2)', borderRadius: 'var(--rs)', padding: '11px 24px', display: 'inline-block' },
  lockRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggle: { width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .25s', flexShrink: 0, padding: 0 },
  toggleKnob: { position: 'absolute', top: 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,.25)', transition: 'transform .25s' },
  delRow: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card2)', borderRadius: 'var(--rxs)', padding: '10px 12px' },
  delBtn: { background: 'var(--k-light)', color: 'var(--k)', border: '1px solid var(--k)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--body)', flexShrink: 0 },
  modalOv: { display: 'flex', position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', alignItems: 'flex-end', justifyContent: 'center' },
  modalSheet: { background: 'rgba(250,250,252,.98)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', paddingBottom: 20, animation: 'up .3s cubic-bezier(.4,0,.2,1)' },
  modalHandle: { width: 36, height: 4, background: 'var(--card3)', borderRadius: 2, margin: '11px auto 0' },
  modalHdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid var(--sep)' },
  modalTtl: { fontSize: 16, fontWeight: 700, color: 'var(--w)' },
  modalX: { background: 'var(--card2)', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
  modalBody: { padding: '14px 18px' },
  flbl: { fontSize: 11, fontWeight: 600, color: 'var(--g)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7, display: 'block' },
  finp: { width: '100%', background: 'var(--card2)', border: '1px solid var(--sep)', borderRadius: 'var(--rxs)', color: 'var(--w)', fontFamily: 'var(--body)', fontSize: 15, padding: '10px 12px', outline: 'none' },
  tgrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  tbtn: { padding: '10px', border: '2px solid var(--sep)', borderRadius: 'var(--rxs)', background: 'var(--card2)', fontFamily: 'var(--body)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tbtnD: { background: 'var(--d-light)', borderColor: 'var(--d)', color: 'var(--d)' },
  tbtnK: { background: 'var(--k-light)', borderColor: 'var(--k)', color: 'var(--k)' },
  tbtnLogo: { width: 24, height: 24, objectFit: 'contain' },
  adjBtn: { width: 32, height: 32, borderRadius: 8, border: '1px solid var(--sep)', background: 'var(--card2)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ferr: { fontSize: 12, color: 'var(--k)', background: 'var(--k-light)', padding: '7px 10px', borderRadius: 'var(--rxs)', marginBottom: 8 },
  modalSubmit: { width: '100%', padding: 14, background: 'var(--d)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontFamily: 'var(--body)', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
}
