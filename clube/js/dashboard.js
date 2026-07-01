async function loginClube() {
  const name = document.getElementById('nameInput').value.trim();
  const phone = onlyNumbers(document.getElementById('phoneInput').value);

  if (!phone || phone.length < 10) {
    alert('Informe um WhatsApp válido com DDD.');
    return;
  }

  const response = await fetch(`${API_BASE}/api/clube/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, phone })
  });

  const data = await response.json();

  if (!data.success) {
    alert(data.error || 'Erro ao entrar no Clube.');
    return;
  }

  currentUser = data.user;
  saveSession(currentUser);

  const savedAvatar = getSavedAvatar();

  if (!savedAvatar) {
    document.getElementById('loginCard')?.classList.add('hidden');
    openAvatarStage(false);
    return;
  }

  document.getElementById('loginCard').classList.add('hidden');
  document.getElementById('dashboardCard').classList.remove('hidden');

  await loadProfile();
  await loadUniverse();
}

async function loadProfile() {
  if (!currentUser?.phone) return;

  const response = await fetch(`${API_BASE}/api/clube/perfil/${currentUser.phone}`);
  const data = await response.json();

  if (!data.success) return;

  currentUser = data.user;
  saveSession(currentUser);

  document.getElementById('playerName').innerText = currentUser.name || 'Jogador Bebcom';

  const xp = Number(currentUser.xp || 0);
  const level = Number(currentUser.level || 1);
  const rank = currentUser.rank || 'Explorador';
  const xpPercent = Math.min(xp % 100, 100);

  document.getElementById('xpFill').style.width = `${xpPercent}%`;
  document.getElementById('xpText').innerText = `${xp} XP • ${rank}`;
  document.getElementById('levelText').innerText = level;
  document.getElementById('scanText').innerText = currentUser.stats?.scans || 0;
  document.getElementById('rewardText').innerText = currentUser.stats?.rewardsUnlocked || 0;

  applyAvatarToDashboard();

  renderRewards(data.rewards || []);
  renderScans(data.scans || []);
}

async function loadMissions() {
  return;
}

async function scanQr() {
  const code = document.getElementById('qrInput').value.trim();

  if (!currentUser?.phone) {
    alert('Entre no Clube primeiro.');
    return;
  }

  if (!code) {
    alert('Informe o código do QR.');
    return;
  }

  const response = await fetch(`${API_BASE}/api/clube/escanear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: currentUser.phone,
      code
    })
  });

  const data = await response.json();

  if (!data.success) {
    showNotice('scanResult', data.error || 'Erro ao validar QR.', 'error');
    return;
  }

  let message = `
    ✅ ${data.message}<br>
    Produto: <strong>${data.product}</strong><br>
    XP ganho: <strong>+${data.xpGained || 0} XP</strong><br>
    Nível atual: <strong>${data.newLevel}</strong><br>
    Patente: <strong>${data.rank || 'Explorador'}</strong>
  `;

  if (data.reward) {
    message += `<br><br>🎁 Artefato desbloqueado: <strong>${data.reward.title}</strong>`;
  }

  showNotice('scanResult', message, 'success');

  document.getElementById('qrInput').value = '';

  await loadProfile();
  await loadUniverse();

  if (typeof animateUniverseAdvance === 'function') {
    animateUniverseAdvance(data);
  }

  if (data.reward && typeof showArtifactUnlock === 'function') {
    setTimeout(() => showArtifactUnlock(data.reward), 950);
  }
}

function renderRewards(rewards) {
  const box = document.getElementById('rewardsList');
  if (!box) return;

  if (!rewards.length) {
    box.innerHTML = `
      <div class="inventory-empty">
        <div class="inventory-empty-icon">🎒</div>
        <strong>Inventário vazio</strong>
        <p>Complete campanhas no Universo Bebcom para desbloquear seus primeiros artefatos.</p>
      </div>
    `;
    return;
  }

  const available = rewards.filter(reward => (reward.status || 'available') === 'available');
  const redeemed = rewards.filter(reward => (reward.status || 'available') !== 'available');

  box.innerHTML = `
    <div class="inventory-shell">
      <div class="inventory-header">
        <div>
          <div class="inventory-kicker">🎒 Inventário Bebcom</div>
          <h3>Artefatos conquistados</h3>
          <p>Guarde seus códigos e retire seus prêmios na Base Bebcom.</p>
        </div>

        <div class="inventory-counter">
          <strong>${available.length}</strong>
          <span>pronto(s)</span>
        </div>
      </div>

      <div class="inventory-tabs">
        <button class="inventory-tab active" onclick="filterInventory('available')">🎁 Disponíveis</button>
        <button class="inventory-tab" onclick="filterInventory('all')">🌌 Todos</button>
        <button class="inventory-tab" onclick="filterInventory('used')">✅ Usados</button>
      </div>

      <div id="inventoryItems" class="inventory-grid">
        ${renderInventoryItems(available.length ? available : rewards)}
      </div>
    </div>
  `;

  window.__bebcomRewards = rewards;
}

function renderInventoryItems(items) {
  if (!items.length) {
    return `
      <div class="inventory-empty compact">
        <strong>Nenhum item nesta aba.</strong>
      </div>
    `;
  }

  return items.map(reward => {
    const status = reward.status || 'available';
    const isAvailable = status === 'available';
    const createdAt = reward.createdAt ? new Date(reward.createdAt).toLocaleDateString('pt-BR') : 'Hoje';
    const title = reward.title || 'Artefato Bebcom';
    const description = reward.description || 'Retire sua recompensa na Bebidas & Companhia.';
    const code = reward.code || 'SEM-CODIGO';

    return `
      <article class="artifact-card ${isAvailable ? 'available' : 'used'}">
        <div class="artifact-glow"></div>

        <div class="artifact-top">
          <div class="artifact-icon">${getArtifactIcon(title)}</div>
          <div>
            <strong>${title}</strong>
            <span>${isAvailable ? 'Disponível para retirada' : 'Histórico do inventário'}</span>
          </div>
        </div>

        <p>${description}</p>

        <div class="artifact-code-box">
          <span>Código de retirada</span>
          <strong>${code}</strong>
        </div>

        <div class="artifact-meta">
          <span>🏢 Base Bebcom</span>
          <span>📅 ${createdAt}</span>
        </div>

        <div class="artifact-status ${isAvailable ? 'status-available' : 'status-used'}">
          ${isAvailable ? '🎁 Retirar na loja física' : '✅ Já utilizado / histórico'}
        </div>
      </article>
    `;
  }).join('');
}

function filterInventory(filter) {
  const rewards = window.__bebcomRewards || [];
  const box = document.getElementById('inventoryItems');

  document.querySelectorAll('.inventory-tab').forEach(btn => btn.classList.remove('active'));

  const clicked = Array.from(document.querySelectorAll('.inventory-tab')).find(btn => {
    if (filter === 'available') return btn.textContent.includes('Disponíveis');
    if (filter === 'used') return btn.textContent.includes('Usados');
    return btn.textContent.includes('Todos');
  });

  clicked?.classList.add('active');

  let items = rewards;

  if (filter === 'available') {
    items = rewards.filter(reward => (reward.status || 'available') === 'available');
  }

  if (filter === 'used') {
    items = rewards.filter(reward => (reward.status || 'available') !== 'available');
  }

  if (box) {
    box.innerHTML = renderInventoryItems(items);
  }
}

function getArtifactIcon(title = '') {
  const key = title.toLowerCase();

  if (key.includes('gin') || key.includes('copão') || key.includes('copo')) return '🍹';
  if (key.includes('monster') || key.includes('energy') || key.includes('big')) return '⚡';
  if (key.includes('heineken') || key.includes('cerveja') || key.includes('beer')) return '🍺';
  if (key.includes('gelo')) return '🧊';
  if (key.includes('churrasco') || key.includes('carvão')) return '🔥';
  if (key.includes('doce') || key.includes('chocolate')) return '🍬';
  if (key.includes('refri') || key.includes('coca')) return '🥤';

  return '🎁';
}

function showArtifactUnlock(reward) {
  const overlay = document.getElementById('universeRewardOverlay');
  if (!overlay) return;

  overlay.innerHTML = `
    <div class="artifact-unlock-box">
      <div class="artifact-unlock-aura"></div>
      <div class="artifact-unlock-label">✨ Artefato desbloqueado</div>
      <div class="artifact-unlock-icon">${getArtifactIcon(reward.title)}</div>
      <h2>${reward.title || 'Artefato Bebcom'}</h2>
      <p>${reward.description || 'Sua recompensa está pronta para retirada na Base Bebcom.'}</p>

      <div class="artifact-unlock-code">
        <span>Código de retirada</span>
        <strong>${reward.code || 'DISPONÍVEL'}</strong>
      </div>

      <div class="reward-location">🏢 Base Bebcom • Retirada na loja física</div>
      <button class="btn-primary" onclick="closeUniverseReward()">Guardar no Inventário</button>
    </div>
  `;

  overlay.classList.add('active');
}

function renderScans(scans) {
  const box = document.getElementById('scansList');
  if (!box) return;

  if (!scans.length) {
    box.innerHTML = '<p class="small">Nenhum código escaneado ainda.</p>';
    return;
  }

  box.innerHTML = scans.map(scan => `
    <div class="scan">
      <strong>${scan.product}</strong>
      <p class="small">+${scan.xp} XP • ${new Date(scan.createdAt).toLocaleString('pt-BR')}</p>
    </div>
  `).join('');
}
