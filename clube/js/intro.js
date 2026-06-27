function startClubIntro() {
  const intro = document.getElementById('clubIntro');
  const introText = document.getElementById('introText');

  if (!intro || !introText) return;

  const messages = [
    'Inicializando portal...',
    'Sincronizando passaporte gamer...',
    'Carregando missões Bebcom...',
    'Ativando recompensas reais...',
    'Bem-vindo ao Universo Bebcom.'
  ];

  let index = 0;
  introText.innerText = messages[0];

  const interval = setInterval(() => {
    index++;

    if (messages[index]) {
      introText.innerText = messages[index];
    }

    if (index >= messages.length - 1) {
      clearInterval(interval);
    }
  }, 850);

  setTimeout(() => {
    intro.classList.add('hidden-intro');

    const saved = getSession();

    if (!saved?.phone) {
      setTimeout(() => {
        document.getElementById('aiGuide')?.classList.remove('hidden');
      }, 700);
    }
  }, 4700);
}
