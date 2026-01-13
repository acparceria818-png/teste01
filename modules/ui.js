// modules/ui.js - Gerenciamento de interface
export function showToast(type, title, message, duration = 5000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${icons[type] || icons.info}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Fechar notificação">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Remover automaticamente após a duração
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 300);
    }
  }, duration);
}

export function showLoading(message = 'Carregando...') {
  const overlay = document.getElementById('loadingOverlay');
  const text = document.getElementById('loadingText');
  
  if (overlay) overlay.style.display = 'flex';
  if (text) text.textContent = message;
}

export function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

export function mostrarTela(id) {
  console.log('🔄 Mostrando tela:', id);
  
  // Anunciar mudança para leitores de tela
  const liveRegion = document.getElementById('liveRegion') || createLiveRegion();
  liveRegion.textContent = `Navegando para ${getTelaNome(id)}`;
  
  // Esconder todas as telas
  document.querySelectorAll('.tela').forEach(tela => {
    tela.classList.add('hidden');
    tela.classList.remove('ativa');
    tela.setAttribute('aria-hidden', 'true');
  });
  
  // Mostrar tela alvo
  const alvo = document.getElementById(id);
  if (!alvo) {
    console.error('Tela não encontrada:', id);
    return;
  }
  
  alvo.classList.remove('hidden');
  alvo.classList.add('ativa');
  alvo.setAttribute('aria-hidden', 'false');
  
  // Focar no primeiro elemento interativo
  setTimeout(() => {
    const focusable = alvo.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }, 100);
  
  // Executar ações específicas da tela
  switch(id) {
    case 'tela-gestor-dashboard':
      atualizarStatsGestor();
      break;
    case 'tela-usuario':
      criarCardsUsuario();
      break;
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getTelaNome(id) {
  const nomes = {
    'welcome': 'Tela inicial',
    'telaEscolhaPerfil': 'Seleção de perfil',
    'tela-usuario-login': 'Login do colaborador',
    'tela-usuario': 'Dashboard do colaborador',
    'tela-gestor-login': 'Login do gestor',
    'tela-gestor-dashboard': 'Painel do gestor',
    'tela-formulario': 'Formulário',
    'tela-sos': 'Emergência SOS'
  };
  return nomes[id] || 'Tela desconhecida';
}

function createLiveRegion() {
  const liveRegion = document.createElement('div');
  liveRegion.id = 'liveRegion';
  liveRegion.className = 'sr-only';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  document.body.appendChild(liveRegion);
  return liveRegion;
}

export function updateUserStatus(nome, matricula, funcao) {
  const userStatus = document.getElementById('userStatus');
  const userName = document.getElementById('userName');
  const colaboradorNome = document.getElementById('colaboradorNome');
  const colaboradorMatricula = document.getElementById('colaboradorMatricula');
  const colaboradorFuncao = document.getElementById('colaboradorFuncao');
  
  if (userStatus) {
    userStatus.style.display = 'flex';
    userStatus.setAttribute('aria-label', `Usuário: ${nome}, Matrícula: ${matricula}`);
  }
  
  if (userName) userName.textContent = nome;
  if (colaboradorNome) colaboradorNome.textContent = nome;
  if (colaboradorMatricula) colaboradorMatricula.textContent = matricula;
  if (colaboradorFuncao) {
    colaboradorFuncao.textContent = funcao || 'Não informada';
  }
}

export function criarCardsUsuario() {
  const container = document.getElementById('cardsUsuario');
  if (!container) return;
  
  // Remover skeletons
  container.innerHTML = '';
  
  const cards = [
    {
      titulo: 'Informe de Evento',
      descricao: 'Registro de eventos de segurança',
      url: 'https://forms.gle/4kxcxyYX8wzdDyDt5',
      icone: 'fas fa-exclamation-triangle',
      cor: 'danger',
      tipo: 'emergencia'
    },
    {
      titulo: 'Radar Móvel',
      descricao: 'Registro de velocidade',
      url: 'https://forms.gle/BZahsh5ZAAVyixjx5',
      icone: 'fas fa-tachometer-alt',
      cor: 'warning',
      tipo: 'atencao'
    },
    {
      titulo: 'Flash Report',
      descricao: 'Relatório rápido de incidentes',
      url: 'https://forms.gle/9d6f4w7hcpyDSCCs5',
      icone: 'fas fa-bolt',
      cor: 'danger',
      tipo: 'emergencia'
    },
    {
      titulo: 'Avisos & Comunicados',
      descricao: 'Informações importantes',
      acao: 'mostrarAvisos',
      icone: 'fas fa-bullhorn',
      cor: 'info',
      tipo: 'informacao'
    },
    {
      titulo: 'Suporte WhatsApp',
      descricao: 'Contato de suporte técnico',
      acao: 'abrirSuporteWhatsApp',
      icone: 'fab fa-whatsapp',
      cor: 'success',
      tipo: 'sucesso'
    }
  ];
  
  cards.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.className = `feature-card card-${card.tipo}`;
    cardElement.tabIndex = 0;
    cardElement.setAttribute('role', 'button');
    cardElement.setAttribute('aria-label', `${card.titulo}: ${card.descricao}`);
    
    if (card.url) {
      cardElement.onclick = () => abrirFormularioInterno(card.url, card.titulo);
    } else if (card.acao) {
      cardElement.onclick = () => window[card.acao]();
    }
    
    // Suporte a teclado
    cardElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        cardElement.click();
      }
    });
    
    cardElement.innerHTML = `
      <div class="card-icon ${card.cor}">
        <i class="${card.icone}"></i>
      </div>
      <h3>${card.titulo}</h3>
      <p>${card.descricao}</p>
    `;
    
    container.appendChild(cardElement);
  });
}

export function atualizarStatsGestor() {
  const container = document.getElementById('statsGestor');
  if (!container) return;
  
  // Remover skeletons
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon primary">
        <i class="fas fa-users"></i>
      </div>
      <div class="stat-content">
        <h3 id="totalColaboradores">0</h3>
        <p>Colaboradores</p>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon warning">
        <i class="fas fa-bullhorn"></i>
      </div>
      <div class="stat-content">
        <h3 id="avisosAtivosCount">0</h3>
        <p>Avisos Ativos</p>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon info">
        <i class="fas fa-shield-alt"></i>
      </div>
      <div class="stat-content">
        <h3 id="usuariosOnline">0</h3>
        <p>Usuários Online</p>
      </div>
    </div>
  `;
}

export function mostrarBannerPWA() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner && !localStorage.getItem('pwa_banner_closed')) {
    banner.style.display = 'flex';
  }
}

// Suporte WhatsApp
window.abrirSuporteWhatsApp = function() {
  const telefone = '559392059914';
  const mensagem = encodeURIComponent('Olá! Preciso de suporte no Portal QSSMA.');
  const url = `https://wa.me/${telefone}?text=${mensagem}`;
  
  window.open(url, '_blank', 'noopener,noreferrer');
};
// modules/ui.js - Adicione esta função no final do arquivo
export function mostrarTela(idTela) {
  console.log(`🔄 Mostrando tela: ${idTela}`);
  
  // Esconder todas as telas
  const telas = document.querySelectorAll('.tela');
  telas.forEach(tela => {
    tela.classList.remove('ativa');
    tela.classList.add('hidden');
  });
  
  // Mostrar a tela solicitada
  const telaAlvo = document.getElementById(idTela);
  if (telaAlvo) {
    telaAlvo.classList.remove('hidden');
    telaAlvo.classList.add('ativa');
    
    // Rolar para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Focar no primeiro elemento interativo se for tela de login
    if (idTela.includes('login')) {
      setTimeout(() => {
        const primeiroInput = telaAlvo.querySelector('input');
        if (primeiroInput) primeiroInput.focus();
      }, 100);
    }
  } else {
    console.error(`❌ Tela não encontrada: ${idTela}`);
  }
}
