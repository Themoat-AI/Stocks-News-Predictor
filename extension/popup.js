const demo = [
 {headline:'Federal Reserve signals interest rates may stay higher for longer',summary:'Investors reassess rate expectations amid persistent inflation risks.',source:'Market Desk',datetime:Math.floor(Date.now()/1000)-1800,url:'https://www.federalreserve.gov/'},
 {headline:'Chipmaker raises full-year revenue forecast on strong AI demand',summary:'The company said its outlook exceeds analyst expectations.',source:'Market Desk',datetime:Math.floor(Date.now()/1000)-3600,url:'https://www.sec.gov/'},
 {headline:'Major retailer misses earnings estimates and cuts outlook',summary:'Weak consumer spending and higher costs pressured quarterly profits.',source:'Market Desk',datetime:Math.floor(Date.now()/1000)-7200,url:'https://www.sec.gov/'},
 {headline:'Regulator opens investigation into major bank lending practices',summary:'The review may lead to penalties and increased compliance costs.',source:'Market Desk',datetime:Math.floor(Date.now()/1000)-16000,url:'https://www.sec.gov/'},
 {headline:'Biotech firm wins approval for new treatment after trial success',summary:'The regulator approved the treatment, creating a potential growth opportunity.',source:'Market Desk',datetime:Math.floor(Date.now()/1000)-22000,url:'https://www.fda.gov/'}
];
const el = id => document.getElementById(id);
let currentToken = '';
async function getToken() { return new Promise(resolve => chrome.storage.local.get(['finnhubToken'], result => resolve(result.finnhubToken || ''))); }
async function saveToken(token) { return new Promise(resolve => chrome.storage.local.set({finnhubToken:token}, resolve)); }
function draw(items) {
 const scored = items.map(scoreStory).sort((a,b)=>b.impact-a.impact); el('count').textContent=scored.length; el('high').textContent=scored.filter(s=>s.impact>=65).length; el('top').textContent=scored.length?scored[0].impact:'—';
 const main=el('stories'); main.replaceChildren();
 for(const story of scored.slice(0,12)){
  const card=document.createElement('article');card.className='story';
  const score=document.createElement('div');score.className=`score ${story.direction}`;score.innerHTML=`${story.impact}<small>IMPACT</small>`;
  const body=document.createElement('div');const meta=document.createElement('div');meta.className='meta';
  const dir=document.createElement('span');dir.className='direction';dir.textContent=story.direction;
  const source=document.createElement('span');source.textContent=story.source||safeHost(story.url||'');
  const age=document.createElement('span');age.textContent=formatAge(story.ageHours);meta.append(dir,source,age);
  const title=document.createElement(story.url?'a':'div');title.className='title';title.textContent=story.headline;if(story.url){title.href=story.url;title.target='_blank';title.rel='noopener noreferrer';}
  body.append(meta,title);card.append(score,body);main.append(card);
 }
}
async function load(token) {
 el('status').textContent='Loading headlines…';
 try {
  const response=await fetch(`https://finnhub.io/api/v1/news?category=general&token=${encodeURIComponent(token)}`);
  if(!response.ok)throw new Error(response.status===401?'Token rejected.':'Feed unavailable.');
  const data=await response.json();if(!Array.isArray(data)||!data.length)throw new Error('No current headlines returned.');
  currentToken=token;await saveToken(token);draw(data);el('status').textContent='Finnhub · updated just now';
 } catch(error){el('status').textContent=error.message;}
}
el('save').addEventListener('click',()=>{const token=el('token').value.trim();if(token)load(token);});
el('refresh').addEventListener('click',()=>currentToken?load(currentToken):load(demo));
getToken().then(token=>{if(token){el('token').value=token;load(token);}else{draw(demo);el('status').textContent='Demo headlines · illustrative only';}});
