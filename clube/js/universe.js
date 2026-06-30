const UNIVERSE_PLANETS = [
  { key: 'ENERGETICOS', title: 'Energia', emoji: '⚡', color: '#f59e0b' },
  { key: 'CERVEJAS', title: 'Cervejas', emoji: '🍺', color: '#22c55e' },
  { key: 'REFRIGERANTES', title: 'Refri', emoji: '🥤', color: '#38bdf8' },
  { key: 'SALGADINHOS', title: 'Snacks', emoji: '🥜', color: '#fb923c' },
  { key: 'DRINKS', title: 'Drinks', emoji: '🍹', color: '#ec4899' },
  { key: 'DESTILADOS', title: 'Destilados', emoji: '🥃', color: '#a855f7' },
  { key: 'SUCOS', title: 'Sucos', emoji: '🍊', color: '#f97316' },
  { key: 'DOCES', title: 'Doces', emoji: '🍬', color: '#f472b6' },
  { key: 'MERCEARIA', title: 'Mercearia', emoji: '🛒', color: '#14b8a6' },
  { key: 'CARVAO', title: 'Carvão', emoji: '🔥', color: '#ef4444' },
  { key: 'GELOS', title: 'Gelos', emoji: '🧊', color: '#60a5fa' },
  { key: 'RECOMPENSAS', title: 'Base Bebcom', emoji: '🏢', color: '#dc2626' }
];

let universeState = {
  expeditions: [],
  progress: [],
  redeems: [],
  selectedExpeditionId: null,
  selectedPlanetKey: 'TODOS',
  lastPercent: 0,
  activePlanetIndex: 0
};

function normalizeUniverseKey(value = '') {
  return String(value)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function findPlanet(key) {
  return UNIVERSE_PLANETS.find(p => p.key === key) || UNIVERSE_PLANETS[0];
}

function getPlanetForExpedition(expedition) {
  const key = normalizeUniverseKey(expedition?.planetKey || expedition?.planet || expedition?.categoryKey || expedition?.category || expedition?.title || '');
  if (key.includes('ENERGET')) return findPlanet('ENERGETICOS');
  if (key.includes('CERVE') || key.includes('BEER')) return findPlanet('CERVEJAS');
  if (key.includes('REFRI') || key.includes('COCA') || key.includes('GUARANA')) return findPlanet('REFRIGERANTES');
  if (key.includes('SALGAD') || key.includes('SNACK') || key.includes('AMENDO')) return findPlanet('SALGADINHOS');
  if (key.includes('DRINK') || key.includes('COPAO') || key.includes('GIN')) return findPlanet('DRINKS');
  if (key.includes('DESTIL') || key.includes('WHISKY') || key.includes('VODKA')) return findPlanet('DESTILADOS');
  if (key.includes('SUCO')) return findPlanet('SUCOS');
  if (key.includes('DOCE') || key.includes('CHOCOL')) return findPlanet('DOCES');
  if (key.includes('MERCE')) return findPlanet('MERCEARIA');
  if (key.includes('CARVA')) return findPlanet('CARVAO');
  if (key.includes('GELO')) return findPlanet('GELOS');
  return findPlanet('MERCEARIA');
}

async function loadUniverse() {
  if (!currentUser?.phone) return;
  try {
    const response = await fetch(`${API_BASE}/api/clube/expedicoes/${currentUser.phone}`);
    const data = await response.json();
    if (!data.success) return renderUniverseEmpty('Ainda não foi possível carregar as campanhas.');
    universeState.expeditions = data.expeditions || [];
    universeState.progress = data.progress || [];
    universeState.redeems = data.redeems || [];
    const selectedStillExists = universeState.expeditions.some(exp => String(exp._id) === String(universeState.selectedExpeditionId));
    if (!selectedStillExists) universeState.selectedExpeditionId = chooseBestCampaign()?._id || null;
    renderUniverse();
  } catch (error) {
    console.error('Erro ao carregar Universo Bebcom:', error);
    renderUniverseEmpty('Falha ao conectar ao Universo Bebcom.');
  }
}

function renderUniverseEmpty(message) {
  const box = document.getElementById('universeCard');
  if (!box) return;
  box.innerHTML = `<div class="universe-clean-header"><div class="universe-clean-kicker">🌌 Clube Bebcom</div><h3>Universo Bebcom</h3><p>Suas campanhas aparecerão aqui.</p></div><div class="universe-empty">${message}</div>`;
}

function renderUniverse() {
  const box = document.getElementById('universeCard');
  if (!box) return;
  if (!universeState.expeditions.length) return renderUniverseEmpty('Nenhuma campanha ativa no momento. Em breve novas rotas serão liberadas.');

  const selectedExpedition = getSelectedExpedition();
  const selectedProgress = findProgressForExpedition(selectedExpedition);
  const percent = calculateExpeditionPercent(selectedExpedition, selectedProgress);
  universeState.lastPercent = percent;
  const planet = getPlanetForExpedition(selectedExpedition);
  universeState.activePlanetIndex = UNIVERSE_PLANETS.findIndex(p => p.key === planet.key);

  box.innerHTML = `
    <div class="universe-clean-shell">
      <div class="universe-stars"></div>
      <div class="universe-nebula"></div>
      <div class="universe-clean-header"><div class="universe-clean-kicker">🌌 Central de campanhas</div><h3>Universo Bebcom</h3><p>Escolha uma categoria, acompanhe campanhas e veja exatamente o que falta comprar.</p></div>
      ${renderUniverseHud()}
      ${renderFeaturedCampaign(selectedExpedition, selectedProgress, percent)}
      ${renderPlanetMap()}
      ${renderFilteredCampaigns()}
      <div id="universeToast" class="universe-toast"></div>
    </div>`;
}

function renderUniverseHud() {
  const savedAvatar = getSavedAvatar?.();
  const avatarName = savedAvatar?.name || currentUser?.name || 'Explorador Bebcom';
  const avatarRole = savedAvatar?.role || savedAvatar?.title || 'Explorador do Universo';
  const xp = Number(currentUser?.xp || 0);
  const level = Number(currentUser?.level || 1);
  const rank = currentUser?.rank || 'Explorador';
  const scans = currentUser?.stats?.scans || 0;
  const rewards = currentUser?.stats?.rewardsUnlocked || 0;
  const activeCampaigns = universeState.expeditions.filter(exp => !findProgressForExpedition(exp)?.completed).length;
  return `<div class="universe-hud clean-hud"><div class="universe-hud-avatar">${getUniverseAvatarEmoji()}</div><div class="universe-hud-main"><strong>${avatarName}</strong><span>${avatarRole} • ${rank}</span></div><div class="universe-hud-stats"><div class="universe-hud-pill">⭐ Nível ${level}</div><div class="universe-hud-pill">⚡ ${xp} XP</div><div class="universe-hud-pill">🎯 ${activeCampaigns} campanhas</div><div class="universe-hud-pill">📷 ${scans}</div><div class="universe-hud-pill">🎁 ${rewards}</div></div></div>`;
}

function renderFeaturedCampaign(expedition, progress, percent) {
  const planet = getPlanetForExpedition(expedition);
  const color = expedition.color || planet.color;
  const completed = percent >= 100;
  const nextText = getNextProductText(expedition, progress);
  const rewardTitle = expedition?.reward?.title || 'Recompensa Bebcom';
  const remaining = getCampaignTimeLabel(expedition);
  return `<section class="featured-campaign" style="--campaign-color:${color}; --campaign-color-soft:${hexToRgba(color, .20)}"><div class="featured-orbit"><div id="universeShip" class="featured-avatar ${completed ? 'landed' : ''}"><span>${completed ? '🏢' : getUniverseAvatarEmoji()}</span></div><div id="universeArrival" class="universe-arrival"></div></div><div class="featured-content"><div class="featured-topline"><span>${planet.emoji} ${planet.title}</span><span>${formatRarity(expedition.rarity)}</span></div><h4>${expedition.title}</h4><p>${expedition.description || 'Campanha ativa no Clube Bebcom.'}</p><div class="featured-progress-row"><strong>${percent}%</strong><div class="universe-progress-track"><div class="universe-progress-fill" style="width:${percent}%"></div></div></div><div class="featured-next ${completed ? 'completed' : ''}"><div><small>${completed ? 'Status da campanha' : 'Próximo produto'}</small><strong>${completed ? 'Concluída — vá até a Base Bebcom' : nextText.replace('próximo produto: ', '')}</strong></div></div><div class="featured-reward"><span>🎁 Recompensa</span><strong>${rewardTitle}</strong></div><div class="featured-meta"><span>🏢 ${expedition.sponsor || 'Bebcom'}</span><span>${remaining}</span></div></div></section>`;
}

function renderPlanetMap() {
  const allSelected = universeState.selectedPlanetKey === 'TODOS';
  return `<section class="planet-filter-panel"><div class="section-title-row"><div><strong>🪐 Categorias</strong><span>Toque para filtrar campanhas</span></div><button class="planet-filter-chip ${allSelected ? 'active' : ''}" onclick="selectUniversePlanet('TODOS')">Todas</button></div><div class="planet-clean-grid">${UNIVERSE_PLANETS.filter(p => p.key !== 'RECOMPENSAS').map(planet => renderPlanetChip(planet)).join('')}</div></section>`;
}

function renderPlanetChip(planet) {
  const campaigns = getCampaignsByPlanet(planet.key);
  const selected = universeState.selectedPlanetKey === planet.key;
  const completed = campaigns.filter(exp => calculateExpeditionPercent(exp, findProgressForExpedition(exp)) >= 100).length;
  const almost = campaigns.filter(exp => { const percent = calculateExpeditionPercent(exp, findProgressForExpedition(exp)); return percent >= 60 && percent < 100; }).length;
  return `<button class="planet-clean-chip ${selected ? 'active' : ''}" style="--planet-color:${planet.color}" onclick="selectUniversePlanet('${planet.key}')"><span class="planet-clean-emoji">${planet.emoji}</span><span class="planet-clean-name">${planet.title}</span><span class="planet-clean-count">${campaigns.length || 0}</span>${almost ? `<small>${almost} quase lá</small>` : completed ? `<small>${completed} concluída</small>` : `<small>${campaigns.length ? 'campanhas' : 'sem rota'}</small>`}</button>`;
}

function renderFilteredCampaigns() {
  const campaigns = getFilteredCampaigns();
  const title = universeState.selectedPlanetKey === 'TODOS' ? 'Campanhas disponíveis' : `${findPlanet(universeState.selectedPlanetKey).emoji} ${findPlanet(universeState.selectedPlanetKey).title}`;
  return `<section class="campaigns-panel clean-campaigns"><div class="campaigns-panel-title"><strong>🎯 ${title}</strong><span>${campaigns.length} campanha(s)</span></div>${campaigns.length ? `<div class="campaigns-grid">${campaigns.map(exp => renderCampaignCard(exp)).join('')}</div>` : `<div class="campaign-empty-note">Nenhuma campanha ativa nessa categoria agora.</div>`}</section>`;
}

function renderCampaignCard(expedition) {
  const planet = getPlanetForExpedition(expedition);
  const progress = findProgressForExpedition(expedition);
  const percent = calculateExpeditionPercent(expedition, progress);
  const selected = String(expedition._id) === String(universeState.selectedExpeditionId);
  const completed = percent >= 100;
  const nextText = getNextProductText(expedition, progress).replace('próximo produto: ', '');
  const color = expedition.color || planet.color;
  const rewardTitle = expedition?.reward?.title || 'Recompensa Bebcom';
  return `<article class="campaign-card clean-card ${selected ? 'selected' : ''} ${completed ? 'completed' : ''}" style="--campaign-color:${color}; --campaign-color-soft:${hexToRgba(color, .22)}" onclick="selectUniverseCampaign('${expedition._id}')"><div class="campaign-card-top"><div class="campaign-icon">${completed ? '🏢' : planet.emoji}</div><div class="campaign-main"><strong>${expedition.title}</strong><div class="campaign-meta"><span class="campaign-pill">${formatRarity(expedition.rarity)}</span><span class="campaign-pill">${planet.title}</span><span class="campaign-pill">${getCampaignTimeLabel(expedition)}</span></div></div></div><div class="campaign-progress"><div class="campaign-progress-track"><div class="campaign-progress-fill" style="width:${percent}%"></div></div><div class="campaign-progress-text">${percent}% • ${completed ? 'Concluída' : nextText}</div></div><div class="campaign-card-reward"><span>🎁 ${rewardTitle}</span></div></article>`;
}

function selectUniversePlanet(planetKey) {
  universeState.selectedPlanetKey = planetKey;
  const campaigns = getFilteredCampaigns();
  if (campaigns.length) {
    const selectedInFilter = campaigns.some(exp => String(exp._id) === String(universeState.selectedExpeditionId));
    if (!selectedInFilter) universeState.selectedExpeditionId = chooseBestCampaign(campaigns)?._id || campaigns[0]._id;
  }
  renderUniverse();
}

function selectUniverseCampaign(expeditionId) {
  universeState.selectedExpeditionId = expeditionId;
  const exp = universeState.expeditions.find(item => String(item._id) === String(expeditionId));
  if (exp) universeState.selectedPlanetKey = getPlanetForExpedition(exp).key;
  renderUniverse();
}

function getCampaignsByPlanet(planetKey) { return universeState.expeditions.filter(exp => getPlanetForExpedition(exp).key === planetKey); }
function getFilteredCampaigns() { return universeState.selectedPlanetKey === 'TODOS' ? sortCampaigns(universeState.expeditions) : sortCampaigns(getCampaignsByPlanet(universeState.selectedPlanetKey)); }
function sortCampaigns(campaigns = []) { return [...campaigns].sort((a,b)=>{ const pa=calculateExpeditionPercent(a,findProgressForExpedition(a)); const pb=calculateExpeditionPercent(b,findProgressForExpedition(b)); if(pa===100&&pb!==100)return 1; if(pb===100&&pa!==100)return -1; return pb-pa; }); }
function chooseBestCampaign(campaigns = universeState.expeditions) { const sorted = sortCampaigns(campaigns); return sorted.find(exp => calculateExpeditionPercent(exp, findProgressForExpedition(exp)) < 100) || sorted[0]; }
function getSelectedExpedition() { return universeState.expeditions.find(exp => String(exp._id) === String(universeState.selectedExpeditionId)) || chooseBestCampaign(); }
function chooseCurrentExpedition() { return chooseBestCampaign(); }
function findProgressForExpedition(expedition) { if (!expedition?._id) return null; return universeState.progress.find(item => String(item.expeditionId || '') === String(expedition._id || '')); }
function calculateExpeditionPercent(expedition, progress) { const total = Array.isArray(expedition?.steps) ? expedition.steps.length : 0; if (!total) return 0; const completed = Array.isArray(progress?.completedSteps) ? progress.completedSteps.length : 0; return Math.min(100, Math.round((completed / total) * 100)); }
function getNextProductText(expedition, progress) { const steps = Array.isArray(expedition?.steps) ? expedition.steps : []; const completed = new Set(progress?.completedSteps || []); const nextStep = steps.find(step => !completed.has(step.index)); if (!nextStep) return expedition?.completionMessage || 'Expedição concluída. Retire sua recompensa na Base Bebcom.'; return `próximo produto: ${nextStep.title}`; }
function getCampaignTimeLabel(expedition) { if (expedition?.permanent || !expedition?.endsAt) return '♾️ permanente'; const end = new Date(expedition.endsAt); const diff = end.getTime() - Date.now(); if (Number.isNaN(end.getTime())) return '⏳ ativa'; if (diff <= 0) return '⏳ encerrando'; const days = Math.ceil(diff / (1000*60*60*24)); if (days <= 1) return '🔥 termina hoje'; if (days <= 3) return `⏳ ${days} dias`; return `📅 ${end.toLocaleDateString('pt-BR')}`; }
function getUniverseAvatarEmoji() { const saved = getSavedAvatar?.(); return saved?.emoji || '🧑‍🚀'; }
function animateUniverseAdvance(scanData = {}) { showUniverseToast(scanData); const featured=document.querySelector('.featured-campaign'); const avatar=document.getElementById('universeShip'); if(featured){featured.classList.add('scan-pulse'); setTimeout(()=>featured.classList.remove('scan-pulse'),1400);} if(avatar){avatar.classList.add('moving'); setTimeout(()=>avatar.classList.remove('moving'),1200);} setTimeout(()=>triggerArrivalEffect(),900); if(scanData?.reward) setTimeout(()=>showUniverseReward(scanData.reward),1500); }
function triggerArrivalEffect() { const arrival=document.getElementById('universeArrival'); if(!arrival)return; arrival.classList.remove('active'); void arrival.offsetWidth; arrival.classList.add('active'); }
function showUniverseToast(scanData = {}) { const toast=document.getElementById('universeToast'); if(!toast)return; const product=scanData.product||'Produto encontrado'; const xp=scanData.xpGained?`+${scanData.xpGained} XP`:'Campanha atualizada'; const campaigns=Array.isArray(scanData.expeditionResults)?scanData.expeditionResults.filter(item=>['advanced','completed'].includes(item.status)).length:0; toast.innerHTML=`<strong>🚀 ${product}</strong><span>${xp} • ${campaigns ? `Avançou em ${campaigns} campanha(s).` : (scanData.message || 'Universo atualizado.')}</span>`; toast.classList.add('active'); setTimeout(()=>toast.classList.remove('active'),3600); }
function showUniverseReward(reward) { const overlay=document.getElementById('universeRewardOverlay'); if(!overlay)return; overlay.innerHTML=`<div class="reward-cinematic-box"><div class="reward-icon">🎁</div><h2>Missão concluída</h2><p><strong>${reward.title || 'Recompensa Bebcom'}</strong></p><p>${reward.description || 'Sua recompensa está pronta para retirada na Bebidas & Companhia.'}</p><div class="reward-location">🏢 Base Bebcom • Retirada na loja física</div><button class="btn-primary" onclick="closeUniverseReward()">Continuar Jornada</button></div>`; overlay.classList.add('active'); }
function closeUniverseReward() { document.getElementById('universeRewardOverlay')?.classList.remove('active'); }
function formatRarity(rarity='comum') { const value=normalizeUniverseKey(rarity); if(value.includes('LENDAR'))return '🟡 Lendária'; if(value.includes('EPIC'))return '🟣 Épica'; if(value.includes('RARA'))return '🔵 Rara'; return '🟢 Comum'; }
function hexToRgba(hex='#f59e0b', alpha=.22) { const clean=String(hex).replace('#','').trim(); if(clean.length!==6)return `rgba(245,158,11,${alpha})`; const r=parseInt(clean.substring(0,2),16); const g=parseInt(clean.substring(2,4),16); const b=parseInt(clean.substring(4,6),16); return `rgba(${r},${g},${b},${alpha})`; }
