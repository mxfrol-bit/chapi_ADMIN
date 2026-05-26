import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { calculateScores } from '../shared/scoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const PORT = process.env.PORT || 3001;
const ADMIN_PIN = process.env.ADMIN_PIN || '';
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

let supabase = null;
if (supabaseUrl && serviceKey) {
  supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });
}

function requireSupabase(req, res, next) {
  if (!supabase) {
    return res.status(500).json({
      ok: false,
      error: 'Supabase не настроен. Укажи SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в Railway Variables.'
    });
  }
  next();
}

function requireAdmin(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.query.pin;
  if (!ADMIN_PIN) {
    return res.status(500).json({ ok: false, error: 'ADMIN_PIN не задан на сервере.' });
  }
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ ok: false, error: 'Неверный PIN админки.' });
  }
  next();
}

function normalizeSubmission(body = {}) {
  const profile = body.profile || {};
  const candidateName = String(profile.name || '').trim();
  if (!candidateName) throw new Error('Укажи имя кандидата.');

  const payload = {
    profile,
    psychology: body.psychology || {},
    cases: body.cases || {},
    trends: Array.isArray(body.trends) ? body.trends : [],
    topTrends: Array.isArray(body.topTrends) ? body.topTrends : [],
    packaging: body.packaging || {},
    kaizen: body.kaizen || {}
  };

  const scores = calculateScores(payload);

  return {
    candidate_name: candidateName,
    contact: profile.contact || null,
    telegram: profile.telegram || null,
    source: profile.source || null,
    profile,
    psychology: payload.psychology,
    cases: payload.cases,
    trends: payload.trends,
    top_trends: payload.topTrends,
    packaging: payload.packaging,
    kaizen: payload.kaizen,
    scores,
    recommendation: {
      role: scores.role,
      grade: scores.grade,
      summary: scores.summary,
      riskFlags: scores.riskFlags
    },
    status: 'submitted',
    updated_at: new Date().toISOString()
  };
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    app: 'Chappy Candidate Lab',
    supabase: Boolean(supabase),
    time: new Date().toISOString()
  });
});

app.post('/api/submissions', requireSupabase, async (req, res) => {
  try {
    const row = normalizeSubmission(req.body);
    const { data, error } = await supabase
      .from('chappy_candidate_tests')
      .insert(row)
      .select('id, created_at, scores, recommendation')
      .single();

    if (error) throw error;
    return res.json({ ok: true, data });
  } catch (error) {
    return res.status(400).json({ ok: false, error: error.message || 'Ошибка отправки теста.' });
  }
});

app.get('/api/admin/submissions', requireSupabase, requireAdmin, async (req, res) => {
  const { status, q } = req.query;
  let query = supabase
    .from('chappy_candidate_tests')
    .select('id, created_at, updated_at, candidate_name, contact, telegram, source, status, profile, trends, top_trends, packaging, kaizen, scores, recommendation, notes')
    .order('created_at', { ascending: false })
    .limit(500);

  if (status && status !== 'all') query = query.eq('status', status);
  if (q) query = query.ilike('candidate_name', `%${q}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, data });
});

app.get('/api/admin/submissions/:id', requireSupabase, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('chappy_candidate_tests')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ ok: false, error: error.message });
  res.json({ ok: true, data });
});

app.patch('/api/admin/submissions/:id', requireSupabase, requireAdmin, async (req, res) => {
  const patch = {};
  if (typeof req.body.status === 'string') patch.status = req.body.status;
  if (typeof req.body.notes === 'string') patch.notes = req.body.notes;
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('chappy_candidate_tests')
    .update(patch)
    .eq('id', req.params.id)
    .select('id, status, notes, updated_at')
    .single();
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, data });
});

app.use(express.static(distDir));
app.use((req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Chappy Candidate Lab running on port ${PORT}`);
});
