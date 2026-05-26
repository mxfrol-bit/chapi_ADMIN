export const AXES = [
  'trends',
  'prompts',
  'creative',
  'metrics',
  'discipline',
  'autonomy',
  'kaizen',
  'resilience',
  'product'
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
  product: 'Продуктовое мышление'
};

export const PSYCHOLOGY_QUESTIONS = [
  { id: 'q1', axis: 'trends', text: 'Я быстро замечаю повторяющиеся форматы в Reels/TikTok/Telegram и понимаю, почему их повторяют.' },
  { id: 'q2', axis: 'product', text: 'Когда вижу красивую идею, сразу думаю: “а что должен сделать пользователь, чтобы за это заплатить?”' },
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
  { id: 'q13', axis: 'metrics', text: 'Я понимаю, что CTR, запуск генерации, оплата и повторная генерация — это разные этапы воронки.' },
  { id: 'q14', axis: 'discipline', text: 'Я нормально отношусь к таблицам, чек-листам, статусам и ежедневному короткому отчёту.' },
  { id: 'q15', axis: 'product', text: 'Я могу объяснить ценность тренда простыми словами за 1–2 предложения.' },
  { id: 'q16', axis: 'resilience', text: 'В стрессовой задаче я сначала разбиваю её на шаги, а не паникую.' },
  { id: 'q17', axis: 'kaizen', text: 'Мне интересно не просто сделать, а построить систему, которая завтра будет работать быстрее.' },
  { id: 'q18', axis: 'autonomy', text: 'Если данных мало, я могу сделать разумную гипотезу и честно указать, что нужно проверить.' },
  { id: 'q19', axis: 'trends', text: 'Я регулярно сохраняю удачные референсы, тренды, промты, визуальные идеи.' },
  { id: 'q20', axis: 'product', text: 'Для меня хороший контент — тот, который двигает пользователя к действию.' }
];

export const CASES = [
  { id: 'c1', axis: 'product', title: 'Красиво, но не покупают', text: 'Тренд выглядит вау, но по нему мало запусков. Что проверишь и что поменяешь?' },
  { id: 'c2', axis: 'prompts', title: 'Промт даёт мусор', text: 'Идея сильная, но генерация нестабильная: то портит лицо, то уходит не в тот стиль. Что сделаешь?' },
  { id: 'c3', axis: 'metrics', title: 'Много кликов, мало оплат', text: 'Карточку открывают, генерацию запускают, но кредиты не покупают. Какие гипотезы?' },
  { id: 'c4', axis: 'creative', title: 'Блогеру надо объяснить за 15 секунд', text: 'Как бы ты упакoвала тренд для сторис блогера, чтобы аудитория захотела повторить?' },
  { id: 'c5', axis: 'discipline', title: 'Дедлайн завтра', text: 'Нужно сдать 10 трендов за день. Как расставишь приоритеты и что точно не будешь делать?' },
  { id: 'c6', axis: 'trends', title: 'Найти ранний сигнал', text: 'Где будешь искать тренды до того, как они станут заезженными?' },
  { id: 'c7', axis: 'kaizen', title: 'Улучшение через 24 часа', text: 'Запустили тренд. Какие 3 правки сделаешь после первых цифр?' },
  { id: 'c8', axis: 'resilience', title: 'Жёсткая правка', text: 'Руководитель сказал: “не то, переделать”. Как поймёшь, что именно не то?' },
  { id: 'c9', axis: 'autonomy', title: 'Нет ТЗ', text: 'Тебе сказали: “найди что-то для девушек 18–30, чтобы захотели загрузить фото”. Что делаешь первые 60 минут?' },
  { id: 'c10', axis: 'product', title: 'Выбор первого запуска', text: 'Есть 3 тренда: красивый, смешной и полезный. Как выберешь первый для запуска?' }
];

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

export function calculateScores(payload = {}) {
  const axisRaw = Object.fromEntries(AXES.map(a => [a, 0]));
  const axisMax = Object.fromEntries(AXES.map(a => [a, 1]));

  const psychology = payload.psychology || {};
  for (const q of PSYCHOLOGY_QUESTIONS) {
    const value = Number(psychology[q.id] ?? 0);
    axisRaw[q.axis] += value;
    axisMax[q.axis] += 4;
  }

  const cases = payload.cases || {};
  for (const c of CASES) {
    const s = scoreText(cases[c.id], 8);
    axisRaw[c.axis] += s;
    axisMax[c.axis] += 8;
  }

  const trends = Array.isArray(payload.trends) ? payload.trends : [];
  let trendQuality = 0;
  let promptQuality = 0;
  let productQuality = 0;
  let creativeQuality = 0;
  let metricsQuality = 0;

  trends.forEach(t => {
    const fields = ['title', 'source', 'description', 'upload', 'output', 'clickability', 'audience'];
    const filledFields = fields.filter(f => filled(t?.[f])).length;
    trendQuality += Math.min(12, filledFields * 1.5 + scoreText(t?.whyNow, 3));
    promptQuality += Math.min(10, Array.isArray(t?.prompts) ? t.prompts.filter(filled).length * 3 : 0);
    productQuality += scoreText(t?.monetization, 5) + scoreText(t?.clickability, 5);
    creativeQuality += scoreText(t?.description, 4) + scoreText(t?.output, 4);
  });

  axisRaw.trends += Math.min(45, trendQuality);
  axisMax.trends += 45;
  axisRaw.prompts += Math.min(40, promptQuality);
  axisMax.prompts += 40;
  axisRaw.product += Math.min(35, productQuality);
  axisMax.product += 35;
  axisRaw.creative += Math.min(35, creativeQuality);
  axisMax.creative += 35;

  const packaging = payload.packaging || {};
  axisRaw.creative += scoreText(packaging.telegramPost, 12) + scoreText(packaging.botBroadcast, 8) + scoreText(packaging.bloggerStories, 10);
  axisMax.creative += 30;
  axisRaw.product += scoreText(packaging.cardTitles, 5) + scoreText(packaging.cta, 5);
  axisMax.product += 10;
  axisRaw.metrics += scoreText(payload.kaizen?.metrics, 12) + scoreText(payload.kaizen?.improve24h, 10);
  axisMax.metrics += 22;
  axisRaw.kaizen += scoreText(payload.kaizen?.improve24h, 12) + scoreText(payload.kaizen?.selfGrowth, 8);
  axisMax.kaizen += 20;
  axisRaw.autonomy += Math.min(18, trends.length * 3);
  axisMax.autonomy += 18;
  axisRaw.discipline += filled(payload.profile?.availableTime) ? 4 : 0;
  axisMax.discipline += 4;

  const axes = {};
  AXES.forEach(axis => {
    axes[axis] = clamp(Math.round((axisRaw[axis] / axisMax[axis]) * 100));
  });

  const trendCountBonus = clamp(trends.length * 4, 0, 20);
  const average = Math.round(AXES.reduce((sum, axis) => sum + axes[axis], 0) / AXES.length);
  const total = clamp(Math.round(average * 0.82 + trendCountBonus));

  const role = pickRole(axes, total);
  const grade = pickGrade(total, axes, trends.length);
  const riskFlags = [];
  if (axes.discipline < 45) riskFlags.push('риск по дисциплине и отчётности');
  if (axes.metrics < 40) riskFlags.push('слабая работа с метриками');
  if (axes.prompts < 40) riskFlags.push('нужно обучать промтам');
  if (trends.length < 3) riskFlags.push('мало трендов для оценки');
  if (total < 35) riskFlags.push('низкая готовность к роли');

  return {
    total,
    axes,
    grade,
    role,
    trendsCount: trends.length,
    riskFlags,
    summary: makeSummary(total, role, grade, axes, trends.length)
  };
}

function pickRole(axes, total) {
  if (total < 35) return 'Пока не брать / только стажировка';
  const trendPrompt = axes.trends + axes.prompts + axes.product;
  const contentCreative = axes.creative + axes.product + axes.metrics;
  if (trendPrompt - contentCreative > 18) return 'Trend & Prompt Operator';
  if (contentCreative - trendPrompt > 12) return 'Content & Creative Operator';
  if (axes.autonomy > 62 && axes.product > 58) return 'Universal Content Operator';
  return 'Junior Content Operator';
}

function pickGrade(total, axes, trendsCount) {
  if (total < 35) return 'Not ready';
  if (total < 55) return 'Junior';
  if (total < 72) return 'Strong Junior / Middle trial';
  if (total < 86) return trendsCount >= 5 ? 'Middle' : 'Middle potential';
  return 'Senior potential';
}

function topAxes(axes) {
  return Object.entries(axes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([axis]) => AXIS_LABELS[axis]);
}

function makeSummary(total, role, grade, axes, trendsCount) {
  const tops = topAxes(axes).join(', ');
  if (total < 35) return `Пока рано брать в работу. Потенциал нужно проверять через маленькое оплачиваемое задание. Сильнее всего проявлены: ${tops}. Трендов добавлено: ${trendsCount}.`;
  if (total < 55) return `Можно рассматривать как Junior под контроль и обучение. Рекомендуемая роль: ${role}. Сильные стороны: ${tops}. Трендов добавлено: ${trendsCount}.`;
  if (total < 72) return `Хороший кандидат на тестовый период. Роль: ${role}. Грейд: ${grade}. Сильные стороны: ${tops}.`;
  return `Сильный кандидат. Роль: ${role}. Грейд: ${grade}. Есть потенциал вести блок самостоятельно при корректной постановке KPI.`;
}
