const UNIVERSE_PLANETS = [
  { key: 'ENERGETICOS', title: 'Planeta Energy', subtitle: 'Energéticos e combos de energia', emoji: '⚡', color: '#f59e0b', x: 20, y: 18 },
  { key: 'CERVEJAS', title: 'Órbita das Cervejas', subtitle: 'Long necks, latas e especiais', emoji: '🍺', color: '#22c55e', x: 72, y: 30 },
  { key: 'DRINKS', title: 'Nebulosa dos Drinks', subtitle: 'Copões, gin e misturas', emoji: '🍹', color: '#ec4899', x: 28, y: 54 },
  { key: 'DESTILADOS', title: 'Setor dos Destilados', subtitle: 'Whisky, vodka, gin e especiais', emoji: '🥃', color: '#a855f7', x: 72, y: 72 },
  { key: 'RECOMPENSAS', title: 'Base Bebcom', subtitle: 'Lounge, conveniência e retirada de prêmios', emoji: '🏢', color: '#dc2626', x: 50, y: 91 }
];

let universeState = { expeditions: [], progress: [], redeems: [], lastPercent: 0, activePlanetIndex: 0 };

function normalizeUniverseKey(value = '') {
  return String(value).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]+/g, '_');
}

function getPlanetForExpedition(expedition) {
  const key = normalizeUniverseKey(expedition?.categoryKey || expedition?.category || expedition?.title || '');
  if (key.includes('ENERGET')) return UNIVERSE_PLANETS[0];
  if (key.includes('CERVE') || key.includes('BEER')) return UNIVERSE_PLANETS[1];
  if (key.includes('DRINK') || key.includes('COPAO') || key.includes('GIN')) return UNIVERSE_PLANETS[2];
  if (key.includes('DESTIL') || key.includes('WHISKY') || key.includes('VODKA')) return UNIVERSE_PLANETS[3];
  return UNIVERSE_PLANETS[0];
}

async function loadUniverse() {
  if (!currentUser?.phone) return;

  try {
    const response = await fetch(`${API_BASE}/api/clube/expedicoes/${currentUser.phone}`);
    const data = await response.json();
    if (!data.success) return renderUniverseEmpty('Ainda não foi possível carregar as expedições.');
    universeState.expeditions = data.expeditions || [];
    universeState.progress = data.progress || [];
    universeState.redeems = data.redeems || [];
    renderUniverse();
  } catch (error) {
    console.error('Erro ao carregar Universo Bebcom:', error);
    renderUniverseEmpty('Falha ao conectar ao Universo Bebcom.');
  }
}

function renderUniverseEmpty(message) {
  const box = document.getElementById('universeCard');
  if (!box) return;
  box.innerHTML = `
    <div class="universe-header">
      <div class="universe-kicker">Central de navegação</div>
      <h3>🌌 Universo Bebcom</h3>
      <p>Suas expedições aparecerão aqui.</p>
    </div>
    <div class="universe-empty">${message}</div>
  `;
}

function renderUniverse() {
  const box = document.getElementById('universeCard');
  if (!box) return;
  if (!universeState.expeditions.length) return renderUniverseEmpty('Nenhuma expedição ativa no momento. Em breve novas rotas serão liberadas.');

  const currentExpedition = chooseCurrentExpedition();
  const currentProgress = findProgressForExpedition(currentExpedition);
  const percent = calculateExpeditionPercent(currentExpedition, currentProgress);
  universeState.lastPercent = percent;

  const activePlanet = getPlanetForExpedition(currentExpedition);
  let activePlanetIndex = UNIVERSE_PLANETS.findIndex(p => p.key === activePlanet.key);
  if (percent >= 100) activePlanetIndex = UNIVERSE_PLANETS.length - 1;
  universeState.activePlanetIndex = activePlanetIndex;
  const routeOffset = calculateRouteOffset(activePlanetIndex, percent);

  box.innerHTML = `
    <div class="universe-header">
      <div class="universe-kicker">🌌 Central de navegação</div>
      <h3>Universo Bebcom</h3>
      <p>Cada QR escaneado move seu avatar por uma expedição real da Bebidas & Companhia.</p>
    </div>

    ${renderUniverseHud()}

    <div class="universe-cinema">
      <div class="universe-stars"></div>
      <div class="universe-nebula"></div>
      <div class="universe-grid"></div>
      <div class="universe-comets"></div>

      <div class="universe-route" style="--route-offset:${routeOffset}">
        ${renderRouteSvg()}
        <div id="universeShip" class="universe-ship">
          <div class="universe-ship-emoji">${getUniverseAvatarEmoji()}</div>
        </div>
        <div id="universeArrival" class="universe-arrival"></div>
        ${UNIVERSE_PLANETS.map((planet, index) => renderPlanetNode(planet, index, activePlanetIndex)).join('')}
      </div>
    </div>

    <div class="universe-panel">
      <div class="universe-panel-title">Expedição atual</div>
      <div class="universe-expedition-name">${currentExpedition.title}</div>
      <div class="universe-progress-track"><div class="universe-progress-fill" style="width:${percent}%"></div></div>
      <div class="universe-progress-text">${percent}% concluído • ${getNextProductText(currentExpedition, currentProgress)}</div>
      <div class="universe-action-row">
        <div class="universe-action-chip">🧭 Destino: ${UNIVERSE_PLANETS[activePlanetIndex]?.title || 'Universo Bebcom'}</div>
        <div class="universe-action-chip">🎁 Resgates disponíveis: ${universeState.redeems?.filter(r => r.status === 'available').length || 0}</div>
      </div>
    </div>
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

  return `
    <div class="universe-hud">
      <div class="universe-hud-avatar">${getUniverseAvatarEmoji()}</div>
      <div class="universe-hud-main"><strong>${avatarName}</strong><span>${avatarRole} • ${rank}</span></div>
      <div class="universe-hud-stats">
        <div class="universe-hud-pill">⭐ Nível ${level}</div>
        <div class="universe-hud-pill">⚡ ${xp} XP</div>
        <div class="universe-hud-pill">📷 ${scans}</div>
        <div class="universe-hud-pill">🎁 ${rewards}</div>
      </div>
    </div>
  `;
}

function renderRouteSvg() {
  return `
    <svg class="universe-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs><linearGradient id="bebcomRouteGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563eb"/><stop offset="48%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#dc2626"/></linearGradient></defs>
      <path class="universe-path-line" d="M20 18 C42 18, 53 27, 72 30 C55 37, 45 44, 28 54 C46 59, 58 66, 72 72 C65 80, 57 86, 50 91" />
      <path class="universe-path-line-active" d="M20 18 C42 18, 53 27, 72 30 C55 37, 45 44, 28 54 C46 59, 58 66, 72 72 C65 80, 57 86, 50 91" />
    </svg>
  `;
}

function renderPlanetNode(planet, index, activeIndex) {
  const isActive = index === activeIndex;
  const isVisited = index < activeIndex;
  const isLocked = index > activeIndex + 1;
  return `
    <div class="universe-node ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''} ${isLocked ? 'locked' : ''}" data-node="${index}">
      <div class="planet-wrap" style="--planet-color:${planet.color}"><div class="planet-glow"></div><div class="planet-ring"></div><div class="planet">${planet.emoji}</div></div>
      <div class="planet-info"><strong>${planet.title}</strong><span>${planet.subtitle}</span></div>
    </div>
  `;
}

function chooseCurrentExpedition() {
  return universeState.expeditions.find(expedition => !findProgressForExpedition(expedition)?.completed) || universeState.expeditions[0];
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
  if (!nextStep) return 'Expedição concluída. Retire sua recompensa na Base Bebcom.';
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
  const xp = scanData.xpGained ? `+${scanData.xpGained} XP` : 'Expedição atualizada';
  toast.innerHTML = `<strong>🚀 ${product}</strong><span>${xp} • ${scanData.message || 'Seu avatar avançou no Universo Bebcom.'}</span>`;
  toast.classList.add('active');
  setTimeout(() => toast.classList.remove('active'), 3600);
}

function showUniverseReward(reward) {
  const overlay = document.getElementById('universeRewardOverlay');
  if (!overlay) return;
  overlay.innerHTML = `
    <div class="reward-cinematic-box">
      <div class="reward-icon">🎁</div>
      <h2>Missão concluída</h2>
      <p><strong>${reward.title || 'Recompensa Bebcom'}</strong></p>
      <p>${reward.description || 'Sua recompensa está pronta para retirada na Bebidas & Companhia.'}</p>
      <div class="reward-location">🏢 Base Bebcom • Retirada na loja física</div>
      <button class="btn-primary" onclick="closeUniverseReward()">Continuar Jornada</button>
    </div>
  `;
  overlay.classList.add('active');
}

function closeUniverseReward() {
  document.getElementById('universeRewardOverlay')?.classList.remove('active');
}
