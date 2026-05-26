import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AXIS_LABELS, CASES, PSYCHOLOGY_QUESTIONS, calculateScores } from '../shared/scoring.js';
import './styles.css';

const STORAGE_KEY = 'chappy_candidate_lab_draft_v1';

const emptyTrend = () => ({
  id: crypto.randomUUID(),
  title: '',
  source: '',
  description: '',
  upload: '',
  output: '',
  prompts: ['', '', ''],
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
  psychology: {},
  cases: {},
  trends: [emptyTrend()],
  topTrends: [
    { trendId: '', reason: '' },
    { trendId: '', reason: '' },
    { trendId: '', reason: '' }
  ],
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
  }
};

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
          <small>тест потенциала · тренды · промты · kaizen</small>
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
  const [step, setStep] = useState(0);
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
  const scores = useMemo(() => calculateScores(state), [state]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setProfile = (key, value) => setState(prev => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
  const setPsych = (id, value) => setState(prev => ({ ...prev, psychology: { ...prev.psychology, [id]: Number(value) } }));
  const setCase = (id, value) => setState(prev => ({ ...prev, cases: { ...prev.cases, [id]: value } }));
  const setPackaging = (key, value) => setState(prev => ({ ...prev, packaging: { ...prev.packaging, [key]: value } }));
  const setKaizen = (key, value) => setState(prev => ({ ...prev, kaizen: { ...prev.kaizen, [key]: value } }));

  const steps = [
    { id: 'profile', title: 'Профиль', hint: 'Кто проходит тест и сколько времени готова уделять.' },
    { id: 'psych', title: 'Психология', hint: '20 быстрых вопросов на стиль мышления.' },
    { id: 'cases', title: 'Кейсы', hint: '10 рабочих ситуаций: продукт, метрики, стресс, kaizen.' },
    { id: 'trends', title: 'Тренды', hint: 'Добавляй тренды по одному. Кто сколько сможет — столько и делает.' },
    { id: 'top', title: 'Топ-3', hint: 'Выбери самые сильные идеи и объясни логику.' },
    { id: 'pack', title: 'Упаковка', hint: 'Пост, рассылка, сторис, CTA и заголовки.' },
    { id: 'kaizen', title: 'Kaizen', hint: 'Метрики, первый запуск и улучшение через 24 часа.' },
    { id: 'result', title: 'Отправка', hint: 'Проверка результата и отправка в админку.' }
  ];

  async function submit() {
    setSubmitState({ status: 'loading', message: 'Отправляем результат в Chappy...' });
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Не удалось отправить тест.');
      localStorage.removeItem(STORAGE_KEY);
      setSubmitState({ status: 'success', message: `Готово. Результат отправлен. Score: ${json.data.scores.total}/100.` });
    } catch (error) {
      setSubmitState({ status: 'error', message: error.message });
    }
  }

  function clearDraft() {
    if (!confirm('Очистить весь тест?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setState(structuredClone(initialState));
    setStep(0);
  }

  function jumpToMissing() {
    if (!state.profile.name.trim()) return setStep(0);
    const unansweredPsych = PSYCHOLOGY_QUESTIONS.find(q => state.psychology[q.id] === undefined);
    if (unansweredPsych) return setStep(1);
    const emptyCases = CASES.find(c => !String(state.cases[c.id] || '').trim());
    if (emptyCases) return setStep(2);
    const goodTrend = state.trends.find(t => t.title.trim() && t.description.trim());
    if (!goodTrend) return setStep(3);
    setStep(7);
  }

  return (
    <main className="appShell">
      <Hero scores={scores} />

      <div className="layout">
        <aside className="sidePanel">
          <Progress steps={steps} step={step} setStep={setStep} />
          <ScoreCard scores={scores} compact />
          <div className="sideActions">
            <button className="ghostBtn" onClick={jumpToMissing}>Найти пропуск</button>
            <button className="ghostBtn danger" onClick={clearDraft}>Очистить</button>
          </div>
        </aside>

        <section className="workArea">
          <StepHeader step={steps[step]} number={step + 1} total={steps.length} />

          {step === 0 && <ProfileStep profile={state.profile} setProfile={setProfile} />}
          {step === 1 && <PsychologyStep answers={state.psychology} setAnswer={setPsych} />}
          {step === 2 && <CasesStep answers={state.cases} setAnswer={setCase} />}
          {step === 3 && <TrendsStep trends={state.trends} setState={setState} />}
          {step === 4 && <TopTrendsStep state={state} setState={setState} />}
          {step === 5 && <PackagingStep state={state} setPackaging={setPackaging} />}
          {step === 6 && <KaizenStep kaizen={state.kaizen} setKaizen={setKaizen} />}
          {step === 7 && <ResultStep state={state} scores={scores} submitState={submitState} submit={submit} />}

          <div className="navControls">
            <button className="ghostBtn" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>Назад</button>
            {step < steps.length - 1 ? (
              <button className="primaryBtn" onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}>Дальше</button>
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
    return { ...structuredClone(initialState), ...parsed };
  } catch {
    return structuredClone(initialState);
  }
}

function Hero({ scores }) {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">AI trend hiring system · Railway + Supabase ready</p>
        <h1>Тест, который показывает не резюме, а потенциал.</h1>
        <p className="heroText">Кандидатка добавляет тренды по одному, раскрывает мышление, собирает промты, упаковку и kaizen-план. Результат улетает в админку.</p>
      </div>
      <div className="heroBadge">
        <span>{scores.total}</span>
        <b>/100</b>
        <small>{scores.grade}</small>
      </div>
    </section>
  );
}

function Progress({ steps, step, setStep }) {
  return (
    <div className="progressBox">
      <p className="panelTitle">Порядок теста</p>
      {steps.map((s, i) => (
        <button key={s.id} className={`stepPill ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} onClick={() => setStep(i)}>
          <span>{i + 1}</span>
          <b>{s.title}</b>
        </button>
      ))}
    </div>
  );
}

function StepHeader({ step, number, total }) {
  return (
    <div className="stepHeader">
      <p className="eyebrow">Шаг {number} / {total}</p>
      <h2>{step.title}</h2>
      <p>{step.hint}</p>
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
      <InfoCard title="Как проходить" text="Не надо идеально. Важно показать ход мыслей: почему тренд может сработать, что загрузит пользователь, что получит, как это привести к клику и оплате." />
    </div>
  );
}

function PsychologyStep({ answers, setAnswer }) {
  return (
    <div className="questionStack">
      {PSYCHOLOGY_QUESTIONS.map((q, idx) => (
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

function CasesStep({ answers, setAnswer }) {
  return (
    <div className="questionStack">
      {CASES.map((c, idx) => (
        <div className="caseCard" key={c.id}>
          <div className="questionMeta"><span>{idx + 1}</span><b>{AXIS_LABELS[c.axis]}</b></div>
          <h3>{c.title}</h3>
          <p>{c.text}</p>
          <textarea value={answers[c.id] || ''} onChange={e => setAnswer(c.id, e.target.value)} placeholder="Ответ: какие шаги, что проверишь, как улучшишь результат..." />
        </div>
      ))}
    </div>
  );
}

function TrendsStep({ trends, setState }) {
  const addTrend = () => setState(prev => ({ ...prev, trends: [...prev.trends, emptyTrend()] }));
  const removeTrend = (id) => setState(prev => ({ ...prev, trends: prev.trends.filter(t => t.id !== id) }));
  const updateTrend = (id, key, value) => setState(prev => ({
    ...prev,
    trends: prev.trends.map(t => t.id === id ? { ...t, [key]: value } : t)
  }));
  const updatePrompt = (id, index, value) => setState(prev => ({
    ...prev,
    trends: prev.trends.map(t => t.id === id ? { ...t, prompts: t.prompts.map((p, i) => i === index ? value : p) } : t)
  }));
  const addPrompt = (id) => setState(prev => ({
    ...prev,
    trends: prev.trends.map(t => t.id === id ? { ...t, prompts: [...t.prompts, ''] } : t)
  }));

  return (
    <div>
      <div className="actionLine">
        <div>
          <h3>Тренды добавляются по одному</h3>
          <p>Не ограничиваем жёстко 10 штуками. Кто сильнее — добавит больше и покажет широту поиска.</p>
        </div>
        <button className="primaryBtn" onClick={addTrend}>+ Добавить тренд</button>
      </div>

      <div className="trendStack">
        {trends.map((trend, idx) => (
          <div className="trendCard" key={trend.id}>
            <div className="trendHead">
              <div><span>Trend #{idx + 1}</span><h3>{trend.title || 'Новый AI-тренд'}</h3></div>
              {trends.length > 1 && <button className="iconBtn" onClick={() => removeTrend(trend.id)}>Удалить</button>}
            </div>
            <div className="grid two">
              <Input label="Название тренда" value={trend.title} onChange={v => updateTrend(trend.id, 'title', v)} placeholder="Например: Cinematic AI Selfie" />
              <Input label="Источник / ссылка / где увидела" value={trend.source} onChange={v => updateTrend(trend.id, 'source', v)} placeholder="TikTok, Reels, X, Telegram, конкурент" />
              <TextArea label="Короткое описание" value={trend.description} onChange={v => updateTrend(trend.id, 'description', v)} placeholder="В чём суть тренда и почему он цепляет?" />
              <TextArea label="Что загружает пользователь" value={trend.upload} onChange={v => updateTrend(trend.id, 'upload', v)} placeholder="Фото лица, видео, скрин, голос, текст, референс..." />
              <TextArea label="Что получает на выходе" value={trend.output} onChange={v => updateTrend(trend.id, 'output', v)} placeholder="Готовый визуал, видео, аватарка, сторис, обложка..." />
              <TextArea label="Почему кликабельно" value={trend.clickability} onChange={v => updateTrend(trend.id, 'clickability', v)} placeholder="Зависть, самоидентификация, красота, юмор, статус, быстрый вау..." />
              <TextArea label="Для какой аудитории" value={trend.audience} onChange={v => updateTrend(trend.id, 'audience', v)} placeholder="Девушки 18–30, блогеры, пары, предприниматели, геймеры..." />
              <TextArea label="Как может привести к оплате" value={trend.monetization} onChange={v => updateTrend(trend.id, 'monetization', v)} placeholder="Почему пользователь купит кредиты / подписку / повторит генерацию?" />
              <TextArea className="wide" label="Почему это актуально сейчас" value={trend.whyNow} onChange={v => updateTrend(trend.id, 'whyNow', v)} placeholder="Свежесть, сезон, мем, инфоповод, визуальный тренд..." />
            </div>
            <div className="promptBox">
              <div className="promptHead"><b>Варианты промта</b><button className="ghostBtn small" onClick={() => addPrompt(trend.id)}>+ промт</button></div>
              {trend.prompts.map((p, i) => (
                <textarea key={i} value={p} onChange={e => updatePrompt(trend.id, i, e.target.value)} placeholder={`Prompt ${i + 1}: стиль, сцена, свет, формат, ограничения...`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopTrendsStep({ state, setState }) {
  const options = state.trends.filter(t => t.title.trim());
  const update = (index, key, value) => setState(prev => ({
    ...prev,
    topTrends: prev.topTrends.map((t, i) => i === index ? { ...t, [key]: value } : t)
  }));
  return (
    <div className="questionStack">
      {[0, 1, 2].map(i => (
        <div className="caseCard" key={i}>
          <div className="questionMeta"><span>#{i + 1}</span><b>Сильный тренд</b></div>
          <select value={state.topTrends[i]?.trendId || ''} onChange={e => update(i, 'trendId', e.target.value)}>
            <option value="">Выбери из добавленных трендов</option>
            {options.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <textarea value={state.topTrends[i]?.reason || ''} onChange={e => update(i, 'reason', e.target.value)} placeholder="Почему этот тренд сильный? Где будет клик, запуск, оплата? Что может помешать?" />
        </div>
      ))}
    </div>
  );
}

function PackagingStep({ state, setPackaging }) {
  const options = state.trends.filter(t => t.title.trim());
  return (
    <div className="grid two">
      <div className="field wide">
        <label>Какой тренд упаковываем</label>
        <select value={state.packaging.trendId} onChange={e => setPackaging('trendId', e.target.value)}>
          <option value="">Выбери тренд</option>
          {options.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>
      <TextArea label="Пост в Telegram-канал" value={state.packaging.telegramPost} onChange={v => setPackaging('telegramPost', v)} placeholder="Короткий пост: хук, обещание результата, что загрузить, кнопка/CTA." />
      <TextArea label="Рассылка в бот" value={state.packaging.botBroadcast} onChange={v => setPackaging('botBroadcast', v)} placeholder="1–3 предложения + кнопка. Без воды." />
      <TextArea label="Сценарий сторис для блогера на 3–4 экрана" value={state.packaging.bloggerStories} onChange={v => setPackaging('bloggerStories', v)} placeholder="Экран 1: хук. Экран 2: процесс. Экран 3: результат. Экран 4: CTA." />
      <TextArea label="3 CTA" value={state.packaging.cta} onChange={v => setPackaging('cta', v)} placeholder="Например: Сделать себя в этом стиле / Загрузить фото / Получить 3 варианта" />
      <TextArea label="2 заголовка для карточки тренда" value={state.packaging.cardTitles} onChange={v => setPackaging('cardTitles', v)} placeholder="Коротко, кликабельно, понятно с первого взгляда." />
    </div>
  );
}

function KaizenStep({ kaizen, setKaizen }) {
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

function ResultStep({ state, scores, submitState, submit }) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ ...state, scores }, null, 2)], { type: 'application/json' });
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
        <p>Результат попадёт в Supabase и будет виден в админке. Черновик сохраняется в браузере автоматически до отправки.</p>
        <div className="miniStats">
          <span><b>{state.trends.length}</b> трендов</span>
          <span><b>{Object.keys(state.cases).filter(k => state.cases[k]?.trim()).length}</b> кейсов</span>
          <span><b>{Object.keys(state.psychology).length}</b> психоответов</span>
        </div>
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
      if (!selected && json.data?.length) setSelected(json.data[0]);
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
    trends: items.reduce((s, i) => s + (Array.isArray(i.trends) ? i.trends.length : 0), 0)
  };

  return (
    <main className="adminShell">
      <section className="adminHero">
        <div>
          <p className="eyebrow">Chappy Admin</p>
          <h1>Результаты кандидаток</h1>
          <p>Смотри score, роль, грейд, тренды, упаковку и kaizen-ответы. Можно ставить статус и заметки.</p>
        </div>
        <div className="adminStats">
          <span><b>{stats.total}</b> всего</span>
          <span><b>{stats.avg}</b> avg</span>
          <span><b>{stats.strong}</b> сильных</span>
          <span><b>{stats.trends}</b> трендов</span>
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
              </div>
              <span className="scoreMini">{item.scores?.total || 0}</span>
              <em>{item.recommendation?.role || item.scores?.role}</em>
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
        <span>{Array.isArray(item.trends) ? item.trends.length : 0} трендов</span>
        <span>{item.status}</span>
      </div>

      <p className="summaryBox">{item.recommendation?.summary || scores.summary}</p>

      <div className="axisList adminAxis">
        {Object.entries(scores.axes || {}).map(([axis, value]) => (
          <div className="axis" key={axis}>
            <label><span>{AXIS_LABELS[axis]}</span><b>{value}</b></label>
            <div><i style={{ width: `${value}%` }} /></div>
          </div>
        ))}
      </div>

      <h3>Тренды</h3>
      <div className="adminTrendList">
        {(item.trends || []).map((t, i) => (
          <details key={t.id || i}>
            <summary>{i + 1}. {t.title || 'Без названия'}</summary>
            <p><b>Описание:</b> {t.description}</p>
            <p><b>Что загрузит:</b> {t.upload}</p>
            <p><b>Что получит:</b> {t.output}</p>
            <p><b>Кликабельность:</b> {t.clickability}</p>
            <p><b>Аудитория:</b> {t.audience}</p>
            <p><b>Оплата:</b> {t.monetization}</p>
            {Array.isArray(t.prompts) && t.prompts.filter(Boolean).map((p, k) => <pre key={k}>{p}</pre>)}
          </details>
        ))}
      </div>

      <h3>Упаковка и Kaizen</h3>
      <div className="answerGrid">
        <Answer title="Telegram-пост" value={item.packaging?.telegramPost} />
        <Answer title="Рассылка в бот" value={item.packaging?.botBroadcast} />
        <Answer title="Сторис блогера" value={item.packaging?.bloggerStories} />
        <Answer title="Метрики" value={item.kaizen?.metrics} />
        <Answer title="Улучшение через 24 часа" value={item.kaizen?.improve24h} />
        <Answer title="Прокачка за 30 дней" value={item.kaizen?.selfGrowth} />
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
