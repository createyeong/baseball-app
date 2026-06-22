import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

const CFG_PIN = '7484'

// 현재 스코어와 예측의 근접도 계산 (낮을수록 가까움)
function calcDistance(p, score) {
  if (score.d === null || score.k === null) return Infinity
  return Math.abs(p.score_doosan - score.d) + Math.abs(p.score_kia - score.k)
}

export default function PredictionsPage() {
  const [preds, setPreds] = useState([])
  const [score, setScore] = useState({ d: null, k: null, inning: null, half: '초', status: '경기 전' })
  const [modalOpen, setModalOpen] = useState(false)
  const [gearMenu, setGearMenu] = useState(false)
  const [pinTarget, setPinTarget] = useState(null) // 'score' | 'delete'
  const [scoreModal, setScoreModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  useEffect(() => {
    fetchAll()
    const predSub = supabase
      .channel('predictions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, fetchPreds)
      .subscribe()
    const scoreSub = supabase
      .channel('live_score')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_score' }, fetchScore)
      .subscribe()
    return () => {
      supabase.removeChannel(predSub)
      supabase.removeChannel(scoreSub)
    }
  }, [])

  async function fetchAll() { await Promise.all([fetchPreds(), fetchScore()]) }
  async function fetchPreds() {
    const { data } = await supabase.from('predictions').select('*').order('created_at', { ascending: true })
    if (data) setPreds(data)
  }
  async function fetchScore() {
    const { data } = await supabase.from('live_score').select('*').eq('id', 1).single()
    if (data) setScore(data)
  }

  const total = preds.length
  const dc = preds.filter(p => p.team === '두산').length
  const kc = total - dc
  const dp = total > 0 ? Math.round(dc / total * 100) : 50
  const kp = 100 - dp

  // 현재 스코어 기준으로 정렬 (가장 가까운 예측이 맨 위)
  const sortedPreds = [...preds].sort((a, b) => calcDistance(a, score) - calcDistance(b, score))
  const topPred = sortedPreds.length > 0 ? sortedPreds[0] : null
  const minDist = topPred ? calcDistance(topPred, score) : Infinity

  function openGearMenu() { setGearMenu(true) }
  function handleGearSelect(target) {
    setGearMenu(false)
    setPinTarget(target)
  }
  function handlePinSuccess() {
    if (pinTarget === 'score') setScoreModal(true)
    if (pinTarget === 'delete') setDeleteModal(true)
    setPinTarget(null)
  }

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
                <button style={s.gearBtn} onClick={openGearMenu} title="관리자">⚙️</button>
              </div>
            </div>
            <div style={s.slcMain}>
              <div style={s.slcTeam}>
                <img src="/doosan.svg" style={s.slcLogo} alt="두산" />
                <div style={s.slcTeamName}>두산</div>
                <div style={{ ...s.slcScore, color: 'var(--d)' }}>{score.d !== null ? score.d : '-'}</div>
              </div>
              <div style={s.slcMid}>
                <div style={s.slcInning}>{score.inning ? `${score.inning}회` : ''}</div>
                <div style={s.slcColon}>:</div>
                <div style={s.slcHalf}>{score.half || ''}</div>
              </div>
              <div style={s.slcTeam}>
                <img src="/kia.svg" style={s.slcLogo} alt="기아" />
                <div style={s.slcTeamName}>기아</div>
                <div style={{ ...s.slcScore, color: 'var(--k)' }}>{score.k !== null ? score.k : '-'}</div>
              </div>
            </div>
          </div>
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
            <button style={s.predBtn} onClick={() => setModalOpen(true)}>⚾ 예측 남기기</button>
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
              {sortedPreds.map((p, i) => (
                <PredCard
                  key={p.id}
                  p={p}
                  score={score}
                  isTop={i === 0 && minDist !== Infinity}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen && createPortal(<PredModal onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); fetchPreds() }} />, document.body)}
      {gearMenu && createPortal(<GearMenu onClose={() => setGearMenu(false)} onSelect={handleGearSelect} />, document.body)}
      {pinTarget && createPortal(<PinModal onClose={() => setPinTarget(null)} onSuccess={handlePinSuccess} />, document.body)}
      {scoreModal && createPortal(<ScoreModal score={score} onClose={() => setScoreModal(false)} onSaved={() => { setScoreModal(false); fetchScore() }} />, document.body)}
      {deleteModal && createPortal(<DeleteModal preds={preds} onClose={() => setDeleteModal(false)} onDeleted={fetchPreds} />, document.body)}
    </div>
  )
}

function PredCard({ p, score, isTop }) {
  const isD = p.team === '두산'
  const dWin = p.score_doosan > p.score_kia
  const kWin = p.score_kia > p.score_doosan
  const color = isD ? 'var(--d)' : 'var(--k)'

  const cardStyle = {
    ...s.pc,
    borderLeft: `3px solid ${color}`,
    ...(isTop ? {
      border: `2px solid ${isD ? '#3A56B0' : '#E8334A'}`,
      boxShadow: isD
        ? '0 0 0 1px rgba(27,45,110,.15), 0 4px 20px rgba(27,45,110,.25)'
        : '0 0 0 1px rgba(206,14,45,.15), 0 4px 20px rgba(206,14,45,.25)',
      animation: 'glowCard 1.6s ease-in-out infinite alternate',
    } : {}),
  }

  return (
    <div style={cardStyle}>
      {isTop && (
        <div style={{ ...s.topBadge, background: isD ? 'var(--d)' : 'var(--k)' }}>
          🎯 예상 적중
        </div>
      )}
      <div style={s.pcBody}>
        <div style={{ ...s.pcScore, color: 'var(--d)', opacity: kWin ? 0.45 : 1 }}>{p.score_doosan}</div>
        <div style={s.pcCenter}>
          <div style={s.pcName}>{p.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 3 }}>
            <img src={isD ? '/doosan.svg' : '/kia.svg'} style={s.pcLogo} alt={p.team} />
            <span style={{ ...s.pcTlbl, color }}>{p.team}{p.cheer ? ` · "${p.cheer}"` : ''}</span>
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
          <button style={s.modalX} onClick={onClose}>✕</button>
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
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ preds, onClose, onDeleted }) {
  async function del(id) {
    await supabase.from('predictions').delete().eq('id', id)
    onDeleted()
  }
  return (
    <div style={s.modalOv} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modalSheet}>
        <div style={s.modalHandle} />
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>🗑️ 예측 삭제</span>
          <button style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          {preds.length === 0 && <div style={{ color: 'var(--g)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>삭제할 예측이 없어요</div>}
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
                  <button style={s.delBtn} onClick={() => del(p.id)}>삭제</button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function PredModal({ onClose, onSaved }) {
  const [name, setName] = useState('')
  const [team, setTeam] = useState('')
  const [sd, setSd] = useState(0)
  const [sk, setSk] = useState(0)
  const [cheer, setCheer] = useState('')
  const [err, setErr] = useState('')

  async function submit() {
    const miss = []
    if (!name.trim()) miss.push('이름')
    if (!team) miss.push('응원팀')
    if (miss.length) { setErr('누락된 항목 → ' + miss.join(', ')); return }
    const { error } = await supabase
      .from('predictions')
      .upsert({ name: name.trim(), team, score_doosan: sd, score_kia: sk, cheer: cheer.trim() }, { onConflict: 'name' })
    if (error) { setErr('저장 실패: ' + error.message); return }
    onSaved()
  }

  return (
    <div style={s.modalOv} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
        <div style={s.modalHandle} />
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>⚾ 예측 남기기</span>
          <button style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <FormGroup label="이름">
            <input style={s.finp} value={name} onChange={e => setName(e.target.value)} placeholder="이름을 입력하세요" maxLength={10} />
          </FormGroup>
          <FormGroup label="응원팀">
            <div style={s.tgrid}>
              <button style={{ ...s.tbtn, ...(team === '두산' ? s.tbtnD : {}) }} onClick={() => setTeam('두산')}>
                <img src="/doosan.svg" style={s.tbtnLogo} alt="두산" /> 두산
              </button>
              <button style={{ ...s.tbtn, ...(team === '기아' ? s.tbtnK : {}) }} onClick={() => setTeam('기아')}>
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
          <button style={s.modalSubmit} onClick={submit}>예측 제출하기</button>
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
        <button style={s.adjBtn} onClick={() => onChange(Math.max(0, val - 1))}>−</button>
        <span style={{ fontSize: 28, fontWeight: 800, color, minWidth: 36, textAlign: 'center' }}>{val}</span>
        <button style={s.adjBtn} onClick={() => onChange(Math.min(30, val + 1))}>+</button>
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
  const [err, setErr] = useState(false)

  function check(val) {
    setPin(val)
    if (val.length === 4) {
      if (val === CFG_PIN) { setTimeout(onSuccess, 100) }
      else { setErr(true); setPin(''); setTimeout(() => setErr(false), 1500) }
    }
  }

  return (
    <div style={s.modalOv} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modalSheet, borderRadius: 'var(--r)', maxWidth: 340, margin: '0 auto 40px' }}>
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>🔐 관리자 인증</span>
          <button style={s.modalX} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <input
            style={{ ...s.finp, textAlign: 'center', fontSize: 22, letterSpacing: 8, animation: err ? 'shake .3s ease' : 'none' }}
            type="password" maxLength={4} value={pin}
            onChange={e => check(e.target.value)}
            placeholder="• • • •"
            autoFocus
          />
          {err && <div style={{ ...s.ferr, marginTop: 8 }}>비밀번호가 틀렸어요</div>}
        </div>
      </div>
    </div>
  )
}

function ScoreModal({ score, onClose, onSaved }) {
  const [d, setD] = useState(score.d ?? 0)
  const [k, setK] = useState(score.k ?? 0)
  const [inning, setInning] = useState(score.inning ?? 1)
  const [half, setHalf] = useState(score.half ?? '초')
  const [status, setStatus] = useState(score.status ?? '경기 전')

  async function save() {
    await supabase.from('live_score').upsert({ id: 1, d, k, inning, half, status })
    onSaved()
  }

  return (
    <div style={s.modalOv} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modalSheet, borderRadius: 'var(--r)', maxWidth: 340, margin: '0 auto 40px' }}>
        <div style={s.modalHdr}>
          <span style={s.modalTtl}>📊 스코어 입력</span>
          <button style={s.modalX} onClick={onClose}>✕</button>
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
          <button style={s.modalSubmit} onClick={save}>저장</button>
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
        onChange={e => onChange(Number(e.target.value))} />
    </div>
  )
}

const s = {
  page: { flex: '0 0 100%', width: '100%', height: '100%', overflowY: 'auto', padding: '18px 14px 72px', scrollbarWidth: 'none' },
  inner: { maxWidth: 640, margin: '0 auto' },
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
  pcScore: { fontSize: 24, fontWeight: 800, textAlign: 'center', lineHeight: 1 },
  pcCenter: { textAlign: 'center' },
  pcName: { fontSize: 15, fontWeight: 700, color: 'var(--w)', marginBottom: 2 },
  pcLogo: { width: 18, height: 18, objectFit: 'contain' },
  pcTlbl: { fontSize: 12, fontWeight: 700 },
  menuItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', width: '100%', cursor: 'pointer', fontFamily: 'var(--body)', textAlign: 'left' },
  menuIcon: { fontSize: 22, flexShrink: 0 },
  menuLabel: { fontSize: 15, fontWeight: 600, color: 'var(--w)', marginBottom: 2 },
  menuSub: { fontSize: 12, color: 'var(--g)' },
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
