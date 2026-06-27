const BEBCOM_AVATARS = [
  {
    id: 'ranger-neon',
    name: 'Ranger Neon',
    emoji: '🧑‍🚀',
    role: 'Explorador de Missões',
    color: '#dc2626',
    description: 'Corajoso, intenso e movido por desafios. Ideal para quem quer completar missões e evoluir rápido.'
  },
  {
    id: 'capita-aurora',
    name: 'Capitã Aurora',
    emoji: '👩‍✈️',
    role: 'Líder de Campanhas',
    color: '#2563eb',
    description: 'Estratégica e carismática. Uma personagem preparada para eventos, temporadas e conquistas especiais.'
  },
  {
    id: 'forge',
    name: 'Forge',
    emoji: '🛠️',
    role: 'Mestre dos Equipamentos',
    color: '#f59e0b',
    description: 'Criativo e técnico. Representa evolução, itens, melhorias e desbloqueios dentro do Universo Bebcom.'
  },
  {
    id: 'nyx',
    name: 'Nyx',
    emoji: '🥷',
    role: 'Caçador de Códigos',
    color: '#8b5cf6',
    description: 'Silencioso e misterioso. Especialista em códigos secretos, QR Codes raros e missões ocultas.'
  },
  {
    id: 'titan',
    name: 'Titan',
    emoji: '🛡️',
    role: 'Guardião Bebcom',
    color: '#10b981',
    description: 'Forte e leal. Representa constância, presença e participação em desafios longos.'
  },
  {
    id: 'pulse',
    name: 'Pulse',
    emoji: '⚡',
    role: 'Mensageiro da Velocidade',
    color: '#06b6d4',
    description: 'Ágil e energético. Combina com clientes que participam sempre e gostam de novidades rápidas.'
  }
];

let avatarSelection = null;
let avatarOpenedFromDashboard = false;

function renderAvatarCards() {
  const box = document.getElementById('avatarCards');
  if (!box) return;

  box.innerHTML = BEBCOM_AVATARS.map(avatar => `
    <article
      class="avatar-card"
      data-avatar-id="${avatar.id}"
      style="--avatar-color:${avatar.color}"
      onclick="selectAvatar('${avatar.id}')">

      <div class="avatar-pod">${avatar.emoji}</div>
      <h3>${avatar.name}</h3>
      <div class="avatar-role">${avatar.role}</div>
      <p>${avatar.description}</p>
    </article>
  `).join('');
}

function openAvatarStage(fromDashboard = false) {
  avatarOpenedFromDashboard = fromDashboard;
  avatarSelection = null;

  renderAvatarCards();

  document.getElementById('avatarStage')?.classList.remove('hidden');
  document.getElementById('confirmAvatarBtn').disabled = true;
  document.getElementById('selectedAvatarInfo').innerText = 'Toque em um personagem para visualizar.';
}

function closeAvatarStage() {
  document.getElementById('avatarStage')?.classList.add('hidden');
}

function selectAvatar(avatarId) {
  avatarSelection = BEBCOM_AVATARS.find(a => a.id === avatarId);

  document.querySelectorAll('.avatar-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.avatarId === avatarId);
  });

  const info = document.getElementById('selectedAvatarInfo');
  const btn = document.getElementById('confirmAvatarBtn');

  info.innerHTML = `
    <strong>${avatarSelection.emoji} ${avatarSelection.name}</strong><br>
    ${avatarSelection.role}<br>
    <span class="small">${avatarSelection.description}</span>
  `;

  btn.disabled = false;
}

function confirmAvatarSelection() {
  if (!avatarSelection) return;

  saveAvatar(avatarSelection);
  selectedAvatar = avatarSelection;

  closeAvatarStage();
  applyAvatarToDashboard();

  if (!avatarOpenedFromDashboard) {
    showDashboardAfterAvatar();
  }
}

function applyAvatarToDashboard() {
  const avatar = getSavedAvatar() || selectedAvatar;
  if (!avatar) return;

  const dashAvatar = document.getElementById('dashboardAvatar');
  const avatarName = document.getElementById('avatarName');

  if (dashAvatar) {
    dashAvatar.innerText = avatar.emoji;
    dashAvatar.style.background = `
      radial-gradient(circle at 35% 25%, #fff, transparent 18%),
      linear-gradient(135deg, ${avatar.color}, #111827)
    `;
    dashAvatar.style.boxShadow = `0 0 44px ${avatar.color}66`;
  }

  if (avatarName) {
    avatarName.innerText = `${avatar.name} • ${avatar.role}`;
  }
}

function showDashboardAfterAvatar() {
  document.getElementById('loginCard')?.classList.add('hidden');
  document.getElementById('dashboardCard')?.classList.remove('hidden');

  loadProfile();
  loadMissions();
}
