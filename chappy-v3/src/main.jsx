import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AXIS_LABELS, PSYCHOLOGY_QUESTIONS, calculateScores } from '../shared/scoring.js';
import './styles.css';

const STORAGE_KEY = 'chappy_candidate_lab_draft_v3_junior_test';

const STAGES = [
  { id: 'profile', title: 'Профиль', hint: 'Кто проходит тест. После этого запускается таймер.' },
  { id: 'ideas', title: '1. Найти 5 идей', hint: 'Добавь 5 AI-трендов. Важно: простота, кликабельность и понятный результат для пользователя.' },
  { id: 'prompt', title: '2. Протестировать промт', hint: 'Выбери идею, напиши промт, опиши результат теста и улучшенную версию.' },
  { id: 'card', title: '3. Оформить карточку', hint: 'Собери карточку тренда так, чтобы пользователь понял: что загрузить, что получит, зачем нажать.' },
  { id: 'content', title: '4. Пост / рассылка', hint: 'Упакуй один тренд в пост, короткую рассылку, CTA и заголовки. Блогерские креативы на старте не нужны.' },
  { id: 'analysis', title: '5. Сильное / слабое', hint: 'Коротко объясни, что запускать первым, где шанс на клик/генерацию, где риск, какие метрики смотреть.' },
  { id: 'psych', title: '6. Рабочий ритм', hint: 'Короткая самооценка: дисциплина, самостоятельность, правки, интерес к AI и таблицам.' },
  { id: 'result', title: '7. Итог', hint: 'Проверка результата, скорости и отправка в Supabase.' }
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
  actionReason: '',
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
    actionHook: '',
    previewText: '',
    qualityCheck: ''
  },
  packaging: {
    trendId: '',
    telegramPost: '',
    botBroadcast: '',
    promoTeaser: '',
    cta: '',
    cardTitles: ''
  },
  kaizen: {
    firstLaunch: '',
    bestGenerationChance: '',
    weakestTrend: '',
    metrics: '',
    improve24h: '',
    selfGrowth: ''
  },
  psychology: {},
  timings: {
    totalStartedAt: '',
    totalCompletedAt: '',
    currentStageId: 'profile',
    stages: {}
  }
};

const requiredPsychQuestions = PSYCHOLOGY_QUESTIONS.slice(0, 8);

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
          <small>junior-тест · роли · скорость · Supabase</small>
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
    const filledTrends = getFilledTrends(state.trends);
    if (id === 'profile') {
      if (!state.profile.name.trim()) return 'Укажи имя.';
      if (!state.profile.contact.trim() && !state.profile.telegram.trim()) return 'Укажи телефон/email или Telegram.';
    }
    if (id === 'ideas') {
      if (filledTrends.length < 5) return 'Нужно добавить 5 идей. На старте нам важна насмотренность и выбор сильных трендов.';
      const weak = filledTrends.find(t => !t.source.trim() || !t.description.trim() || !t.upload.trim() || !t.output.trim() || !t.clickability.trim() || !t.audience.trim());
      if (weak) return 'У каждой идеи должны быть источник, описание, что загрузит пользователь, что получит, почему кликнет и аудитория.';
    }
    if (id === 'prompt') {
      const p = state.promptTest;
      if (!p.trendId) return 'Выбери идею для промт-теста.';
      if (!p.originalPrompt.trim() || !p.testResult.trim() || !p.improvedPrompt.trim() || !p.whatChanged.trim()) return 'Заполни промт, результат теста, улучшенный промт и что изменено.';
    }
    if (id === 'card') {
      const c = state.trendCard;
      if (!c.trendId) return 'Выбери тренд для карточки.';
      if (!c.title.trim() || !c.subtitle.trim() || !c.whatUpload.trim() || !c.whatResult.trim() || !c.actionHook.trim() || !c.qualityCheck.trim()) return 'Заполни название, подзаголовок, что загрузить, результат, крючок к действию и чек качества.';
    }
    if (id === 'content') {
      const p = state.packaging;
      if (!p.trendId) return 'Выбери тренд для упаковки.';
      if (!p.telegramPost.trim() || !p.botBroadcast.trim() || !p.promoTeaser.trim() || !p.cta.trim() || !p.cardTitles.trim()) return 'Заполни Telegram-пост, рассылку, промо-тизер, CTA и заголовки.';
    }
    if (id === 'analysis') {
      const k = state.kaizen;
      if (!k.firstLaunch.trim() || !k.bestGenerationChance.trim() || !k.weakestTrend.trim() || !k.metrics.trim() || !k.improve24h.trim()) return 'Заполни первый запуск, шанс генерации, слабый тренд, метрики и улучшения через 24 часа.';
    }
    if (id === 'psych') {
      const unanswered = requiredPsychQuestions.find(q => state.psychology[q.id] === undefined);
      if (unanswered) return 'Ответь на все вопросы психо-ритма.';
    }
    return '';
  }

  function canOpenStep(index) {
    if (index <= step) return true;
    if (index === 0) return true;
    const prevId = STAGES[index - 1]?.id;
    if (prevId === 'result') return true;
    return Boolean(state.timings?.stages?.[prevId]?.completedAt);
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

  function jumpToMissing() {
    for (let i = 0; i < STAGES.length - 1; i++) {
      const err = validateStep(i);
      if (err) {
        setStep(i);
        setGateError(err);
        return;
      }
    }
    setStep(STAGES.length - 1);
  }

  async function submit() {
    const error = validateStep(6);
    if (error) {
      setStep(6);
      setGateError(error);
      return;
    }
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

          {step === 0 && <ProfileStep profile={state.profile} setProfile={(k, v) => mutate(prev => ({ ...prev, profile: { ...prev.profile, [k]: v } }))} />}
          {step === 1 && <IdeasStep trends={state.trends} setState={mutate} />}
          {step === 2 && <PromptTestStep state={state} setState={mutate} />}
          {step === 3 && <TrendCardStep state={state} setState={mutate} />}
          {step === 4 && <PackagingStep state={state} setState={mutate} />}
          {step === 5 && <AnalysisStep kaizen={state.kaizen} setKaizen={(k, v) => mutate(prev => ({ ...prev, kaizen: { ...prev.kaizen, [k]: v } }))} />}
          {step === 6 && <PsychologyStep answers={state.psychology} setAnswer={(id, value) => mutate(prev => ({ ...prev, psychology: { ...prev.psychology, [id]: Number(value) } }))} />}
          {step === 7 && <ResultStep state={state} scores={scores} submitState={submitState} submit={submit} now={now} />}

          <div className="navControls">
            <button className="ghostBtn" disabled={step === 0} onClick={() => { setGateError(''); setStep(s => Math.max(0, s - 1)); }}>Назад</button>
            {step < STAGES.length - 1 ? (
              <button className="primaryBtn" onClick={goNext}>Закрыть этап и дальше</button>
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
        <p className="eyebrow">Chappy Junior Test · Railway + Supabase ready</p>
        <h1>Этапный тест: видно мышление, скорость и роль.</h1>
        <p className="heroText">Кандидатка проходит простой Junior-тест: 5 идей → промт → карточка → пост/рассылка → короткий анализ. Цель — понять роль: Trend & Prompt или Content & Creative.</p>
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
      <p className="panelTitle">Порядок теста</p>
      {steps.map((s, i) => {
        const st = timings?.stages?.[s.id];
        const locked = !canOpenStep(i);
        return (
          <button key={s.id} disabled={locked} className={`stepPill ${i === step ? 'active' : ''} ${st?.completedAt ? 'done' : ''} ${locked ? 'locked' : ''}`} onClick={() => setStep(i)}>
            <span>{i + 1}</span>
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
          <p>Нужно 5 трендов. Здесь видно насмотренность, скорость поиска и продуктовое чутьё без перегруза продажами.</p>
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
              <TextArea label="Почему пользователь захочет попробовать" value={trend.actionReason} onChange={v => updateTrend(trend.id, 'actionReason', v)} placeholder="Почему нажмёт, загрузит фото/текст и запустит генерацию?" />
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
      <TextArea label="Крючок к действию" value={state.trendCard.actionHook} onChange={v => setCard('actionHook', v)} placeholder="Почему пользователь захочет нажать и попробовать этот тренд?" />
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
      <TextArea label="Короткий промо-тизер для канала" value={state.packaging.promoTeaser} onChange={v => setPackaging('promoTeaser', v)} placeholder="1–2 коротких абзаца: хук → что получит → зачем попробовать." />
      <TextArea label="3 CTA" value={state.packaging.cta} onChange={v => setPackaging('cta', v)} placeholder="Сделать себя в этом стиле / Загрузить фото / Получить 3 варианта" />
      <TextArea label="2 заголовка для карточки тренда" value={state.packaging.cardTitles} onChange={v => setPackaging('cardTitles', v)} placeholder="Коротко, кликабельно, понятно с первого взгляда." />
    </div>
  );
}

function AnalysisStep({ kaizen, setKaizen }) {
  return (
    <div className="grid two">
      <TextArea label="Какой тренд запустила бы первым и почему" value={kaizen.firstLaunch} onChange={v => setKaizen('firstLaunch', v)} />
      <TextArea label="Какой может дать больше запусков генерации" value={kaizen.bestGenerationChance} onChange={v => setKaizen('bestGenerationChance', v)} />
      <TextArea label="Какой самый слабый и почему" value={kaizen.weakestTrend} onChange={v => setKaizen('weakestTrend', v)} />
      <TextArea label="Какие метрики смотрела бы после запуска" value={kaizen.metrics} onChange={v => setKaizen('metrics', v)} placeholder="CTR, start generation, completion, activation, repeat, refund, negative feedback..." />
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
  const [view, setView] = useState('list');
  const [sortBy, setSortBy] = useState('date_desc');
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

  const sortedItems = useMemo(() => {
    const arr = [...items];
    const get = (it) => ({
      total: Number(it.scores?.total || 0),
      date: new Date(it.created_at).getTime() || 0,
      speed: Number(it.scores?.axes?.speed || 0),
      name: (it.candidate_name || '').toLowerCase()
    });
    arr.sort((a, b) => {
      const A = get(a), B = get(b);
      switch (sortBy) {
        case 'score_desc': return B.total - A.total;
        case 'score_asc': return A.total - B.total;
        case 'speed_desc': return B.speed - A.speed;
        case 'date_asc': return A.date - B.date;
        case 'name_asc': return A.name.localeCompare(B.name, 'ru');
        default: return B.date - A.date;
      }
    });
    return arr;
  }, [items, sortBy]);

  function exportCsv() {
    if (!sortedItems.length) {
      alert('Нет данных для экспорта.');
      return;
    }
    const cols = [
      ['Дата', it => new Date(it.created_at).toLocaleString('ru-RU')],
      ['Имя', it => it.candidate_name || ''],
      ['Контакт', it => it.contact || ''],
      ['Telegram', it => it.telegram || ''],
      ['Источник', it => it.source || ''],
      ['Статус', it => it.status || ''],
      ['Score', it => it.scores?.total ?? ''],
      ['Грейд', it => it.scores?.grade || ''],
      ['Роль', it => it.scores?.role || ''],
      ['Идей', it => Array.isArray(it.trends) ? it.trends.length : 0],
      ['Длительность, мин', it => Math.round(Number(it.duration_seconds || 0) / 60)],
      ['Trends', it => it.scores?.axes?.trends ?? ''],
      ['Prompts', it => it.scores?.axes?.prompts ?? ''],
      ['Product', it => it.scores?.axes?.product ?? ''],
      ['Creative', it => it.scores?.axes?.creative ?? ''],
      ['Metrics', it => it.scores?.axes?.metrics ?? ''],
      ['Discipline', it => it.scores?.axes?.discipline ?? ''],
      ['Speed', it => it.scores?.axes?.speed ?? ''],
      ['Autonomy', it => it.scores?.axes?.autonomy ?? ''],
      ['Kaizen', it => it.scores?.axes?.kaizen ?? ''],
      ['Resilience', it => it.scores?.axes?.resilience ?? ''],
      ['Summary', it => it.scores?.summary || it.recommendation?.summary || ''],
      ['Risk flags', it => Array.isArray(it.recommendation?.riskFlags) ? it.recommendation.riskFlags.join('; ') : ''],
      ['Заметки', it => it.notes || '']
    ];
    const esc = (v) => {
      const s = String(v ?? '');
      if (/[";\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines = [cols.map(c => esc(c[0])).join(';')];
    sortedItems.forEach(it => {
      lines.push(cols.map(c => esc(c[1](it))).join(';'));
    });
    const csv = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `chappy-candidates-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <p>Смотри score, рекомендуемую роль, грейд, 5 идей, промт-тест, карточку, контент и скорость. Автооценка — только подсказка, финальное решение за руководителем.</p>
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
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} title="Сортировка">
          <option value="date_desc">Сначала новые</option>
          <option value="date_asc">Сначала старые</option>
          <option value="score_desc">По score ↓</option>
          <option value="score_asc">По score ↑</option>
          <option value="speed_desc">По скорости ↓</option>
          <option value="name_asc">По имени А-Я</option>
        </select>
        <div className="adminTabs">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Список</button>
          <button className={view === 'analytics' ? 'active' : ''} onClick={() => setView('analytics')}>Аналитика</button>
        </div>
        <button className="primaryBtn" onClick={load}>{loading ? 'Загрузка...' : 'Обновить'}</button>
        <button className="ghostBtn" onClick={exportCsv}>⇩ CSV</button>
        <button className="ghostBtn" onClick={() => { sessionStorage.removeItem('chappy_admin_pin'); location.reload(); }}>Выйти</button>
      </section>

      {error && <div className="notice error">{error}</div>}

      {view === 'analytics' ? (
        <AdminAnalytics items={sortedItems} />
      ) : (
        <div className="adminGrid">
          <div className="submissionList">
            {sortedItems.map(item => (
              <button key={item.id} className={`candidateRow ${selected?.id === item.id ? 'active' : ''}`} onClick={() => setSelected(item)}>
                <div>
                  <b>{item.candidate_name}</b>
                  <small>{new Date(item.created_at).toLocaleString('ru-RU')}</small>
                  <em>{item.recommendation?.role || item.scores?.role}</em>
                </div>
                <span className="scoreMini">{item.scores?.total || 0}</span>
              </button>
            ))}
            {!sortedItems.length && <div className="emptyState">Пока нет результатов.</div>}
          </div>
          <AdminDetail item={selected} onUpdate={updateSelected} />
        </div>
      )}
    </main>
  );
}

function AdminAnalytics({ items }) {
  if (!items.length) {
    return <div className="analyticsShell"><div className="emptyState">Нет данных для аналитики. Подожди первых кандидатов.</div></div>;
  }

  const total = items.length;
  const avg = Math.round(items.reduce((s, i) => s + Number(i.scores?.total || 0), 0) / total);
  const median = (() => {
    const sorted = items.map(i => Number(i.scores?.total || 0)).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  })();

  const byGrade = countBy(items, i => i.scores?.grade || '—');
  const byRole = countBy(items, i => i.scores?.role || '—');
  const byStatus = countBy(items, i => i.status || 'submitted');

  // Score histogram: 10 buckets of 10
  const buckets = Array.from({ length: 10 }, (_, i) => ({ label: `${i * 10}-${i * 10 + 9}`, count: 0 }));
  items.forEach(i => {
    const s = Math.min(99, Math.max(0, Number(i.scores?.total || 0)));
    buckets[Math.floor(s / 10)].count++;
  });

  // Average axes
  const axisKeys = ['trends', 'prompts', 'product', 'creative', 'metrics', 'discipline', 'speed', 'autonomy', 'kaizen', 'resilience'];
  const avgAxes = axisKeys.map(k => ({
    key: k,
    label: AXIS_LABELS[k] || k,
    value: Math.round(items.reduce((s, i) => s + Number(i.scores?.axes?.[k] || 0), 0) / total)
  }));

  // Submissions over time (last 14 days)
  const timeline = (() => {
    const days = 14;
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let d = days - 1; d >= 0; d--) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - d);
      const key = dt.toISOString().slice(0, 10);
      out.push({ key, label: `${dt.getDate()}.${String(dt.getMonth() + 1).padStart(2, '0')}`, count: 0 });
    }
    items.forEach(i => {
      const k = new Date(i.created_at).toISOString().slice(0, 10);
      const slot = out.find(s => s.key === k);
      if (slot) slot.count++;
    });
    return out;
  })();

  const statusLabels = {
    submitted: 'Новые', reviewed: 'Просмотрено', interview: 'Собес', reject: 'Отказ', hired: 'В работу'
  };

  return (
    <div className="analyticsShell">
      <div className="kpiRow">
        <Kpi label="Кандидатов" value={total} />
        <Kpi label="Средний score" value={avg} suffix="/100" />
        <Kpi label="Медиана" value={median} suffix="/100" />
        <Kpi label="Сильных (≥72)" value={items.filter(i => Number(i.scores?.total || 0) >= 72).length} />
        <Kpi label="Быстрых (speed≥70)" value={items.filter(i => Number(i.scores?.axes?.speed || 0) >= 70).length} />
        <Kpi label="Идей всего" value={items.reduce((s, i) => s + (Array.isArray(i.trends) ? i.trends.length : 0), 0)} />
      </div>

      <div className="chartsGrid">
        <ChartCard title="Распределение по score" subtitle="Сколько кандидатов в каждом диапазоне 0-100">
          <BarChart data={buckets.map(b => ({ label: b.label, value: b.count }))} color="var(--accent)" />
        </ChartCard>

        <ChartCard title="Поток заявок" subtitle="Последние 14 дней">
          <BarChart data={timeline.map(t => ({ label: t.label, value: t.count }))} color="#7aa6ff" />
        </ChartCard>

        <ChartCard title="Грейды" subtitle="Распределение по уровням">
          <HBarChart data={Object.entries(byGrade).map(([k, v]) => ({ label: k, value: v }))} total={total} color="var(--accent)" />
        </ChartCard>

        <ChartCard title="Роли" subtitle="Рекомендации системы">
          <HBarChart data={Object.entries(byRole).map(([k, v]) => ({ label: k, value: v }))} total={total} color="#9d7aff" />
        </ChartCard>

        <ChartCard title="Воронка статусов" subtitle="Где находятся кандидаты сейчас">
          <HBarChart
            data={Object.entries(byStatus).map(([k, v]) => ({ label: statusLabels[k] || k, value: v }))}
            total={total}
            color="#ffb13a"
          />
        </ChartCard>

        <ChartCard title="Средние по осям" subtitle="Где кандидаты сильнее/слабее в среднем">
          <HBarChart data={avgAxes.map(a => ({ label: a.label, value: a.value }))} total={100} color="#3ecf8e" suffix="/100" />
        </ChartCard>
      </div>
    </div>
  );
}

function countBy(arr, fn) {
  const map = {};
  arr.forEach(x => {
    const k = fn(x);
    map[k] = (map[k] || 0) + 1;
  });
  return map;
}

function Kpi({ label, value, suffix }) {
  return (
    <div className="kpi">
      <span className="kpiVal">{value}{suffix && <small>{suffix}</small>}</span>
      <span className="kpiLabel">{label}</span>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="chartCard">
      <div className="chartHead">
        <b>{title}</b>
        <small>{subtitle}</small>
      </div>
      <div className="chartBody">{children}</div>
    </div>
  );
}

function BarChart({ data, color = 'var(--accent)' }) {
  const max = Math.max(1, ...data.map(d => d.value));
  const W = 520, H = 180, PAD_L = 28, PAD_B = 28, PAD_T = 8, PAD_R = 8;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const barW = innerW / data.length;
  const gap = Math.max(2, barW * 0.18);
  const gridLines = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chartSvg" preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = PAD_T + (innerH * i) / gridLines;
        const v = Math.round(max - (max * i) / gridLines);
        return (
          <g key={i}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={PAD_L - 6} y={y + 3} fontSize="9" fill="rgba(255,255,255,0.45)" textAnchor="end">{v}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = d.value === 0 ? 0 : (innerH * d.value) / max;
        const x = PAD_L + i * barW + gap / 2;
        const y = PAD_T + innerH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW - gap} height={h} fill={color} rx="3" opacity={d.value === 0 ? 0.15 : 0.9}>
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            {d.value > 0 && (
              <text x={x + (barW - gap) / 2} y={y - 3} fontSize="9" fill="rgba(255,255,255,0.7)" textAnchor="middle">{d.value}</text>
            )}
            <text x={x + (barW - gap) / 2} y={H - 10} fontSize="9" fill="rgba(255,255,255,0.5)" textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function HBarChart({ data, total, color = 'var(--accent)', suffix = '' }) {
  const max = Math.max(1, ...data.map(d => d.value), total || 0);
  const rowH = 22;
  const labelW = 160;
  const W = 520;
  const H = data.length * rowH + 8;
  const trackX = labelW;
  const trackW = W - labelW - 50;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chartSvg" preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const y = i * rowH + 4;
        const w = (trackW * d.value) / max;
        return (
          <g key={i}>
            <text x={labelW - 8} y={y + 14} fontSize="11" fill="rgba(255,255,255,0.78)" textAnchor="end">
              {d.label.length > 24 ? d.label.slice(0, 23) + '…' : d.label}
              <title>{d.label}</title>
            </text>
            <rect x={trackX} y={y + 4} width={trackW} height={rowH - 10} fill="rgba(255,255,255,0.05)" rx="4" />
            <rect x={trackX} y={y + 4} width={w} height={rowH - 10} fill={color} opacity="0.85" rx="4">
              <title>{`${d.label}: ${d.value}${suffix}`}</title>
            </rect>
            <text x={trackX + trackW + 6} y={y + 14} fontSize="11" fill="rgba(255,255,255,0.85)">{d.value}{suffix}</text>
          </g>
        );
      })}
    </svg>
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
            <p><b>Почему попробует:</b> {t.actionReason}</p>
          </details>
        ))}
      </div>

      <h3>Этап 2–5 · Промт, карточка, контент, анализ</h3>
      <div className="answerGrid">
        <Answer title="Первый промт" value={item.prompt_test?.originalPrompt} />
        <Answer title="Улучшенный промт" value={item.prompt_test?.improvedPrompt} />
        <Answer title="Что изменила" value={item.prompt_test?.whatChanged} />
        <Answer title="Карточка: заголовок" value={`${item.trend_card?.title || ''}\n${item.trend_card?.subtitle || ''}`} />
        <Answer title="Крючок к действию" value={item.trend_card?.actionHook} />
        <Answer title="Telegram-пост" value={item.packaging?.telegramPost} />
        <Answer title="Рассылка в бот" value={item.packaging?.botBroadcast} />
        <Answer title="Промо-тизер" value={item.packaging?.promoTeaser} />
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
