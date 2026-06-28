const UNIVERSE_PLANETS = [
  {
    key: 'ENERGETICOS',
    title: 'Planeta Energy',
    subtitle: 'Energéticos e combos de energia',
    emoji: '⚡',
    color: '#f59e0b'
  },
  {
    key: 'CERVEJAS',
    title: 'Órbita das Cervejas',
    subtitle: 'Long necks, latas e especiais',
    emoji: '🍺',
    color: '#22c55e'
  },
  {
    key: 'DRINKS',
    title: 'Nebulosa dos Drinks',
    subtitle: 'Copões, gin e misturas',
    emoji: '🍹',
    color: '#ec4899'
  },
  {
    key: 'DESTILADOS',
    title: 'Setor dos Destilados',
    subtitle: 'Whisky, vodka, gin e especiais',
    emoji: '🥃',
    color: '#a855f7'
  },
  {
    key: 'RECOMPENSAS',
    title: 'Centro de Resgate',
    subtitle: 'Prêmios para retirada na loja física',
    emoji: '🎁',
    color: '#dc2626'
  }
];

let universeState = {
  expeditions: [],
  progress: [],
  redeems: [],
  lastPercent: 0
};

function getPlanetForExpedition(expedition) {
  const key = normalizeUniverseKey(
    expedition?.categoryKey ||
    expedition?.category ||
    expedition?.title ||
    ''
  );

  if (key.includes('ENERGET')) return UNIVERSE_PLANETS[0];
  if (key.includes('CERVE')) return UNIVERSE_PLANETS[1];
  if (key.includes('DRINK') || key.includes('COPAO') || key.includes('GIN')) return UNIVERSE_PLANETS[2];
  if (key.includes('DESTIL') || key.includes('WHISKY') || key.includes('VODKA')) return UNIVERSE_PLANETS[3];

  return UNIVERSE_PLANETS[0];
}

function normalizeUniverseKey(value = '') {
  return String(value)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_');
}

async function loadUniverse() {
  if (!currentUser?.phone) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/clube/expedicoes/${currentUser.phone}`);
    const data = await response.json();

    if (!data.success) {
      renderUniverseEmpty('Ainda não foi possível carregar as expedições.');
      return;
    }

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
      <h3>🌌 Universo Bebcom</h3>
      <p>Suas expedições aparecerão aqui.</p>
    </div>

    <div class="universe-empty">
      ${message}
    </div>
  `;
}

function renderUniverse() {
  const box = document.getElementById('universeCard');

  if (!box) return;

  if (!universeState.expeditions.length) {
    renderUniverseEmpty('Nenhuma expedição ativa no momento. Em breve novas rotas serão liberadas.');
    return;
  }

  const currentExpedition = chooseCurrentExpedition();
  const currentProgress = findProgressForExpedition(currentExpedition);
  const percent = calculateExpeditionPercent(currentExpedition, currentProgress);
  universeState.lastPercent = percent;

  const activePlanet = getPlanetForExpedition(currentExpedition);
  const activePlanetIndex = UNIVERSE_PLANETS.findIndex(p => p.key === activePlanet.key);

  box.innerHTML = `
    <div class="universe-header">
      <h3>🌌 Universo Bebcom</h3>
      <p>Cada produto escaneado move seu avatar pela jornada.</p>
    </div>

    <div class="universe-map">
      <div class="universe-stars"></div>
      <div id="universeAvatar" class="universe-avatar">${getUniverseAvatarEmoji()}</div>

      <div class="universe-route">
        ${UNIVERSE_PLANETS.map((planet, index) => renderPlanetNode(planet, index, activePlanetIndex)).join('')}
      </div>
    </div>

    <div class="universe-panel">
      <div class="universe-panel-title">Expedição atual</div>
      <div class="universe-expedition-name">${currentExpedition.title}</div>
      <div class="universe-progress-track">
        <div class="universe-progress-fill" style="width:${percent}%"></div>
      </div>
      <div class="universe-progress-text">
        ${percent}% concluído • ${getNextProductText(currentExpedition, currentProgress)}
      </div>
    </div>
  `;

  positionUniverseAvatar(activePlanetIndex, percent);
}

function renderPlanetNode(planet, index, activeIndex) {
  const isActive = index === activeIndex;
  const isLocked = index > activeIndex + 1;

  return `
    <div class="universe-node ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}" data-planet-index="${index}">
      <div class="planet-info">
        <strong>${planet.title}</strong>
        <span>${planet.subtitle}</span>
      </div>

      <div class="planet-wrap" style="--planet-color:${planet.color}">
        <div class="planet-ring"></div>
        <div class="planet">${planet.emoji}</div>
      </div>
    </div>
  `;
}

function chooseCurrentExpedition() {
  const incomplete = universeState.expeditions.find(expedition => {
    const progress = findProgressForExpedition(expedition);
    return !progress?.completed;
  });

  return incomplete || universeState.expeditions[0];
}

function findProgressForExpedition(expedition) {
  if (!expedition?._id) return null;

  return universeState.progress.find(item => {
    const progressId = String(item.expeditionId || '');
    const expeditionId = String(expedition._id || '');
    return progressId === expeditionId;
  });
}

function calculateExpeditionPercent(expedition, progress) {
  const total = Array.isArray(expedition?.steps) ? expedition.steps.length : 0;

  if (!total) return 0;

  const completed = Array.isArray(progress?.completedSteps)
    ? progress.completedSteps.length
    : 0;

  return Math.min(100, Math.round((completed / total) * 100));
}

function getNextProductText(expedition, progress) {
  const steps = Array.isArray(expedition?.steps) ? expedition.steps : [];
  const completed = new Set(progress?.completedSteps || []);

  const nextStep = steps.find(step => !completed.has(step.index));

  if (!nextStep) {
    return 'Expedição concluída';
  }

  return `próximo produto: ${nextStep.title}`;
}

function getUniverseAvatarEmoji() {
  const saved = getSavedAvatar?.();

  return saved?.emoji || '🧑‍🚀';
}

function positionUniverseAvatar(activePlanetIndex, percent = 0) {
  const avatar = document.getElementById('universeAvatar');

  if (!avatar) return;

  const baseTop = 44;
  const nodeDistance = window.innerWidth <= 620 ? 104 : 122;

  const percentOffset = Math.min(70, Math.max(0, percent * 0.58));
  const top = baseTop + (activePlanetIndex * nodeDistance) + percentOffset;

  avatar.style.top = `${top}px`;
}

function animateUniverseAdvance(scanData) {
  const avatar = document.getElementById('universeAvatar');

  if (avatar) {
    avatar.classList.add('moving');

    setTimeout(() => {
      avatar.classList.remove('moving');
    }, 1400);
  }

  if (scanData?.reward) {
    setTimeout(() => {
      showUniverseReward(scanData.reward);
    }, 900);
  }
}

function showUniverseReward(reward) {
  const overlay = document.getElementById('universeRewardOverlay');

  if (!overlay) return;

  overlay.innerHTML = `
    <div class="reward-cinematic-box">
      <div class="reward-icon">🎁</div>
      <h2>Recompensa desbloqueada</h2>
      <p><strong>${reward.title || 'Recompensa Bebcom'}</strong></p>
      <p>${reward.description || 'Sua recompensa está pronta para retirada na Bebidas & Companhia.'}</p>
      <button class="btn-primary" onclick="closeUniverseReward()">Continuar Jornada</button>
    </div>
  `;

  overlay.classList.add('active');
}

function closeUniverseReward() {
  document.getElementById('universeRewardOverlay')?.classList.remove('active');
}
