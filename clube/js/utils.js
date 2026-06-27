function onlyNumbers(value) {
  return String(value || '').replace(/\D/g, '');
}

function saveSession(user) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
  } catch {
    return null;
  }
}

function saveAvatar(avatar) {
  localStorage.setItem(STORAGE_KEYS.AVATAR, JSON.stringify(avatar));
}

function getSavedAvatar() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AVATAR));
  } catch {
    return null;
  }
}

function showNotice(targetId, message, type = 'success') {
  const target = document.getElementById(targetId);

  if (!target) return;

  target.innerHTML = `<div class="notice ${type}">${message}</div>`;
}

function logoutClube() {
  if (!confirm('Deseja realmente sair do Clube Bebcom?')) {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.AVATAR);

  currentUser = null;
  selectedAvatar = null;

  location.reload();
}
