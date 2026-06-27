window.addEventListener('load', async () => {
  startClubIntro();

  const saved = getSession();
  const savedAvatar = getSavedAvatar();

  if (saved?.phone) {
    currentUser = saved;
    selectedAvatar = savedAvatar;

    document.getElementById('loginCard')?.classList.add('hidden');

    if (!savedAvatar) {
      setTimeout(() => openAvatarStage(false), 5400);
      return;
    }

    document.getElementById('dashboardCard')?.classList.remove('hidden');

    await loadProfile();
    await loadMissions();
  }
});
