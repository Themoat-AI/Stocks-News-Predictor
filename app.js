const demoStories = [
  { headline: 'Federal Reserve signals interest rates may stay higher for longer', summary: 'Investors reassess rate expectations after policymakers emphasize persistent inflation risks.', source: 'Market Desk', datetime: Math.floor(Date.now()/1000) - 1800, url: 'https://www.federalreserve.gov/' },
  { headline: 'Chipmaker raises full-year revenue forecast on strong AI demand', summary: 'The company reported broad customer growth and said its next-quarter outlook exceeds analyst expectations.', source: 'Market Desk', datetime: Math.floor(Date.now()/1000) - 3600, url: 'https://www.sec.gov/' },
  { headline: 'Major retailer misses earnings estimates and cuts outlook', summary: 'Weak consumer spending and higher costs pressured quarterly profits; shares fell in after-hours trading.', source: 'Market Desk', datetime: Math.floor(Date.now()/1000) - 7200, url: 'https://www.sec.gov/' },
  { headline: 'Oil prices rise as supply disruption concerns return', summary: 'Energy markets weigh new supply risks alongside the latest global demand forecasts.', source: 'Market Desk', datetime: Math.floor(Date.now()/1000) - 10800, url: 'https://www.eia.gov/' },
  { headline: 'Regulator opens investigation into major bank lending practices', summary: 'The review may lead to penalties and increased compliance costs, the bank disclosed.', source: 'Market Desk', datetime: Math.floor(Date.now()/1000) - 16000, url: 'https://www.sec.gov/' },
  { headline: 'Biotech firm wins approval for new treatment after clinical trial success', summary: 'The regulator approved the therapy, creating a potential new growth opportunity for the company.', source: 'Market Desk', datetime: Math.floor(Date.now()/1000) - 22000, url: 'https://www.fda.gov/' },
  { headline: 'U.S. jobs report shows steady hiring and moderate wage growth', summary: 'The latest economic data may influence investor expectations for the Federal Reserve.', source: 'Market Desk', datetime: Math.floor(Date.now()/1000) - 30000, url: 'https://www.bls.gov/' },
  { headline: 'Automaker announces large-scale layoffs amid declining demand', summary: 'The company said it will cut costs after weaker sales and a revised production forecast.', source: 'Market Desk', datetime: Math.floor(Date.now()/1000) - 40000, url: 'https://www.sec.gov/' }
];
const $ = (id) => document.getElementById(id);
let stories = [];
function render() {
  const filter = $('direction-filter').value;
  const sort = $('sort-select').value;
  const sorted = stories.filter(s => filter === 'all' || s.direction === filter);
  sorted.sort((a,b) => sort === 'recent' ? a.ageHours - b.ageHours : b.impact - a.impact);
  $('story-count').textContent = stories.length;
  $('high-count').textContent = stories.filter(s => s.impact >= 65).length;
  $('bull-count').textContent = stories.filter(s => s.direction === 'bullish').length;
  $('bear-count').textContent = stories.filter(s => s.direction === 'bearish').length;
  const top = [...stories].sort((a,b) => b.impact-a.impact)[0];
  $('hero-score').textContent = top ? top.impact : '—';
  $('hero-direction').textContent = top ? `${top.direction} · ${top.headline}` : 'Waiting for stories';
  $('hero-meter').style.width = `${top ? top.impact : 0}%`;
  $('hero-meter').className = top ? top.direction : '';
  const list = $('story-list'); list.replaceChildren();
  $('empty-state').hidden = sorted.length > 0;
  for (const story of sorted) {
    const card = document.createElement('article'); card.className = 'story-card';
    const score = document.createElement('div'); score.className = `story-score ${story.direction}`;
    score.innerHTML = `<span class="score-num">${story.impact}</span><span class="score-unit">IMPACT</span>`;
    const body = document.createElement('div'); body.className = 'story-body';
    const meta = document.createElement('div'); meta.className = 'story-meta';
    const badge = document.createElement('span'); badge.className = `direction-badge ${story.direction}`; badge.textContent = story.direction;
    const source = document.createElement('span'); source.textContent = story.source || safeHost(story.url || '');
    const age = document.createElement('span'); age.textContent = formatAge(story.ageHours);
    meta.append(badge, source, age);
    const title = document.createElement(story.url ? 'a' : 'h3'); title.className = 'story-title'; title.textContent = story.headline;
    if (story.url) { title.href = story.url; title.target = '_blank'; title.rel = 'noopener noreferrer'; }
    const summary = document.createElement('p'); summary.className = 'story-summary'; summary.textContent = story.summary || 'No story summary provided.';
    const foot = document.createElement('div'); foot.className = 'story-foot';
    const directionText = document.createElement('span'); directionText.textContent = `Direction score: ${story.sentiment > 0 ? '+' : ''}${story.sentiment}`;
    const mini = document.createElement('span'); mini.className = 'mini-meter'; mini.innerHTML = `<i style="width:${story.impact}%"></i>`;
    foot.append(directionText, mini); body.append(meta, title, summary, foot); card.append(score,body); list.append(card);
  }
}
async function loadFeed(token) {
  $('status').textContent = 'Loading headlines…';
  try {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${encodeURIComponent(token)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(response.status === 401 ? 'Token rejected. Check your Finnhub API token.' : `News feed returned ${response.status}.`);
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('No headlines returned. Try again later or use demo mode.');
    stories = data.map(scoreStory); $('status').textContent = 'Finnhub · updated just now'; $('feed-mode').textContent = 'LIVE FEED';
    localStorage.setItem('marketSignalToken', token); render();
  } catch (error) { $('status').textContent = error.message || 'Could not load news.'; }
}
function useDemo() { stories = demoStories.map(scoreStory); $('status').textContent = 'Demo headlines · illustrative only'; $('feed-mode').textContent = 'DEMO MODE'; render(); }
$('token-form').addEventListener('submit', event => { event.preventDefault(); const token = $('api-token').value.trim(); if (token) loadFeed(token); });
$('demo-button').addEventListener('click', useDemo);
$('refresh-button').addEventListener('click', () => { const token = localStorage.getItem('marketSignalToken'); token ? loadFeed(token) : useDemo(); });
$('direction-filter').addEventListener('change', render); $('sort-select').addEventListener('change', render);
const saved = localStorage.getItem('marketSignalToken'); if (saved) { $('api-token').value = saved; loadFeed(saved); } else useDemo();
