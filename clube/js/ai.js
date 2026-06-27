const aiSteps = [
  'Bem-vindo ao Universo Bebcom.',
  'Eu sou a IA Bebcom, sua guia nesta jornada.',
  'Aqui cada compra pode virar XP, missão, conquista e recompensa real.',
  'Antes de liberar seu passaporte gamer, preciso conhecer você.',
  'Preencha seu nome e WhatsApp para iniciar sua jornada.'
];

let aiStepIndex = 0;

function nextAiStep() {
  const aiText = document.getElementById('aiText');
  const aiGuide = document.getElementById('aiGuide');
  const aiBtn = document.getElementById('aiNextBtn');

  aiStepIndex++;

  if (aiStepIndex < aiSteps.length) {
    aiText.innerText = aiSteps[aiStepIndex];

    if (aiStepIndex === aiSteps.length - 1) {
      aiBtn.innerText = 'Criar meu Passaporte';
    }

    return;
  }

  aiGuide.classList.add('hidden');
  document.getElementById('nameInput')?.focus();
}
