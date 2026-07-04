// =====================================================
// MÓDULO 13.1 — SISTEMA DE PERSONAGEM PERSISTENTE
// Substitui clube/js/avatar.js
// =====================================================

const BEBCOM_CHARACTERS = [
  { id: 'explorer_neon', name: 'Explorador Neon', origin: 'Base Bebcom', role: 'Explorador de Missões', color: '#dc2626', accent: '#f59e0b', planetAffinity: 'geral', symbol: '🚀', description: 'Equilibrado, corajoso e preparado para iniciar qualquer jornada no Universo Bebcom.' },
  { id: 'energy_guardian', name: 'Guardião da Energia', origin: 'Planeta Energia', role: 'Especialista em Energéticos', color: '#06b6d4', accent: '#fbbf24', planetAffinity: 'energéticos', symbol: '⚡', description: 'Ágil, elétrico e ideal para jogadores que buscam campanhas intensas e evolução rápida.' },
  { id: 'fire_forge', name: 'Forjado no Fogo', origin: 'Planeta Fogo', role: 'Mestre das Expedições de Churrasco', color: '#f97316', accent: '#ef4444', planetAffinity: 'carvão', symbol: '🔥', description: 'Resistente, forte e criado para missões longas, eventos especiais e grandes conquistas.' },
  { id: 'cosmic_runner', name: 'Corredor Cósmico', origin: 'Rotas da Velocidade', role: 'Caçador de Códigos', color: '#8b5cf6', accent: '#22d3ee', planetAffinity: 'drinks', symbol: '🌌', description: 'Misterioso, rápido e perfeito para quem gosta de QR Codes raros e missões surpresa.' },
  { id: 'base_titan', name: 'Titã da Base', origin: 'Base Bebcom', role: 'Guardião das Recompensas', color: '#10b981', accent: '#fbbf24', planetAffinity: 'geral', symbol: '🛡️', description: 'Leal, constante e feito para jogadores que querem construir uma grande história no Clube.' },
  { id: 'neon_captain', name: 'Capitão Neon', origin: 'Comando Orbital', role: 'Líder de Temporadas', color: '#2563eb', accent: '#ec4899', planetAffinity: 'geral', symbol: '👑', description: 'Carismático, estratégico e preparado para eventos, rankings e futuras missões cooperativas.' }
];

let avatarSelection = null;
let avatarOpenedFromDashboard = false;

function getCharacterStageByXp(xp = 0) {
  const totalXp = Number(xp || 0);

  if (totalXp >= 500) return { id: 'legend', label: 'Lenda Bebcom', tier: 6, nextXp: null };
  if (totalXp >= 400) return { id: 'commander', label: 'Comandante Bebcom', tier: 5, nextXp: 500 };
  if (totalXp >= 300) return { id: 'guardian', label: 'Guardião Bebcom', tier: 4, nextXp: 400 };
  if (totalXp >= 200) return { id: 'energy_guardian', label: 'Guardião da Energia', tier: 3, nextXp: 300 };
  if (totalXp >= 100) return { id: 'cadet', label: 'Cadete Bebcom', tier: 2, nextXp: 200 };

  return { id: 'explorer', label: 'Explorador', tier: 1, nextXp: 100 };
}

function getLocalCharacterFromAvatar(avatar) {
  if (!avatar) return BEBCOM_CHARACTERS[0];
  return BEBCOM_CHARACTERS.find(c => c.id === avatar.id || c.id === avatar.skin) || BEBCOM_CHARACTERS[0];
}

function renderBebcomCharacter(characterData = {}, options = {}) {
  const xp = Number(characterData?.progression?.xp || currentUser?.xp || 0);
  const stage = getCharacterStageByXp(xp);
  const level = Math.floor(xp / 100) + 1;
  const archetype = characterData?.archetype || getLocalCharacterFromAvatar(getSavedAvatar());
  const appearance = characterData?.appearance || {};
  const tier = Number(stage.tier || 1);

  const primary = appearance?.palette?.primary || archetype.color;
  const accent = appearance?.palette?.accent || archetype.accent;
  const aura = appearance?.aura && appearance.aura !== 'none';
  const companion = appearance?.companion && appearance.companion !== 'none';

  return `
    <div class="bebcom-character ${options.compact ? 'compact' : ''}" style="--char-primary:${primary};--char-accent:${accent};">
      <div class="char-aura ${aura ? 'active' : ''}"></div>
      <div class="char-platform"></div>
      ${companion ? `<div class="char-drone">◆</div>` : ''}
      <div class="char-body tier-${tier}">
        <div class="char-head"><div class="char-visor"></div><div class="char-symbol">${archetype.symbol || '🚀'}</div></div>
        <div class="char-neck"></div>
        <div class="char-torso"><div class="char-core"></div><div class="char-armor left"></div><div class="char-armor right"></div></div>
        <div class="char-arms"><span></span><span></span></div>
        <div class="char-legs"><span></span><span></span></div>
      </div>
      <div class="char-stage-badge">${stage.stageLabel || stage.label || getCharacterStage(level).label}</div>
    </div>
  `;
}

function renderAvatarCards() {
  const box = document.getElementById('avatarCards');
  if (!box) return;

  box.innerHTML = BEBCOM_CHARACTERS.map(character => {
    const previewCharacter = {
      archetype: character,
      progression: { level: 1, tier: 1, stageLabel: 'Explorador' },
      appearance: { palette: { primary: character.color, accent: character.accent } }
    };

    return `
      <article class="avatar-card character-card" data-avatar-id="${character.id}" style="--avatar-color:${character.color};--avatar-accent:${character.accent};" onclick="selectAvatar('${character.id}')">
        ${renderBebcomCharacter(previewCharacter, { compact: true })}
        <h3>${character.name}</h3>
        <div class="avatar-role">${character.role}</div>
        <div class="character-origin">Origem: ${character.origin}</div>
        <p>${character.description}</p>
      </article>
    `;
  }).join('');
}

function openAvatarStage(fromDashboard = false) {
  avatarOpenedFromDashboard = fromDashboard;
  avatarSelection = null;
  renderAvatarCards();
  document.getElementById('avatarStage')?.classList.remove('hidden');
  document.getElementById('confirmAvatarBtn').disabled = true;
  document.getElementById('selectedAvatarInfo').innerText = 'Escolha a origem do seu personagem no Universo Bebcom.';
}

function closeAvatarStage() {
  document.getElementById('avatarStage')?.classList.add('hidden');
}

function selectAvatar(avatarId) {
  avatarSelection = BEBCOM_CHARACTERS.find(a => a.id === avatarId);

  document.querySelectorAll('.avatar-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.avatarId === avatarId);
  });

  document.getElementById('selectedAvatarInfo').innerHTML = `
    <strong>${avatarSelection.symbol} ${avatarSelection.name}</strong><br>
    ${avatarSelection.role}<br>
    <span class="small">Origem: ${avatarSelection.origin}</span><br>
    <span class="small">${avatarSelection.description}</span>
  `;

  document.getElementById('confirmAvatarBtn').disabled = false;
}

async function confirmAvatarSelection() {
  if (!avatarSelection) return;

  saveAvatar({
    id: avatarSelection.id,
    name: avatarSelection.name,
    role: avatarSelection.role,
    color: avatarSelection.color,
    accent: avatarSelection.accent,
    symbol: avatarSelection.symbol,
    origin: avatarSelection.origin
  });

  selectedAvatar = avatarSelection;

  if (currentUser?.phone) {
    try {
      const response = await fetch(`${API_BASE}/api/clube/personagem/selecionar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: currentUser.phone, archetypeId: avatarSelection.id })
      });

      const data = await response.json();

      if (data.success) {
        currentUser.character = data.character;
        saveSession(currentUser);
      }
    } catch (error) {
      console.warn('Personagem salvo apenas localmente por enquanto:', error);
    }
  }

  closeAvatarStage();
  applyAvatarToDashboard();

  if (!avatarOpenedFromDashboard) showDashboardAfterAvatar();
}

function applyAvatarToDashboard() {
  const avatar = getSavedAvatar() || selectedAvatar;
  const character = currentUser?.character || null;

  const dashAvatar = document.getElementById('dashboardAvatar');
  const avatarName = document.getElementById('avatarName');

  if (dashAvatar) {
    dashAvatar.innerHTML = renderBebcomCharacter(character, { compact: true });
    dashAvatar.classList.add('avatar-character-shell');
    dashAvatar.style.background = 'transparent';
    dashAvatar.style.boxShadow = 'none';
  }

  if (avatarName) {
    const archetype = character?.archetype || getLocalCharacterFromAvatar(avatar);
    const progression = character?.progression || getCharacterStage(currentUser?.level || 1);
    avatarName.innerText = `${archetype.name} • ${progression.stageLabel || progression.label || 'Explorador'}`;
  }
}

function showDashboardAfterAvatar() {
  document.getElementById('loginCard')?.classList.add('hidden');
  document.getElementById('dashboardCard')?.classList.remove('hidden');
  loadProfile();
  loadMissions();
}

function showCharacterEvolutionOverlay(evolution = {}, character = null) {
  const overlay = document.getElementById('universeRewardOverlay');
  if (!overlay) return;

  const char = character || currentUser?.character;
  const title = evolution?.title || char?.progression?.stageLabel || 'Nova evolução';

  overlay.innerHTML = `
    <div class="character-evolution-box">
      <div class="character-evolution-aura"></div>
      <div class="character-evolution-kicker">🌌 EVOLUÇÃO DO PERSONAGEM</div>
      ${renderBebcomCharacter(char)}
      <h2>${title}</h2>
      <p>Seu personagem evoluiu dentro do Universo Bebcom.</p>
      <div class="character-unlocks">${(evolution?.unlocked || []).slice(-4).map(item => `<span>✨ ${formatEquipmentName(item)}</span>`).join('')}</div>
      <button class="btn-primary" onclick="closeUniverseReward()">Continuar Jornada</button>
    </div>
  `;

  overlay.classList.add('active');
}

function formatEquipmentName(item = '') {
  return String(item).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

window.renderBebcomCharacter = renderBebcomCharacter;
window.showCharacterEvolutionOverlay = showCharacterEvolutionOverlay;
