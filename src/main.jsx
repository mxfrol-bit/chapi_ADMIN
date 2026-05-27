import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AXIS_LABELS, PSYCHOLOGY_QUESTIONS, calculateScores } from '../shared/scoring.js';
import './styles.css';

const STORAGE_KEY = 'chappy_candidate_lab_draft_v4_friendly';

const STAGES = [
  { id: 'intro', title: 'Знакомство', hint: 'Что такое ЧАППИ и что делают Trend&Prompt и Content&Creative. 2 минуты, без полей.' },
  { id: 'profile', title: 'Профиль', hint: 'Кто проходит. После этого запускается таймер.' },
  { id: 'prompt', title: '1. Один промт', hint: 'Напиши промт для одной идеи и опиши, что улучшил бы. Это сердце роли.' },
  { id: 'card', title: '2. Карточка тренда', hint: 'Оформи карточку так, как она появится в ЧАППИ: заголовок, что загрузить, что получит.' },
  { id: 'content', title: '3. Пост / рассылка', hint: 'Упакуй идею в Telegram-пост и короткую рассылку. Это работа Контент-менеджера.' },
  { id: 'ideas', title: '4. Идеи для канала', hint: 'Накидай 5 AI-трендов под ЧАППИ. Если устал — можно меньше, главное качество.' },
  { id: 'analysis', title: '5. Что бы запустил', hint: 'Коротко: что первым, как мерить, где риск. Свободная форма.' },
  { id: 'psych', title: 'Рабочий ритм · опционально', hint: '8 коротких вопросов про дисциплину. Можно пропустить и отправить как есть.' },
  { id: 'result', title: 'Финал', hint: 'Проверь и отправь. Финальное решение — за руководителем.' }
];

const emptyTrend = () => ({
  id: crypto.randomUUID(),
  title: '',
  source: '',
  description: '',
  upload: '',
  output: '',
  prompts: [''],
  clickability: '',
  audience: '',
  monetization: '',
  whyNow: ''
});

const initialState = {
  profile: {
    name: '',
    contact: '',
    telegram: '',
    city: '',
    source: '',
    availableTime: '',
    experience: ''
  },
  trends: [emptyTrend()],
  promptTest: {
    trendId: '',
    model: '',
    originalPrompt: '',
    testResult: '',
    improvedPrompt: '',
    whatChanged: '',
    finalVerdict: ''
  },
  trendCard: {
    trendId: '',
    title: '',
    subtitle: '',
    whatUpload: '',
    whatResult: '',
    userSteps: '',
    priceHook: '',
    previewText: '',
    qualityCheck: ''
  },
  packaging: {
    trendId: '',
    telegramPost: '',
    botBroadcast: '',
    bloggerStories: '',
    cta: '',
    cardTitles: ''
  },
  kaizen: {
    firstLaunch: '',
    biggestPurchase: '',
    weakestTrend: '',
    metrics: '',
    improve24h: '',
    selfGrowth: ''
  },
  psychology: {},
  timings: {
    totalStartedAt: '',
    totalCompletedAt: '',
    currentStageId: 'intro',
    stages: {}
  }
};

const requiredPsychQuestions = PSYCHOLOGY_QUESTIONS.slice(0, 8);
const psychSoftMin = 6; // мягкий минимум — желательно ответить хотя бы 6 из 8, но не блокируем отправку

function App() {
  const [route, setRoute] = useState(getRoute());
  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <>
      <TopBar route={route} />
      {route === 'admin' ? <AdminPage /> : <CandidatePage />}
    </>
  );
}

function getRoute() {
  if (location.hash.includes('admin') || location.pathname.includes('admin')) return 'admin';
  return 'candidate';
}

function TopBar({ route }) {
  return (
    <header className="topbar">
      <a className="brand" href="#candidate" aria-label="Chappy Candidate Lab">
        <span className="brandMark">C</span>
        <span>
          <b>Chappy Candidate Lab</b>
          <small>этапный тест · скорость · роли · Supabase</small>
        </span>
      </a>
      <nav>
        <a className={route === 'candidate' ? 'active' : ''} href="#candidate">Кандидат</a>
        <a className={route === 'admin' ? 'active' : ''} href="#admin">Админка</a>
      </nav>
    </header>
  );
}

function CandidatePage() {
  const [state, setState] = useState(() => loadDraft());
  const [step, setStep] = useState(() => Number(localStorage.getItem(`${STORAGE_KEY}_step`) || 0));
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
  const [gateError, setGateError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_step`, String(step));
    startStageIfNeeded(STAGES[step]?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const scores = useMemo(() => calculateScores(state), [state]);
  const stageId = STAGES[step].id;
  const activeTimer = getStageSeconds(state.timings?.stages?.[stageId], now);

  function mutate(updater) {
    setState(prev => typeof updater === 'function' ? updater(prev) : updater);
  }

  function startStageIfNeeded(id) {
    if (!id || id === 'result') return;
    setState(prev => {
      const timings = prev.timings || { stages: {} };
      const stages = timings.stages || {};
      if (stages[id]?.startedAt) return prev;
      const iso = new Date().toISOString();
      return {
        ...prev,
        timings: {
          ...timings,
          totalStartedAt: timings.totalStartedAt || iso,
          currentStageId: id,
          stages: {
            ...stages,
            [id]: { ...(stages[id] || {}), startedAt: iso }
          }
        }
      };
    });
  }

  function completeStage(id) {
    const completedAt = new Date().toISOString();
    setState(prev => {
      const timings = prev.timings || { stages: {} };
      const stages = timings.stages || {};
      const startedAt = stages[id]?.startedAt || completedAt;
      return {
        ...prev,
        timings: {
          ...timings,
          totalStartedAt: timings.totalStartedAt || startedAt,
          totalCompletedAt: id === 'psych' ? completedAt : timings.totalCompletedAt,
          currentStageId: id,
          stages: {
            ...stages,
            [id]: {
              ...stages[id],
              startedAt,
              completedAt,
              durationSec: Math.max(1, Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 1000))
            }
          }
        }
      };
    });
  }

  function validateStep(index = step) {
    const id = STAGES[index].id;
    if (id === 'profile') {
      if (!state.profile.name.trim()) return 'Укажи имя — без него не сможем привязать результат.';
      if (!state.profile.contact.trim() && !state.profile.telegram.trim()) return 'Оставь хотя бы один контакт (телефон/email или Telegram), чтобы мы могли написать.';
    }
    // Все остальные этапы — НЕ блокируем. Кандидат может пройти дальше или отправить как есть.
    return '';
  }

  // Мягкая проверка — для подсветки незавершённых этапов, но не для блокировки.
  function softCheck(index = step) {
    const id = STAGES[index].id;
    const filledTrends = getFilledTrends(state.trends);
    if (id === 'ideas') {
      if (filledTrends.length < 5) return `Идей пока ${filledTrends.length} из 5. Можешь добавить ещё или отправить как есть.`;
    }
    if (id === 'prompt') {
      const p = state.promptTest;
      if (!p.originalPrompt.trim() || !p.improvedPrompt.trim()) return 'Желательно заполнить промт и улучшенную версию — это сердце роли.';
    }
    if (id === 'card') {
      const c = state.trendCard;
      if (!c.title.trim() || !c.whatUpload.trim() || !c.whatResult.trim()) return 'Заполни хотя бы название, что загрузить и что получит — это основа карточки.';
    }
    if (id === 'content') {
      const p = state.packaging;
      if (!p.telegramPost.trim() && !p.botBroadcast.trim()) return 'Напиши хотя бы один формат: пост или рассылку.';
    }
    if (id === 'analysis') {
      const k = state.kaizen;
      if (!k.firstLaunch.trim() && !k.metrics.trim()) return 'Напиши хотя бы что запустишь первым и какие метрики смотреть.';
    }
    if (id === 'psych') {
      const answered = requiredPsychQuestions.filter(q => state.psychology[q.id] !== undefined).length;
      if (answered < psychSoftMin) return `Ответил на ${answered} из ${requiredPsychQuestions.length}. Этот блок опциональный — можешь пропустить.`;
    }
    return '';
  }

  function canOpenStep(index) {
    if (index <= step) return true;
    // intro и profile открыты всегда; после профиля — любые этапы свободно
    if (index === 0 || index === 1) return true;
    const profileOk = !validateStep(1);
    return profileOk;
  }

  function goNext() {
    setGateError('');
    const error = validateStep(step);
    if (error) {
      setGateError(error);
      return;
    }
    if (stageId !== 'result') completeStage(stageId);
    setStep(s => Math.min(STAGES.length - 1, s + 1));
  }

  async function submitAsIs() {
    // Отправка с любого этапа после профиля. Сначала проверим, что профиль заполнен.
    const profileError = validateStep(1);
    if (profileError) {
      setStep(1);
      setGateError(profileError);
      return;
    }
    if (!confirm('Отправить тест как есть? Незаполненные этапы будут пустыми, но мы их увидим.')) return;
    if (stageId !== 'result') completeStage(stageId);
    setStep(STAGES.length - 1);
    await doSubmit();
  }

  function jumpToMissing() {
    for (let i = 0; i < STAGES.length - 1; i++) {
      const err = validateStep(i) || softCheck(i);
      if (err) {
        setStep(i);
        setGateError(err);
        return;
      }
    }
    setStep(STAGES.length - 1);
  }

  async function submit() {
    const error = validateStep(1); // только профиль обязателен
    if (error) {
      setStep(1);
      setGateError(error);
      return;
    }
    await doSubmit();
  }

  async function doSubmit() {
    setSubmitState({ status: 'loading', message: 'Отправляем результат в Chappy...' });
    try {
      const payload = finalizeTimings(state);
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Не удалось отправить тест.');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}_step`);
      setSubmitState({ status: 'success', message: `Готово. Результат отправлен. Score: ${json.data.scores.total}/100.` });
    } catch (error) {
      setSubmitState({ status: 'error', message: error.message });
    }
  }

  function clearDraft() {
    if (!confirm('Очистить весь тест?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_step`);
    setState(structuredClone(initialState));
    setStep(0);
    setGateError('');
  }

  return (
    <main className="appShell">
      <Hero scores={scores} state={state} now={now} />

      <div className="layout">
        <aside className="sidePanel">
          <Progress steps={STAGES} step={step} setStep={i => canOpenStep(i) && setStep(i)} canOpenStep={canOpenStep} timings={state.timings} now={now} />
          <ScoreCard scores={scores} compact />
          <TimerPanel stage={STAGES[step]} seconds={activeTimer} timings={state.timings} now={now} />
          <div className="sideActions">
            <button className="ghostBtn" onClick={jumpToMissing}>Найти пропуск</button>
            <button className="ghostBtn danger" onClick={clearDraft}>Очистить</button>
          </div>
        </aside>

        <section className="workArea">
          <StepHeader step={STAGES[step]} number={step + 1} total={STAGES.length} activeTimer={activeTimer} />
          {gateError && <div className="notice error">{gateError}</div>}

          {stageId === 'intro' && <IntroStep />}
          {stageId === 'profile' && <ProfileStep profile={state.profile} setProfile={(k, v) => mutate(prev => ({ ...prev, profile: { ...prev.profile, [k]: v } }))} />}
          {stageId === 'prompt' && <PromptTestStep state={state} setState={mutate} />}
          {stageId === 'card' && <TrendCardStep state={state} setState={mutate} />}
          {stageId === 'content' && <PackagingStep state={state} setState={mutate} />}
          {stageId === 'ideas' && <IdeasStep trends={state.trends} setState={mutate} />}
          {stageId === 'analysis' && <AnalysisStep kaizen={state.kaizen} setKaizen={(k, v) => mutate(prev => ({ ...prev, kaizen: { ...prev.kaizen, [k]: v } }))} />}
          {stageId === 'psych' && <PsychologyStep answers={state.psychology} setAnswer={(id, value) => mutate(prev => ({ ...prev, psychology: { ...prev.psychology, [id]: Number(value) } }))} />}
          {stageId === 'result' && <ResultStep state={state} scores={scores} submitState={submitState} submit={submit} now={now} />}

          <div className="navControls">
            <button className="ghostBtn" disabled={step === 0} onClick={() => { setGateError(''); setStep(s => Math.max(0, s - 1)); }}>Назад</button>
            {/* Кнопка «Отправить как есть» доступна со 2-го этапа (после профиля), но не на самом result */}
            {step >= 2 && stageId !== 'result' && (
              <button className="ghostBtn" onClick={submitAsIs} disabled={submitState.status === 'loading'} title="Отправить с текущим прогрессом">Отправить как есть</button>
            )}
            {step < STAGES.length - 1 ? (
              <button className="primaryBtn" onClick={goNext}>{stageId === 'intro' ? 'Начать' : 'Дальше'}</button>
            ) : (
              <button className="primaryBtn" onClick={submit} disabled={submitState.status === 'loading'}>Отправить в Chappy</button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initialState);
    const parsed = JSON.parse(raw);
    return deepMerge(structuredClone(initialState), parsed);
  } catch {
    return structuredClone(initialState);
  }
}

function deepMerge(base, patch) {
  const out = { ...base, ...patch };
  out.profile = { ...base.profile, ...(patch.profile || {}) };
  out.promptTest = { ...base.promptTest, ...(patch.promptTest || {}) };
  out.trendCard = { ...base.trendCard, ...(patch.trendCard || {}) };
  out.packaging = { ...base.packaging, ...(patch.packaging || {}) };
  out.kaizen = { ...base.kaizen, ...(patch.kaizen || {}) };
  out.timings = { ...base.timings, ...(patch.timings || {}), stages: { ...base.timings.stages, ...(patch.timings?.stages || {}) } };
  return out;
}

function finalizeTimings(payload) {
  const nowIso = new Date().toISOString();
  const timings = payload.timings || { stages: {} };
  const stages = { ...(timings.stages || {}) };
  for (const s of STAGES) {
    if (s.id === 'result') continue;
    if (stages[s.id]?.startedAt && !stages[s.id]?.completedAt) {
      const startedAt = stages[s.id].startedAt;
      stages[s.id] = { ...stages[s.id], completedAt: nowIso, durationSec: Math.max(1, Math.round((Date.parse(nowIso) - Date.parse(startedAt)) / 1000)) };
    }
  }
  return { ...payload, timings: { ...timings, totalCompletedAt: nowIso, stages } };
}

function getFilledTrends(trends = []) {
  return trends.filter(t => String(t.title || '').trim());
}

function getStageSeconds(stage, now) {
  if (!stage?.startedAt) return 0;
  if (stage.durationSec) return stage.durationSec;
  return Math.max(0, Math.round((now - Date.parse(stage.startedAt)) / 1000));
}

function formatSeconds(sec = 0) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}ч ${m}м`;
  if (m) return `${m}м ${String(s).padStart(2, '0')}с`;
  return `${s}с`;
}

function totalDuration(timings, now) {
  const stages = timings?.stages || {};
  return Object.values(stages).reduce((sum, st) => sum + getStageSeconds(st, now), 0);
}

function Hero({ scores, state, now }) {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">ЧАППИ Junior Test · знакомство с продуктом</p>
        <h1>Покажи мышление, а не идеальный ответ.</h1>
        <p className="heroText">5 коротких заданий + опциональный блок про рабочий ритм. Любой этап можно пропустить или отправить как есть — финальное решение всё равно за руководителем.</p>
      </div>
      <div className="heroBadge">
        <span>{scores.total}</span>
        <b>/100</b>
        <small>{scores.role}</small>
        <em>{formatSeconds(totalDuration(state.timings, now))}</em>
      </div>
    </section>
  );
}

function Progress({ steps, step, setStep, canOpenStep, timings, now }) {
  return (
    <div className="progressBox">
      <p className="panelTitle">Этапы (можно в любом порядке)</p>
      {steps.map((s, i) => {
        const st = timings?.stages?.[s.id];
        const locked = !canOpenStep(i);
        const optional = s.id === 'psych';
        return (
          <button key={s.id} disabled={locked} className={`stepPill ${i === step ? 'active' : ''} ${st?.completedAt ? 'done' : ''} ${locked ? 'locked' : ''} ${optional ? 'optional' : ''}`} onClick={() => setStep(i)}>
            <span>{i === 0 ? '✦' : i}</span>
            <b>{s.title}</b>
            {st?.startedAt && <small>{formatSeconds(getStageSeconds(st, now))}</small>}
          </button>
        );
      })}
    </div>
  );
}

function StepHeader({ step, number, total, activeTimer }) {
  return (
    <div className="stepHeader">
      <p className="eyebrow">Шаг {number} / {total} · время этапа {formatSeconds(activeTimer)}</p>
      <h2>{step.title}</h2>
      <p>{step.hint}</p>
    </div>
  );
}

function TimerPanel({ stage, seconds, timings, now }) {
  return (
    <div className="timerPanel">
      <p className="panelTitle">Скорость решения</p>
      <div className="timerBig">{formatSeconds(seconds)}</div>
      <small>текущий этап: {stage.title}</small>
      <div className="timerTotal">Всего: <b>{formatSeconds(totalDuration(timings, now))}</b></div>
    </div>
  );
}

function ScoreCard({ scores, compact = false }) {
  return (
    <div className="scoreCard">
      <div className="scoreTop">
        <span>{scores.total}</span>
        <div>
          <b>{scores.grade}</b>
          <small>{scores.role}</small>
        </div>
      </div>
      {!compact && <p>{scores.summary}</p>}
      <div className="axisList">
        {Object.entries(scores.axes).map(([axis, value]) => (
          <div className="axis" key={axis}>
            <label><span>{AXIS_LABELS[axis]}</span><b>{value}</b></label>
            <div><i style={{ width: `${value}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntroStep() {
  return (
    <div className="introWrap">
      <div className="introHero">
        <p className="eyebrow">знакомство с ЧАППИ</p>
        <h2>Привет! Это не экзамен, а знакомство с работой.</h2>
        <p className="introLead">
          ЧАППИ — это Telegram-бот, в котором пользователи запускают AI-тренды одним кликом: загружают фото, получают видео, артовое превращение или новый образ. А ты будешь в команде, которая придумывает эти тренды и упаковывает их в посты.
        </p>
      </div>

      <div className="introCards">
        <div className="introCard">
          <span className="introCardTag">🎨 Реальный продукт</span>
          <b>Это тренды, которые сейчас в боте</b>
          <div className="introMiniCards">
            <div className="miniCard" style={{ background: 'linear-gradient(135deg,#ff8fb1,#ffd86b)' }}>
              <small>фото</small><b>Flamingo Fashion Editorial</b><em>♡ 15</em>
            </div>
            <div className="miniCard" style={{ background: 'linear-gradient(135deg,#6b8eff,#a5d8ff)' }}>
              <small>фото</small><b>Студийный зимний коллаж</b><em>♡ 15</em>
            </div>
            <div className="miniCard" style={{ background: 'linear-gradient(135deg,#7c3aed,#3b1d6b)' }}>
              <small>5с видео</small><b>Нелюбовь</b><em>♡ 0</em>
            </div>
            <div className="miniCard" style={{ background: 'linear-gradient(135deg,#0ea5e9,#1e1b4b)' }}>
              <small>5с видео</small><b>Танец</b><em>♡ 0</em>
            </div>
          </div>
        </div>

        <div className="introCard">
          <span className="introCardTag">👥 Две роли в команде</span>
          <b>Куда ты можешь попасть</b>
          <div className="rolePair">
            <div className="roleBox">
              <h3>Trend &amp; Prompt</h3>
              <p>Ищет идеи, пишет промты под Veo / Midjourney / Sora, тестирует в боте, превращает результат в готовый тренд.</p>
              <small>5 промтов фото + 5 видео + 1–2 тренда в день</small>
            </div>
            <div className="roleBox">
              <h3>Content &amp; Creative</h3>
              <p>Упаковывает тренды в Telegram-посты, дайджесты AI-новостей и рассылки в боте. Ведёт канал.</p>
              <small>6–8 постов в день + 1–2 рассылки</small>
            </div>
          </div>
        </div>

        <div className="introCard">
          <span className="introCardTag">🧪 Что будет в тесте</span>
          <b>5 коротких заданий — как один рабочий день</b>
          <ol className="introList">
            <li><b>Один промт</b> — напишешь свой и опишешь, что бы улучшил</li>
            <li><b>Карточка тренда</b> — оформишь, как она появится в ЧАППИ</li>
            <li><b>Пост / рассылка</b> — упакуешь идею в Telegram</li>
            <li><b>5 идей</b> — накидаешь AI-трендов под бот</li>
            <li><b>Что бы запустил первым</b> — коротко, своими словами</li>
          </ol>
          <p className="introHint">
            И мини-блок про рабочий ритм в конце — <em>опциональный</em>. Любой этап можно пропустить и нажать «Отправить как есть» — мы посмотрим то, что успел.
          </p>
        </div>

        <div className="introCard">
          <span className="introCardTag">📊 Как оцениваем</span>
          <b>Система покажет рекомендацию, но финальное решение — за руководителем</b>
          <p>Мы смотрим на качество идей, понимание промта, упаковку, метрики и скорость. Это подсказка, а не приговор — даже неполный тест может быть сильным.</p>
        </div>
      </div>

      <div className="introFooter">
        <p>Готова? Жми <b>«Начать»</b> внизу — после профиля включится таймер, и можно идти по этапам в любом порядке.</p>
      </div>
    </div>
  );
}

function ProfileStep({ profile, setProfile }) {
  return (
    <div className="grid two">
      <Input label="Имя" value={profile.name} onChange={v => setProfile('name', v)} placeholder="Например: Аня" required />
      <Input label="Контакт" value={profile.contact} onChange={v => setProfile('contact', v)} placeholder="телефон / email" />
      <Input label="Telegram" value={profile.telegram} onChange={v => setProfile('telegram', v)} placeholder="@username" />
      <Input label="Город / часовой пояс" value={profile.city} onChange={v => setProfile('city', v)} placeholder="Нижний / Москва / удалённо" />
      <Input label="Откуда узнала о вакансии" value={profile.source} onChange={v => setProfile('source', v)} placeholder="чат, знакомые, hh, канал" />
      <Input label="Сколько времени в день готова работать" value={profile.availableTime} onChange={v => setProfile('availableTime', v)} placeholder="например: 5 часов 5/2" />
      <TextArea className="wide" label="Опыт: контент, AI, Reels, Telegram, дизайн, тексты" value={profile.experience} onChange={v => setProfile('experience', v)} placeholder="Коротко: что уже делала, какими нейросетями пользовалась, где сильнее всего." />
      <InfoCard title="Правило теста" text="Этапы идут строго по порядку. Каждый закрытый этап фиксирует время. Нам важна не идеальность, а скорость мышления, вкус, логика и способность улучшать результат." />
    </div>
  );
}

function IdeasStep({ trends, setState }) {
  const addTrend = () => setState(prev => ({ ...prev, trends: [...prev.trends, emptyTrend()] }));
  const removeTrend = (id) => setState(prev => ({ ...prev, trends: prev.trends.length > 1 ? prev.trends.filter(t => t.id !== id) : prev.trends }));
  const updateTrend = (id, key, value) => setState(prev => ({ ...prev, trends: prev.trends.map(t => t.id === id ? { ...t, [key]: value } : t) }));

  return (
    <div>
      <div className="actionLine">
        <div>
          <h3>Этап 1: найти идеи</h3>
          <p>Минимум 3 тренда, но можно больше. Здесь видно насмотренность, скорость поиска и продуктовое чутьё.</p>
        </div>
        <button className="primaryBtn" onClick={addTrend}>+ Добавить идею</button>
      </div>
      <div className="trendStack">
        {trends.map((trend, idx) => (
          <div className="trendCard" key={trend.id}>
            <div className="trendHead">
              <div><span>Idea #{idx + 1}</span><h3>{trend.title || 'Новая AI-идея'}</h3></div>
              {trends.length > 1 && <button className="iconBtn" onClick={() => removeTrend(trend.id)}>Удалить</button>}
            </div>
            <div className="grid two">
              <Input label="Название тренда" value={trend.title} onChange={v => updateTrend(trend.id, 'title', v)} placeholder="Например: AI Yearbook / Cinematic Selfie / Couple Poster" />
              <Input label="Источник / ссылка / где увидела" value={trend.source} onChange={v => updateTrend(trend.id, 'source', v)} placeholder="TikTok, Reels, X, Telegram, конкурент" />
              <TextArea label="Короткое описание" value={trend.description} onChange={v => updateTrend(trend.id, 'description', v)} placeholder="В чём суть тренда и почему он цепляет?" />
              <TextArea label="Что загружает пользователь" value={trend.upload} onChange={v => updateTrend(trend.id, 'upload', v)} placeholder="Фото лица, видео, скрин, голос, текст, референс..." />
              <TextArea label="Что получает на выходе" value={trend.output} onChange={v => updateTrend(trend.id, 'output', v)} placeholder="Готовый визуал, видео, аватарка, сторис, обложка..." />
              <TextArea label="Почему кликнет" value={trend.clickability} onChange={v => updateTrend(trend.id, 'clickability', v)} placeholder="Самоидентификация, красота, статус, юмор, вау, желание повторить на себе..." />
              <TextArea label="Для какой аудитории" value={trend.audience} onChange={v => updateTrend(trend.id, 'audience', v)} placeholder="Девушки 18–30, блогеры, пары, предприниматели, геймеры..." />
              <TextArea label="Как может привести к оплате" value={trend.monetization} onChange={v => updateTrend(trend.id, 'monetization', v)} placeholder="Почему купит кредиты / подписку / повторит генерацию?" />
              <TextArea className="wide" label="Почему актуально сейчас" value={trend.whyNow} onChange={v => updateTrend(trend.id, 'whyNow', v)} placeholder="Свежесть, сезон, мем, инфоповод, визуальный тренд..." />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptTestStep({ state, setState }) {
  const options = getFilledTrends(state.trends);
  const setPrompt = (key, value) => setState(prev => ({ ...prev, promptTest: { ...prev.promptTest, [key]: value } }));
  const selected = options.find(t => t.id === state.promptTest.trendId);
  return (
    <div className="grid two">
      <div className="field wide">
        <label>Какую идею тестируем</label>
        <select value={state.promptTest.trendId} onChange={e => setPrompt('trendId', e.target.value)}>
          <option value="">Выбери из найденных идей</option>
          {options.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>
      {selected && <InfoCard title="Выбрана идея" text={`${selected.title}: ${selected.description}`} />}
      <Input label="Модель / нейросеть" value={state.promptTest.model} onChange={v => setPrompt('model', v)} placeholder="GPT Image, Midjourney, Kling, Runway, Suno..." />
      <TextArea className="wide" label="Первый промт" value={state.promptTest.originalPrompt} onChange={v => setPrompt('originalPrompt', v)} placeholder="Напиши промт так, как реально бы тестировала." />
      <TextArea label="Что получилось на тесте" value={state.promptTest.testResult} onChange={v => setPrompt('testResult', v)} placeholder="Что хорошо, что сломалось, совпал ли результат с обещанием?" />
      <TextArea label="Улучшенный промт" value={state.promptTest.improvedPrompt} onChange={v => setPrompt('improvedPrompt', v)} placeholder="Вторая версия промта после правок." />
      <TextArea label="Что именно изменила и почему" value={state.promptTest.whatChanged} onChange={v => setPrompt('whatChanged', v)} placeholder="Свет, поза, формат, запреты, уточнение лица, стиль, композиция..." />
      <TextArea label="Вердикт" value={state.promptTest.finalVerdict} onChange={v => setPrompt('finalVerdict', v)} placeholder="Заливать / доработать / отложить. Почему?" />
    </div>
  );
}

function TrendCardStep({ state, setState }) {
  const options = getFilledTrends(state.trends);
  const setCard = (key, value) => setState(prev => ({ ...prev, trendCard: { ...prev.trendCard, [key]: value } }));
  return (
    <div className="grid two">
      <div className="field wide">
        <label>Для какого тренда карточка</label>
        <select value={state.trendCard.trendId} onChange={e => setCard('trendId', e.target.value)}>
          <option value="">Выбери тренд</option>
          {options.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>
      <Input label="Название карточки" value={state.trendCard.title} onChange={v => setCard('title', v)} placeholder="Коротко, как на витрине" />
      <Input label="Подзаголовок" value={state.trendCard.subtitle} onChange={v => setCard('subtitle', v)} placeholder="Обещание результата за 1 строку" />
      <TextArea label="Что загрузить" value={state.trendCard.whatUpload} onChange={v => setCard('whatUpload', v)} placeholder="Фото/видео/текст, требования к качеству." />
      <TextArea label="Что получит" value={state.trendCard.whatResult} onChange={v => setCard('whatResult', v)} placeholder="Конкретный результат без размытой красоты." />
      <TextArea label="Шаги пользователя" value={state.trendCard.userSteps} onChange={v => setCard('userSteps', v)} placeholder="1. Загрузи фото. 2. Выбери стиль. 3. Получи варианты." />
      <TextArea label="Крючок к оплате" value={state.trendCard.priceHook} onChange={v => setCard('priceHook', v)} placeholder="Почему стоит потратить кредиты именно на этот тренд?" />
      <TextArea label="Текст превью / микро-копирайт" value={state.trendCard.previewText} onChange={v => setCard('previewText', v)} placeholder="Текст, который хочется нажать." />
      <TextArea className="wide" label="Чек качества карточки" value={state.trendCard.qualityCheck} onChange={v => setCard('qualityCheck', v)} placeholder="Как поймёшь, что карточка понятная и не обманывает ожидания?" />
    </div>
  );
}

function PackagingStep({ state, setState }) {
  const options = getFilledTrends(state.trends);
  const setPackaging = (key, value) => setState(prev => ({ ...prev, packaging: { ...prev.packaging, [key]: value } }));
  return (
    <div className="grid two">
      <div className="field wide">
        <label>Какой тренд упаковываем</label>
        <select value={state.packaging.trendId} onChange={e => setPackaging('trendId', e.target.value)}>
          <option value="">Выбери тренд</option>
          {options.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>
      <TextArea label="Пост в Telegram-канал" value={state.packaging.telegramPost} onChange={v => setPackaging('telegramPost', v)} placeholder="Хук → результат → что загрузить → CTA." />
      <TextArea label="Рассылка в бот" value={state.packaging.botBroadcast} onChange={v => setPackaging('botBroadcast', v)} placeholder="1–3 предложения + кнопка. Без воды." />
      <TextArea label="Сценарий сторис блогера на 3–4 экрана" value={state.packaging.bloggerStories} onChange={v => setPackaging('bloggerStories', v)} placeholder="Экран 1: хук. Экран 2: процесс. Экран 3: результат. Экран 4: CTA." />
      <TextArea label="3 CTA" value={state.packaging.cta} onChange={v => setPackaging('cta', v)} placeholder="Сделать себя в этом стиле / Загрузить фото / Получить 3 варианта" />
      <TextArea label="2 заголовка для карточки тренда" value={state.packaging.cardTitles} onChange={v => setPackaging('cardTitles', v)} placeholder="Коротко, кликабельно, понятно с первого взгляда." />
    </div>
  );
}

function AnalysisStep({ kaizen, setKaizen }) {
  return (
    <div className="grid two">
      <TextArea label="Какой тренд запустила бы первым и почему" value={kaizen.firstLaunch} onChange={v => setKaizen('firstLaunch', v)} />
      <TextArea label="Какой может дать больше покупок" value={kaizen.biggestPurchase} onChange={v => setKaizen('biggestPurchase', v)} />
      <TextArea label="Какой самый слабый и почему" value={kaizen.weakestTrend} onChange={v => setKaizen('weakestTrend', v)} />
      <TextArea label="Какие метрики смотрела бы после запуска" value={kaizen.metrics} onChange={v => setKaizen('metrics', v)} placeholder="CTR, start generation, completion, payment, repeat, refund, negative feedback..." />
      <TextArea label="Что улучшила бы через 24 часа" value={kaizen.improve24h} onChange={v => setKaizen('improve24h', v)} placeholder="Карточка, промт, референс, CTA, аудитория, цена, onboarding..." />
      <TextArea label="Что в себе хочешь прокачать за 30 дней" value={kaizen.selfGrowth} onChange={v => setKaizen('selfGrowth', v)} placeholder="Kaizen-план: навык, ритм, метрика, как поймёшь прогресс." />
    </div>
  );
}

function PsychologyStep({ answers, setAnswer }) {
  return (
    <div className="questionStack">
      {requiredPsychQuestions.map((q, idx) => (
        <div className="questionCard" key={q.id}>
          <div className="questionMeta"><span>{idx + 1}</span><b>{AXIS_LABELS[q.axis]}</b></div>
          <p>{q.text}</p>
          <div className="scale">
            {[0, 1, 2, 3, 4].map(v => (
              <label key={v} className={Number(answers[q.id]) === v ? 'selected' : ''}>
                <input type="radio" name={q.id} checked={Number(answers[q.id]) === v} onChange={() => setAnswer(q.id, v)} />
                <span>{['нет', 'скорее нет', '50/50', 'скорее да', 'точно да'][v]}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultStep({ state, scores, submitState, submit, now }) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ ...finalizeTimings(state), scores }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chappy-test-${state.profile.name || 'candidate'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copySummary = async () => {
    const text = [
      `Кандидат: ${state.profile.name}`,
      `Score: ${scores.total}/100`,
      `Роль: ${scores.role}`,
      `Грейд: ${scores.grade}`,
      `Трендов: ${scores.trendsCount}`,
      `Скорость: ${formatSeconds(totalDuration(state.timings, now))}`,
      `Вывод: ${scores.summary}`
    ].join('\n');
    await navigator.clipboard.writeText(text);
    alert('Итог скопирован');
  };

  return (
    <div className="resultGrid">
      <ScoreCard scores={scores} />
      <div className="finalPanel">
        <h3>Перед отправкой</h3>
        <p>Результат попадёт в Supabase и будет виден в админке. Время каждого этапа сохранится вместе с ответами.</p>
        <div className="miniStats">
          <span><b>{getFilledTrends(state.trends).length}</b> идей</span>
          <span><b>{formatSeconds(totalDuration(state.timings, now))}</b> время</span>
          <span><b>{Object.keys(state.psychology).length}</b> психоответов</span>
        </div>
        <StageTimeList timings={state.timings} now={now} />
        {scores.riskFlags.length > 0 && (
          <div className="riskBox">
            <b>Риски:</b>
            <ul>{scores.riskFlags.map(r => <li key={r}>{r}</li>)}</ul>
          </div>
        )}
        {submitState.message && <div className={`notice ${submitState.status}`}>{submitState.message}</div>}
        <div className="buttonGrid">
          <button className="primaryBtn" onClick={submit} disabled={submitState.status === 'loading'}>Отправить результат</button>
          <button className="ghostBtn" onClick={copySummary}>Скопировать итог</button>
          <button className="ghostBtn" onClick={exportJson}>Скачать JSON</button>
          <button className="ghostBtn" onClick={() => window.print()}>Печать / PDF</button>
        </div>
      </div>
    </div>
  );
}

function StageTimeList({ timings, now }) {
  const stages = timings?.stages || {};
  return (
    <div className="stageTimes">
      {STAGES.filter(s => s.id !== 'result').map(s => (
        <div key={s.id}>
          <b>{s.title}</b>
          <span>{stages[s.id]?.startedAt ? formatSeconds(getStageSeconds(stages[s.id], now)) : '—'}</span>
        </div>
      ))}
    </div>
  );
}

function AdminPage() {
  const [pin, setPin] = useState(() => sessionStorage.getItem('chappy_admin_pin') || '');
  const [unlocked, setUnlocked] = useState(() => Boolean(sessionStorage.getItem('chappy_admin_pin')));
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (query) params.set('q', query);
      const res = await fetch(`/api/admin/submissions?${params}`, { headers: { 'x-admin-pin': pin } });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Ошибка загрузки');
      setItems(json.data || []);
      setSelected(current => current || json.data?.[0] || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (unlocked) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, status]);

  function unlock() {
    if (!pin.trim()) return;
    sessionStorage.setItem('chappy_admin_pin', pin);
    setUnlocked(true);
  }

  async function updateSelected(patch) {
    if (!selected) return;
    const res = await fetch(`/api/admin/submissions/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify(patch)
    });
    const json = await res.json();
    if (!res.ok || !json.ok) return alert(json.error || 'Не удалось сохранить');
    const next = { ...selected, ...json.data };
    setSelected(next);
    setItems(prev => prev.map(i => i.id === selected.id ? { ...i, ...json.data } : i));
  }

  if (!unlocked) {
    return (
      <main className="adminLogin">
        <div className="loginCard">
          <p className="eyebrow">admin access</p>
          <h1>Админка результатов Chappy</h1>
          <p>Введи PIN из переменной <code>ADMIN_PIN</code> на Railway.</p>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="ADMIN_PIN" onKeyDown={e => e.key === 'Enter' && unlock()} />
          <button className="primaryBtn" onClick={unlock}>Войти</button>
        </div>
      </main>
    );
  }

  const stats = {
    total: items.length,
    avg: items.length ? Math.round(items.reduce((s, i) => s + Number(i.scores?.total || 0), 0) / items.length) : 0,
    strong: items.filter(i => Number(i.scores?.total || 0) >= 72).length,
    trends: items.reduce((s, i) => s + (Array.isArray(i.trends) ? i.trends.length : 0), 0),
    fast: items.filter(i => Number(i.scores?.axes?.speed || 0) >= 70).length
  };

  return (
    <main className="adminShell">
      <section className="adminHero">
        <div>
          <p className="eyebrow">Chappy Admin</p>
          <h1>Результаты кандидаток</h1>
          <p>Смотри score, роль, грейд, идеи, промт-тест, карточку, контент и скорость по этапам.</p>
        </div>
        <div className="adminStats">
          <span><b>{stats.total}</b> всего</span>
          <span><b>{stats.avg}</b> avg</span>
          <span><b>{stats.strong}</b> сильных</span>
          <span><b>{stats.fast}</b> быстрых</span>
          <span><b>{stats.trends}</b> идей</span>
        </div>
      </section>

      <section className="adminControls">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по имени" onKeyDown={e => e.key === 'Enter' && load()} />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">Все статусы</option>
          <option value="submitted">Новые</option>
          <option value="reviewed">Просмотрено</option>
          <option value="interview">На собеседование</option>
          <option value="reject">Отказ</option>
          <option value="hired">В работу</option>
        </select>
        <button className="primaryBtn" onClick={load}>{loading ? 'Загрузка...' : 'Обновить'}</button>
        <button className="ghostBtn" onClick={() => { sessionStorage.removeItem('chappy_admin_pin'); location.reload(); }}>Выйти</button>
      </section>

      {error && <div className="notice error">{error}</div>}

      <div className="adminGrid">
        <div className="submissionList">
          {items.map(item => (
            <button key={item.id} className={`candidateRow ${selected?.id === item.id ? 'active' : ''}`} onClick={() => setSelected(item)}>
              <div>
                <b>{item.candidate_name}</b>
                <small>{new Date(item.created_at).toLocaleString('ru-RU')}</small>
                <em>{item.recommendation?.role || item.scores?.role}</em>
              </div>
              <span className="scoreMini">{item.scores?.total || 0}</span>
            </button>
          ))}
          {!items.length && <div className="emptyState">Пока нет результатов.</div>}
        </div>
        <AdminDetail item={selected} onUpdate={updateSelected} />
      </div>
    </main>
  );
}

function AdminDetail({ item, onUpdate }) {
  const [notes, setNotes] = useState('');
  useEffect(() => setNotes(item?.notes || ''), [item]);
  if (!item) return <div className="detailPanel emptyState">Выбери кандидата слева.</div>;

  const scores = item.scores || {};
  return (
    <div className="detailPanel">
      <div className="detailHead">
        <div>
          <h2>{item.candidate_name}</h2>
          <p>{item.contact || 'контакт не указан'} · {item.telegram || 'telegram не указан'}</p>
        </div>
        <div className="bigScore">{scores.total || 0}<small>/100</small></div>
      </div>

      <div className="tagLine">
        <span>{scores.grade}</span>
        <span>{scores.role}</span>
        <span>{Array.isArray(item.trends) ? item.trends.length : 0} идей</span>
        <span>скорость {scores.axes?.speed ?? 0}/100</span>
        <span>{item.status}</span>
      </div>

      <p className="summaryBox">{item.recommendation?.summary || scores.summary}</p>

      <StageTimeList timings={item.timings} now={Date.now()} />

      <div className="axisList adminAxis">
        {Object.entries(scores.axes || {}).map(([axis, value]) => (
          <div className="axis" key={axis}>
            <label><span>{AXIS_LABELS[axis]}</span><b>{value}</b></label>
            <div><i style={{ width: `${value}%` }} /></div>
          </div>
        ))}
      </div>

      <h3>Этап 1 · Идеи</h3>
      <div className="adminTrendList">
        {(item.trends || []).map((t, i) => (
          <details key={t.id || i}>
            <summary>{i + 1}. {t.title || 'Без названия'}</summary>
            <p><b>Источник:</b> {t.source}</p>
            <p><b>Описание:</b> {t.description}</p>
            <p><b>Что загрузит:</b> {t.upload}</p>
            <p><b>Что получит:</b> {t.output}</p>
            <p><b>Кликабельность:</b> {t.clickability}</p>
            <p><b>Аудитория:</b> {t.audience}</p>
            <p><b>Оплата:</b> {t.monetization}</p>
          </details>
        ))}
      </div>

      <h3>Этап 2–5 · Промт, карточка, контент, анализ</h3>
      <div className="answerGrid">
        <Answer title="Первый промт" value={item.prompt_test?.originalPrompt} />
        <Answer title="Улучшенный промт" value={item.prompt_test?.improvedPrompt} />
        <Answer title="Что изменила" value={item.prompt_test?.whatChanged} />
        <Answer title="Карточка: заголовок" value={`${item.trend_card?.title || ''}\n${item.trend_card?.subtitle || ''}`} />
        <Answer title="Крючок к оплате" value={item.trend_card?.priceHook} />
        <Answer title="Telegram-пост" value={item.packaging?.telegramPost} />
        <Answer title="Рассылка в бот" value={item.packaging?.botBroadcast} />
        <Answer title="Сторис блогера" value={item.packaging?.bloggerStories} />
        <Answer title="Что запустить первым" value={item.kaizen?.firstLaunch} />
        <Answer title="Метрики" value={item.kaizen?.metrics} />
        <Answer title="Улучшение через 24 часа" value={item.kaizen?.improve24h} />
      </div>

      <div className="reviewBox">
        <label>Статус</label>
        <select defaultValue={item.status || 'submitted'} onChange={e => onUpdate({ status: e.target.value })}>
          <option value="submitted">Новые</option>
          <option value="reviewed">Просмотрено</option>
          <option value="interview">На собеседование</option>
          <option value="reject">Отказ</option>
          <option value="hired">В работу</option>
        </select>
        <label>Заметки руководителя</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Что заметил, куда подходит, вопросы на созвон..." />
        <button className="primaryBtn" onClick={() => onUpdate({ notes })}>Сохранить заметку</button>
      </div>
    </div>
  );
}

function Answer({ title, value }) {
  return <div className="answer"><b>{title}</b><p>{value || '—'}</p></div>;
}

function Input({ label, value, onChange, placeholder, className = '', required = false }) {
  return (
    <div className={`field ${className}`}>
      <label>{label}{required && <span>*</span>}</label>
      <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, className = '' }) {
  return (
    <div className={`field ${className}`}>
      <label>{label}</label>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Ответ...'} />
    </div>
  );
}

function InfoCard({ title, text }) {
  return <div className="infoCard"><b>{title}</b><p>{text}</p></div>;
}

createRoot(document.getElementById('root')).render(<App />);
