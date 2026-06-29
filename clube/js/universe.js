const UNIVERSE_PLANETS = [
  { key: 'ENERGETICOS', title: 'Planeta Energy', subtitle: 'Energéticos e combos de energia', emoji: '⚡', color: '#f59e0b', x: 20, y: 18 },
  { key: 'CERVEJAS', title: 'Órbita das Cervejas', subtitle: 'Long necks, latas e especiais', emoji: '🍺', color: '#22c55e', x: 72, y: 30 },
  { key: 'REFRIGERANTES', title: 'Galáxia Refri', subtitle: 'Coca, Guaraná, Sprite e sabores', emoji: '🥤', color: '#38bdf8', x: 28, y: 54 },
  { key: 'DRINKS', title: 'Nebulosa dos Drinks', subtitle: 'Copões, gin e misturas', emoji: '🍹', color: '#ec4899', x: 72, y: 72 },
  { key: 'DESTILADOS', title: 'Constelação Destilados', subtitle: 'Whisky, vodka, gin e especiais', emoji: '🥃', color: '#a855f7', x: 50, y: 91 },
  { key: 'SALGADINHOS', title: 'Campo dos Snacks', subtitle: 'Salgadinhos e acompanhamentos', emoji: '🥜', color: '#fb923c', x: 18, y: 76 },
  { key: 'SUCOS', title: 'Vale dos Sucos', subtitle: 'Sucos e bebidas leves', emoji: '🍊', color: '#f97316', x: 82, y: 54 },
  { key: 'DOCES', title: 'Mundo dos Doces', subtitle: 'Chocolate, balas e sobremesas', emoji: '🍬', color: '#f472b6', x: 40, y: 32 },
  { key: 'MERCEARIA', title: 'Cidade Mercearia', subtitle: 'Itens variados da conveniência', emoji: '🛒', color: '#14b8a6', x: 60, y: 46 },
  { key: 'CARVAO', title: 'Vulcão do Carvão', subtitle: 'Carvão e itens para churrasco', emoji: '🔥', color: '#ef4444', x: 36, y: 88 },
  { key: 'GELOS', title: 'Base Gelo', subtitle: 'Gelos para completar a missão', emoji: '🧊', color: '#60a5fa', x: 82, y: 86 },
  { key: 'RECOMPENSAS', title: 'Base Bebcom', subtitle: 'Lounge, conveniência e retirada de prêmios', emoji: '🏢', color: '#dc2626', x: 50, y: 96 }
];

let universeState = { expeditions: [], progress: [], redeems: [], lastPercent: 0, activePlanetIndex: 0, selectedExpeditionId: null };

function normalizeUniverseKey(value = '') {
  return String(value).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
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
    if (!selectedStillExists) universeState.selectedExpeditionId = chooseCurrentExpedition()?._id || null;
    renderUniverse();
  } catch (error) {
    console.error('Erro ao carregar Universo Bebcom:', error);
    renderUniverseEmpty('Falha ao conectar ao Universo Bebcom.');
  }
}

function renderUniverseEmpty(message) {
  const box = document.getElementById('universeCard');
  if (!box) return;
  box.innerHTML = `<div class="universe-header"><div class="universe-kicker">Central de navegação</div><h3>🌌 Universo Bebcom</h3><p>Suas campanhas aparecerão aqui.</p></div><div class="universe-empty">${message}</div>`;
}

function renderUniverse() {
  const box = document.getElementById('universeCard');
  if (!box) return;
  if (!universeState.expeditions.length) return renderUniverseEmpty('Nenhuma campanha ativa no momento. Em breve novas rotas serão liberadas.');

  const selectedExpedition = getSelectedExpedition();
  const selectedProgress = findProgressForExpedition(selectedExpedition);
  const percent = calculateExpeditionPercent(selectedExpedition, selectedProgress);
  universeState.lastPercent = percent;

  const activePlanet = getPlanetForExpedition(selectedExpedition);
  let activePlanetIndex = UNIVERSE_PLANETS.findIndex(p => p.key === activePlanet.key);
  if (percent >= 100) activePlanetIndex = UNIVERSE_PLANETS.length - 1;
  universeState.activePlanetIndex = activePlanetIndex;
  const routeOffset = calculateRouteOffset(activePlanetIndex, percent);

  box.innerHTML = `
    <div class="universe-header">
      <div class="universe-kicker">🌌 Central de navegação</div>
      <h3>Universo Bebcom</h3>
      <p>Participe de várias campanhas ao mesmo tempo. Cada produto pode avançar mais de uma rota.</p>
    </div>
    ${renderUniverseHud()}
    <div class="universe-cinema">
      <div class="universe-stars"></div><div class="universe-nebula"></div><div class="universe-grid"></div><div class="universe-comets"></div>
      <div class="universe-route" style="--route-offset:${routeOffset}">
        ${renderRouteSvg()}
        <div id="universeShip" class="universe-ship"><div class="universe-ship-emoji">${getUniverseAvatarEmoji()}</div></div>
        <div id="universeArrival" class="universe-arrival"></div>
        ${UNIVERSE_PLANETS.map((planet, index) => renderPlanetNode(planet, index, activePlanetIndex)).join('')}
      </div>
    </div>
    ${renderSelectedCampaignPanel(selectedExpedition, selectedProgress, percent)}
    ${renderCampaignsPanel()}
    <div id="universeToast" class="universe-toast"></div>
  `;
  positionUniverseShip(activePlanetIndex, percent, false);
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
  return `<div class="universe-hud"><div class="universe-hud-avatar">${getUniverseAvatarEmoji()}</div><div class="universe-hud-main"><strong>${avatarName}</strong><span>${avatarRole} • ${rank}</span></div><div class="universe-hud-stats"><div class="universe-hud-pill">⭐ Nível ${level}</div><div class="universe-hud-pill">⚡ ${xp} XP</div><div class="universe-hud-pill">🎯 ${activeCampaigns} campanhas</div><div class="universe-hud-pill">📷 ${scans}</div><div class="universe-hud-pill">🎁 ${rewards}</div></div></div>`;
}

function renderRouteSvg() {
  return `<svg class="universe-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="bebcomRouteGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563eb"/><stop offset="48%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#dc2626"/></linearGradient></defs><path class="universe-path-line" d="M20 18 C42 18, 53 27, 72 30 C55 37, 45 44, 28 54 C46 59, 58 66, 72 72 C65 80, 57 88, 50 96" /><path class="universe-path-line-active" d="M20 18 C42 18, 53 27, 72 30 C55 37, 45 44, 28 54 C46 59, 58 66, 72 72 C65 80, 57 88, 50 96" /></svg>`;
}

function renderPlanetNode(planet, index, activeIndex) {
  const isActive = index === activeIndex;
  const isVisited = index < activeIndex;
  const relatedCount = universeState.expeditions.filter(exp => getPlanetForExpedition(exp).key === planet.key).length;
  return `<div class="universe-node ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''}" data-node="${index}"><div class="planet-wrap" style="--planet-color:${planet.color}"><div class="planet-glow"></div><div class="planet-ring"></div><div class="planet">${planet.emoji}</div></div><div class="planet-info"><strong>${planet.title}</strong><span>${planet.subtitle}${relatedCount ? `<br>${relatedCount} campanha(s)` : ''}</span></div></div>`;
}

function renderSelectedCampaignPanel(expedition, progress, percent) {
  const planet = getPlanetForExpedition(expedition);
  const completed = percent >= 100;
  const availableRedeems = universeState.redeems?.filter(r => r.status === 'available').length || 0;
  const color = expedition.color || planet.color;
  return `<div class="campaign-detail" style="--campaign-color:${color}; --campaign-color-soft:${hexToRgba(color, .22)}"><div class="campaign-detail-header"><div class="campaign-detail-icon">${planet.emoji}</div><div><h4>${expedition.title}</h4><p>${expedition.description || 'Campanha ativa no Universo Bebcom.'}</p><div class="campaign-meta"><span class="campaign-pill">🪐 ${planet.title}</span><span class="campaign-pill">🏆 ${formatRarity(expedition.rarity)}</span><span class="campaign-pill">🏢 ${expedition.sponsor || 'Bebcom'}</span><span class="campaign-pill">🎁 ${availableRedeems} resgate(s)</span></div></div></div><div class="universe-progress-track"><div class="universe-progress-fill" style="width:${percent}%"></div></div><div class="universe-progress-text">${percent}% concluído • ${getNextProductText(expedition, progress)}</div><div class="campaign-steps">${renderCampaignSteps(expedition, progress)}</div>${completed ? `<div class="universe-action-row"><div class="universe-action-chip">🏢 Missão concluída. Vá até a Base Bebcom para retirar sua recompensa.</div></div>` : ''}</div>`;
}

function renderCampaignsPanel() {
  const completed = universeState.expeditions.filter(exp => calculateExpeditionPercent(exp, findProgressForExpedition(exp)) >= 100).length;
  return `<div class="campaigns-panel"><div class="campaigns-panel-title"><strong>🎯 Campanhas ativas</strong><span>${universeState.expeditions.length} campanha(s) • ${completed} concluída(s)</span></div><div class="campaigns-grid">${universeState.expeditions.map(exp => renderCampaignCard(exp)).join('')}</div></div>`;
}

function renderCampaignCard(expedition) {
  const planet = getPlanetForExpedition(expedition);
  const progress = findProgressForExpedition(expedition);
  const percent = calculateExpeditionPercent(expedition, progress);
  const selected = String(expedition._id) === String(universeState.selectedExpeditionId);
  const completed = percent >= 100;
  const nextText = getNextProductText(expedition, progress).replace('próximo produto: ', '');
  const color = expedition.color || planet.color;
  return `<div class="campaign-card ${selected ? 'selected' : ''} ${completed ? 'completed' : ''}" style="--campaign-color:${color}; --campaign-color-soft:${hexToRgba(color, .22)}" onclick="selectUniverseCampaign('${expedition._id}')"><div class="campaign-card-top"><div class="campaign-icon">${completed ? '🏢' : planet.emoji}</div><div class="campaign-main"><strong>${expedition.title}</strong><div class="campaign-meta"><span class="campaign-pill">${formatRarity(expedition.rarity)}</span><span class="campaign-pill">${planet.title}</span><span class="campaign-pill">${expedition.sponsor || 'Bebcom'}</span></div></div></div><div class="campaign-progress"><div class="campaign-progress-track"><div class="campaign-progress-fill" style="width:${percent}%"></div></div><div class="campaign-progress-text">${percent}% • ${completed ? 'Concluída' : nextText}</div></div></div>`;
}

function renderCampaignSteps(expedition, progress) {
  const steps = Array.isArray(expedition?.steps) ? expedition.steps : [];
  const completed = new Set(progress?.completedSteps || []);
  if (!steps.length) return '<div class="campaign-empty-note">Nenhum produto cadastrado nesta campanha.</div>';
  return steps.map(step => {
    const done = completed.has(step.index);
    return `<div class="campaign-step ${done ? 'done' : ''}"><span>${step.title}</span><span class="campaign-step-status">${done ? '✓ Encontrado' : '○ Pendente'}</span></div>`;
  }).join('');
}

function selectUniverseCampaign(expeditionId) {
  universeState.selectedExpeditionId = expeditionId;
  renderUniverse();
}

function chooseCurrentExpedition() {
  return universeState.expeditions.find(expedition => !findProgressForExpedition(expedition)?.completed) || universeState.expeditions[0];
}

function getSelectedExpedition() {
  return universeState.expeditions.find(expedition => String(expedition._id) === String(universeState.selectedExpeditionId)) || chooseCurrentExpedition();
}

function findProgressForExpedition(expedition) {
  if (!expedition?._id) return null;
  return universeState.progress.find(item => String(item.expeditionId || '') === String(expedition._id || ''));
}

function calculateExpeditionPercent(expedition, progress) {
  const total = Array.isArray(expedition?.steps) ? expedition.steps.length : 0;
  if (!total) return 0;
  const completed = Array.isArray(progress?.completedSteps) ? progress.completedSteps.length : 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

function getNextProductText(expedition, progress) {
  const steps = Array.isArray(expedition?.steps) ? expedition.steps : [];
  const completed = new Set(progress?.completedSteps || []);
  const nextStep = steps.find(step => !completed.has(step.index));
  if (!nextStep) return expedition?.completionMessage || 'Expedição concluída. Retire sua recompensa na Base Bebcom.';
  return `próximo produto: ${nextStep.title}`;
}

function getUniverseAvatarEmoji() {
  const saved = getSavedAvatar?.();
  return saved?.emoji || '🧑‍🚀';
}

function calculateRouteOffset(activePlanetIndex, percent = 0) {
  const total = 620;
  const planetCount = UNIVERSE_PLANETS.length - 1;
  const planetProgress = Math.min(1, Math.max(0, activePlanetIndex / planetCount));
  const stepBonus = Math.min(0.18, Math.max(0, percent / 100) * 0.18);
  const revealed = Math.min(1, planetProgress + stepBonus);
  return Math.round(total - (total * revealed));
}

function getShipCoordinates(activePlanetIndex, percent = 0) {
  const target = UNIVERSE_PLANETS[activePlanetIndex] || UNIVERSE_PLANETS[0];
  if (activePlanetIndex === UNIVERSE_PLANETS.length - 1) return { x: target.x, y: target.y };
  const next = UNIVERSE_PLANETS[Math.min(activePlanetIndex + 1, UNIVERSE_PLANETS.length - 1)];
  const progressTowardNext = Math.min(0.28, Math.max(0, percent / 100) * 0.28);
  return { x: target.x + ((next.x - target.x) * progressTowardNext), y: target.y + ((next.y - target.y) * progressTowardNext) };
}

function positionUniverseShip(activePlanetIndex, percent = 0, animate = true) {
  const ship = document.getElementById('universeShip');
  if (!ship) return;
  const coords = getShipCoordinates(activePlanetIndex, percent);
  if (!animate) {
    ship.style.transition = 'none';
    ship.style.left = `${coords.x}%`;
    ship.style.top = `${coords.y}%`;
    requestAnimationFrame(() => { ship.style.transition = ''; });
    return;
  }
  ship.style.left = `${coords.x}%`;
  ship.style.top = `${coords.y}%`;
}

function animateUniverseAdvance(scanData) {
  const ship = document.getElementById('universeShip');
  showUniverseToast(scanData);
  if (ship) ship.classList.add('moving');
  setTimeout(() => positionUniverseShip(universeState.activePlanetIndex, universeState.lastPercent, true), 80);
  setTimeout(() => {
    if (ship) ship.classList.remove('moving');
    triggerArrivalEffect();
  }, 1450);
  if (scanData?.reward) setTimeout(() => showUniverseReward(scanData.reward), 1850);
}

function triggerArrivalEffect() {
  const arrival = document.getElementById('universeArrival');
  const ship = document.getElementById('universeShip');
  if (!arrival || !ship) return;
  arrival.style.left = ship.style.left;
  arrival.style.top = ship.style.top;
  arrival.classList.remove('active');
  void arrival.offsetWidth;
  arrival.classList.add('active');
}

function showUniverseToast(scanData = {}) {
  const toast = document.getElementById('universeToast');
  if (!toast) return;
  const product = scanData.product || 'Produto encontrado';
  const xp = scanData.xpGained ? `+${scanData.xpGained} XP` : 'Campanha atualizada';
  const campaigns = Array.isArray(scanData.expeditionResults)
    ? scanData.expeditionResults.filter(item => ['advanced', 'completed'].includes(item.status)).length
    : 0;
  toast.innerHTML = `<strong>🚀 ${product}</strong><span>${xp} • ${campaigns ? `Avançou em ${campaigns} campanha(s).` : (scanData.message || 'Seu avatar avançou no Universo Bebcom.')}</span>`;
  toast.classList.add('active');
  setTimeout(() => toast.classList.remove('active'), 3600);
}

function showUniverseReward(reward) {
  const overlay = document.getElementById('universeRewardOverlay');
  if (!overlay) return;
  overlay.innerHTML = `<div class="reward-cinematic-box"><div class="reward-icon">🎁</div><h2>Missão concluída</h2><p><strong>${reward.title || 'Recompensa Bebcom'}</strong></p><p>${reward.description || 'Sua recompensa está pronta para retirada na Bebidas & Companhia.'}</p><div class="reward-location">🏢 Base Bebcom • Retirada na loja física</div><button class="btn-primary" onclick="closeUniverseReward()">Continuar Jornada</button></div>`;
  overlay.classList.add('active');
}

function closeUniverseReward() {
  document.getElementById('universeRewardOverlay')?.classList.remove('active');
}

function formatRarity(rarity = 'comum') {
  const value = normalizeUniverseKey(rarity);
  if (value.includes('LENDAR')) return '🟡 Lendária';
  if (value.includes('EPIC')) return '🟣 Épica';
  if (value.includes('RARA')) return '🔵 Rara';
  return '🟢 Comum';
}

function hexToRgba(hex = '#f59e0b', alpha = 0.22) {
  const clean = String(hex).replace('#', '').trim();
  if (clean.length !== 6) return `rgba(245,158,11,${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
