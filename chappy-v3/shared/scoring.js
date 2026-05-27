export const AXES = [
  'trends',
  'prompts',
  'creative',
  'metrics',
  'discipline',
  'autonomy',
  'kaizen',
  'resilience',
  'product',
  'speed'
];

export const AXIS_LABELS = {
  trends: 'Тренды',
  prompts: 'Промты',
  creative: 'Креатив',
  metrics: 'Метрики',
  discipline: 'Дисциплина',
  autonomy: 'Самостоятельность',
  kaizen: 'Kaizen',
  resilience: 'Устойчивость',
  product: 'Продуктовое мышление',
  speed: 'Скорость решения'
};

export const PSYCHOLOGY_QUESTIONS = [
  { id: 'q1', axis: 'trends', text: 'Я быстро замечаю повторяющиеся форматы в Reels/TikTok/Telegram и понимаю, почему их повторяют.' },
  { id: 'q2', axis: 'product', text: 'Когда вижу красивую идею, сразу думаю: “что должен сделать пользователь, чтобы захотеть попробовать генерацию?”' },
  { id: 'q3', axis: 'discipline', text: 'Мне проще работать маленькими ежедневными итерациями, чем ждать вдохновения.' },
  { id: 'q4', axis: 'prompts', text: 'Я люблю докручивать формулировку промта, пока результат не станет стабильным.' },
  { id: 'q5', axis: 'creative', text: 'Я умею переупаковать одну идею под разные аудитории и смыслы.' },
  { id: 'q6', axis: 'metrics', text: 'После публикации мне важно смотреть цифры, а не только “нравится / не нравится”.' },
  { id: 'q7', axis: 'resilience', text: 'Если идею раскритиковали, я не обижаюсь, а быстро улучшаю её.' },
  { id: 'q8', axis: 'kaizen', text: 'После каждой задачи я могу назвать одну вещь, которую завтра сделаю лучше.' },
  { id: 'q9', axis: 'autonomy', text: 'Я могу сама найти референсы, сравнить варианты и предложить решение без постоянного контроля.' },
  { id: 'q10', axis: 'trends', text: 'Я понимаю разницу между “модно выглядит” и “люди захотят повторить это на себе”.' },
  { id: 'q11', axis: 'creative', text: 'Я хорошо чувствую визуальный вайб: премиум, ирония, viral, beauty, lifestyle, cringe, cinematic.' },
  { id: 'q12', axis: 'prompts', text: 'Я могу написать 3–5 разных промтов на одну идею, а не один случайный текст.' },
  { id: 'q13', axis: 'metrics', text: 'Я понимаю, что CTR, запуск генерации, успешный результат и повторная генерация — это разные этапы воронки.' },
  { id: 'q14', axis: 'discipline', text: 'Я нормально отношусь к таблицам, чек-листам, статусам и ежедневному короткому отчёту.' },
  { id: 'q15', axis: 'product', text: 'Я могу объяснить ценность тренда простыми словами за 1–2 предложения.' },
  { id: 'q16', axis: 'resilience', text: 'В стрессовой задаче я сначала разбиваю её на шаги, а не паникую.' },
  { id: 'q17', axis: 'kaizen', text: 'Мне интересно не просто сделать, а построить систему, которая завтра будет работать быстрее.' },
  { id: 'q18', axis: 'autonomy', text: 'Если данных мало, я могу сделать разумную гипотезу и честно указать, что нужно проверить.' },
  { id: 'q19', axis: 'trends', text: 'Я регулярно сохраняю удачные референсы, тренды, промты, визуальные идеи.' },
  { id: 'q20', axis: 'product', text: 'Для меня хороший контент — тот, который двигает пользователя к действию.' }
];

export const CASES = [];

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const filled = (v) => typeof v === 'string' && v.trim().length > 0;
const wordCount = (v) => filled(v) ? v.trim().split(/\s+/).length : 0;

function scoreText(v, max = 10) {
  const words = wordCount(v);
  if (words < 5) return 0;
  if (words < 20) return Math.round(max * 0.35);
  if (words < 45) return Math.round(max * 0.65);
  return max;
}

function scoreSpeed(payload = {}, trendsCount = 0) {
  const stages = payload.timings?.stages || {};
  const seconds = Object.values(stages).reduce((sum, st) => sum + Number(st?.durationSec || 0), 0);
  if (!seconds) return { score: 50, seconds: 0 };

  const minutes = seconds / 60;
  const volumeBonus = clamp((trendsCount - 5) * 4, 0, 12);
  let base = 30;
  if (minutes <= 45) base = 100;
  else if (minutes <= 90) base = 86;
  else if (minutes <= 150) base = 72;
  else if (minutes <= 240) base = 58;
  else if (minutes <= 480) base = 42;
  else if (minutes <= 1440) base = 28;
  return { score: clamp(base + volumeBonus), seconds };
}

export function calculateScores(payload = {}) {
  const axisRaw = Object.fromEntries(AXES.map(a => [a, 0]));
  const axisMax = Object.fromEntries(AXES.map(a => [a, 1]));

  const psychology = payload.psychology || {};
  for (const q of PSYCHOLOGY_QUESTIONS) {
    const value = Number(psychology[q.id] ?? 0);
    axisRaw[q.axis] += value;
    axisMax[q.axis] += 4;
  }

  const trends = Array.isArray(payload.trends) ? payload.trends.filter(t => filled(t?.title)) : [];
  let trendQuality = 0;
  let promptQuality = 0;
  let productQuality = 0;
  let creativeQuality = 0;

  trends.forEach(t => {
    const fields = ['title', 'source', 'description', 'upload', 'output', 'clickability', 'audience'];
    const filledFields = fields.filter(f => filled(t?.[f])).length;
    trendQuality += Math.min(12, filledFields * 1.5 + scoreText(t?.whyNow, 3));
    promptQuality += Math.min(10, Array.isArray(t?.prompts) ? t.prompts.filter(filled).length * 3 : 0);
    productQuality += scoreText(t?.actionReason, 5) + scoreText(t?.clickability, 5);
    creativeQuality += scoreText(t?.description, 4) + scoreText(t?.output, 4);
  });

  axisRaw.trends += Math.min(48, trendQuality);
  axisMax.trends += 48;
  axisRaw.prompts += Math.min(18, promptQuality);
  axisMax.prompts += 18;
  axisRaw.product += Math.min(36, productQuality);
  axisMax.product += 36;
  axisRaw.creative += Math.min(30, creativeQuality);
  axisMax.creative += 30;

  const promptTest = payload.promptTest || payload.prompt_test || {};
  axisRaw.prompts += scoreText(promptTest.originalPrompt, 10) + scoreText(promptTest.improvedPrompt, 12) + scoreText(promptTest.whatChanged, 8) + scoreText(promptTest.testResult, 6);
  axisMax.prompts += 36;
  axisRaw.kaizen += scoreText(promptTest.whatChanged, 6) + scoreText(promptTest.finalVerdict, 6);
  axisMax.kaizen += 12;
  axisRaw.product += scoreText(promptTest.finalVerdict, 6);
  axisMax.product += 6;

  const trendCard = payload.trendCard || payload.trend_card || {};
  axisRaw.creative += scoreText(trendCard.title, 4) + scoreText(trendCard.subtitle, 4) + scoreText(trendCard.previewText, 6);
  axisMax.creative += 14;
  axisRaw.product += scoreText(trendCard.whatUpload, 5) + scoreText(trendCard.whatResult, 5) + scoreText(trendCard.actionHook, 8) + scoreText(trendCard.qualityCheck, 6);
  axisMax.product += 24;
  axisRaw.metrics += scoreText(trendCard.qualityCheck, 5);
  axisMax.metrics += 5;

  const packaging = payload.packaging || {};
  axisRaw.creative += scoreText(packaging.telegramPost, 12) + scoreText(packaging.botBroadcast, 8) + scoreText(packaging.promoTeaser, 10);
  axisMax.creative += 30;
  axisRaw.product += scoreText(packaging.cardTitles, 5) + scoreText(packaging.cta, 5);
  axisMax.product += 10;

  const kaizen = payload.kaizen || {};
  axisRaw.metrics += scoreText(kaizen.metrics, 12) + scoreText(kaizen.improve24h, 10) + scoreText(kaizen.bestGenerationChance, 6);
  axisMax.metrics += 28;
  axisRaw.kaizen += scoreText(kaizen.improve24h, 12) + scoreText(kaizen.selfGrowth, 8) + scoreText(kaizen.weakestTrend, 6);
  axisMax.kaizen += 26;
  axisRaw.product += scoreText(kaizen.firstLaunch, 8) + scoreText(kaizen.bestGenerationChance, 6);
  axisMax.product += 14;

  const speed = scoreSpeed(payload, trends.length);
  axisRaw.speed += speed.score;
  axisMax.speed += 100;

  axisRaw.autonomy += Math.min(26, trends.length * 4) + (filled(promptTest.finalVerdict) ? 6 : 0);
  axisMax.autonomy += 32;
  axisRaw.discipline += filled(payload.profile?.availableTime) ? 4 : 0;
  axisRaw.discipline += Math.min(16, Object.values(payload.timings?.stages || {}).filter(st => st?.completedAt).length * 2);
  axisMax.discipline += 20;
  axisRaw.resilience += scoreText(promptTest.whatChanged, 8) + scoreText(kaizen.improve24h, 6);
  axisMax.resilience += 14;

  const axes = {};
  AXES.forEach(axis => {
    axes[axis] = clamp(Math.round((axisRaw[axis] / axisMax[axis]) * 100));
  });

  const trendCountBonus = clamp(trends.length * 3, 0, 18);
  const average = Math.round(AXES.reduce((sum, axis) => sum + axes[axis], 0) / AXES.length);
  const total = clamp(Math.round(average * 0.84 + trendCountBonus));

  const role = pickRole(axes, total);
  const grade = pickGrade(total, axes, trends.length);
  const riskFlags = [];
  if (axes.discipline < 45) riskFlags.push('риск по дисциплине и закрытию этапов');
  if (axes.speed < 40) riskFlags.push('низкая скорость решения');
  if (axes.metrics < 40) riskFlags.push('слабое понимание клика, запуска генерации и улучшений');
  if (axes.prompts < 40) riskFlags.push('нужно обучать промтам');
  if (trends.length < 5) riskFlags.push('мало идей для оценки: нужно 5 трендов');
  if (total < 35) riskFlags.push('низкая готовность к роли');

  return {
    total,
    axes,
    grade,
    role,
    trendsCount: trends.length,
    durationSeconds: speed.seconds,
    riskFlags,
    summary: makeSummary(total, role, grade, axes, trends.length)
  };
}

function pickRole(axes, total) {
  if (total < 35) return 'Пока не брать / только стажировка';
  const trendPrompt = axes.trends + axes.prompts + axes.product + Math.round(axes.speed * 0.35);
  const contentCreative = axes.creative + axes.product + axes.metrics + Math.round(axes.kaizen * 0.25);
  if (trendPrompt - contentCreative > 18) return 'Trend & Prompt Operator';
  if (contentCreative - trendPrompt > 12) return 'Content & Creative Operator';
  if (axes.autonomy > 62 && axes.product > 58) return 'Mixed Junior / 2 недели тест в обеих ролях';
  return 'Junior: роль уточнить на 2-недельной адаптации';
}

function pickGrade(total, axes, trendsCount) {
  if (total < 35) return 'Not ready';
  if (total < 55) return 'Junior';
  if (total < 72) return 'Strong Junior';
  if (total < 86) return trendsCount >= 5 ? 'Middle trial' : 'Middle potential';
  return 'Middle+ potential';
}

function topAxes(axes) {
  return Object.entries(axes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([axis]) => AXIS_LABELS[axis]);
}

function makeSummary(total, role, grade, axes, trendsCount) {
  const tops = topAxes(axes).join(', ');
  const speedLine = axes.speed >= 70 ? 'скорость сильная' : axes.speed >= 45 ? 'скорость средняя' : 'скорость слабая';
  if (total < 35) return `Пока рано брать в работу. Проверять только через маленькое оплачиваемое задание. Сильнее всего проявлены: ${tops}. Идей добавлено: ${trendsCount}, ${speedLine}.`;
  if (total < 55) return `Можно рассматривать как Junior под контроль и обучение. Рекомендуемая роль: ${role}. Сильные стороны: ${tops}. Идей добавлено: ${trendsCount}, ${speedLine}.`;
  if (total < 72) return `Хороший кандидат на тестовый период. Роль: ${role}. Грейд: ${grade}. Сильные стороны: ${tops}. ${speedLine}.`;
  return `Сильный кандидат. Роль: ${role}. Грейд: ${grade}. Есть потенциал быстрее выйти за рамки Junior при корректном онбординге. ${speedLine}.`;
}
