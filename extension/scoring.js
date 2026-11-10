const positiveTerms = ['beats','beat','surge','surges','rally','raises','raised','upgrade','upgraded','growth','profit','profits','record','approval','approved','strong','bullish','buyback','dividend','outperform','deal','acquisition','expands','expansion','cuts costs','positive','partnership','wins','wins contract','rebound'];
const negativeTerms = ['misses','miss','plunge','plunges','crash','cuts forecast','cuts outlook','downgrade','downgraded','loss','losses','layoffs','lawsuit','investigation','recall','warning','weak','bearish','default','bankruptcy','fraud','decline','declines','falls','fell','below expectations','fine','penalty','sanctions','disappoints','disappointing'];
const marketTerms = ['stock','shares','market','investor','earnings','revenue','profit','guidance','forecast','federal reserve','fed','interest rate','inflation','jobs report','gdp','merger','acquisition','ipo','sec','nasdaq','s&p','dow','bond','treasury','oil','bank','company','ceo','quarter','dividend','analyst','regulator'];
const catalystTerms = ['earnings','revenue','guidance','forecast','federal reserve','interest rate','inflation','jobs report','gdp','merger','acquisition','ipo','approval','lawsuit','investigation','recall','bankruptcy','default','layoffs','buyback','dividend','contract','sanctions','regulator','sec','quarterly results','cuts outlook','raises outlook'];
const intensifierTerms = ['surprise','unexpected','record','重大','massive','halt','emergency','breaking','soars','plunges','slashed','all-time','historic','first time','billions','billion'];

function occurrences(text, terms) {
  return terms.reduce((n, term) => n + (text.includes(term) ? 1 : 0), 0);
}
function ageHours(item) {
  const raw = item.datetime ? Number(item.datetime) * 1000 : item.publishedAt ? Date.parse(item.publishedAt) : item.seendate ? Date.parse(item.seendate) : NaN;
  return Number.isFinite(raw) ? Math.max(0, (Date.now() - raw) / 3600000) : 24;
}
function scoreStory(item) {
  const title = String(item.headline || item.title || 'Untitled story').trim();
  const description = String(item.summary || item.description || '');
  const text = `${title}. ${description}`.toLowerCase();
  const pos = occurrences(text, positiveTerms);
  const neg = occurrences(text, negativeTerms);
  const rawSentiment = pos - neg;
  const sentiment = Math.round(100 * Math.tanh(rawSentiment * 0.6));
  const relevanceCount = occurrences(text, marketTerms);
  const catalystCount = occurrences(text, catalystTerms);
  const intensityCount = occurrences(text, intensifierTerms);
  const relevance = Math.min(1, 0.25 + relevanceCount * 0.12);
  const catalyst = Math.min(1, catalystCount * 0.28);
  const languageStrength = Math.min(1, (Math.abs(rawSentiment) * 0.22) + (intensityCount * 0.18) + (catalystCount * 0.13));
  const age = ageHours(item);
  const recency = Math.max(0, Math.exp(-age / 48));
  const impact = Math.round(100 * Math.min(1, (relevance * 0.34) + (catalyst * 0.30) + (languageStrength * 0.25) + (recency * 0.11)));
  const direction = sentiment >= 18 ? 'bullish' : sentiment <= -18 ? 'bearish' : 'neutral';
  return { ...item, headline: title, summary: description, sentiment, impact, direction, ageHours: age };
}
function formatAge(hours) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function safeHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'News source'; }
}
if (typeof module !== 'undefined') module.exports = { scoreStory, formatAge, safeHost };
