async function loginClube() {
  const name = document.getElementById('nameInput').value.trim();
  const phone = onlyNumbers(document.getElementById('phoneInput').value);

  if (!phone || phone.length < 10) {
    alert('Informe um WhatsApp válido com DDD.');
    return;
  }

  const response = await fetch(`${API_BASE}/api/clube/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  await loadMissions();
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
  const xpPercent = Math.min((xp % 100), 100);

  document.getElementById('xpFill').style.width = `${xpPercent}%`;
  document.getElementById('xpText').innerText = `${xp} XP`;
  document.getElementById('levelText').innerText = level;
  document.getElementById('scanText').innerText = currentUser.stats?.scans || 0;
  document.getElementById('rewardText').innerText = currentUser.stats?.rewardsUnlocked || 0;

  applyAvatarToDashboard();
  renderRewards(data.rewards || []);
  renderScans(data.scans || []);
}

async function loadMissions() {
  const response = await fetch(`${API_BASE}/api/clube/missoes`);
  const data = await response.json();

  const box = document.getElementById('missionsList');

  if (!data.success || !data.missions?.length) {
    box.innerHTML = `
      <div class="mission">
        <h4>🔥 Primeira Jornada Bebcom</h4>
        <p class="small">Acumule 100 XP para desbloquear sua primeira recompensa.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = data.missions.map(m => `
    <div class="mission">
      <h4>${m.title}</h4>
      <p class="small">${m.description || ''}</p>
      <p class="small">Meta: ${m.targetXp || 100} XP</p>
      <p class="small">Prêmio: ${m.rewardTitle || 'Recompensa Bebcom'}</p>
    </div>
  `).join('');
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
    headers: { 'Content-Type': 'application/json' },
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
    Nível atual: <strong>${data.newLevel}</strong>
  `;

  if (data.reward) {
    message += `<br><br>🎁 Recompensa desbloqueada: <strong>${data.reward.title}</strong>`;
  }

  showNotice('scanResult', message, 'success');

  document.getElementById('qrInput').value = '';

  await loadProfile();
}

function renderRewards(rewards) {
  const box = document.getElementById('rewardsList');

  if (!rewards.length) {
    box.innerHTML = '<p class="small">Nenhuma recompensa ainda.</p>';
    return;
  }

  box.innerHTML = rewards.map(r => `
    <div class="reward">
      <h4>🎁 ${r.title}</h4>
      <p class="small">${r.description || ''}</p>
      <p class="small">Cupom: <strong>${r.code}</strong></p>
      ${r.deliveryUrl ? `<a class="button-link btn-secondary" href="${r.deliveryUrl}">Usar no Delivery</a>` : ''}
    </div>
  `).join('');
}

function renderScans(scans) {
  const box = document.getElementById('scansList');

  if (!scans.length) {
    box.innerHTML = '<p class="small">Nenhum código escaneado ainda.</p>';
    return;
  }

  box.innerHTML = scans.map(s => `
    <div class="scan">
      <strong>${s.product}</strong>
      <p class="small">+${s.xp} XP • ${new Date(s.createdAt).toLocaleString('pt-BR')}</p>
    </div>
  `).join('');
}
