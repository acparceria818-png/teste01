// app.js - PORTAL QSSMA COMPLETO
import { 
  db,
  auth,
  doc,
  getDoc,
  getColaborador,
  registrarAviso,
  getAvisos,
  updateAviso,
  deleteAviso,
  monitorarAvisos,
  getEstatisticasDashboard,
  loginEmailSenha
} from './firebase.js';

// Estado global do aplicativo
let estadoApp = {
  usuario: null,
  gestor: null,
  perfil: null,
  isOnline: navigator.onLine,
  avisosAtivos: [],
  unsubscribeAvisos: null,
  estatisticas: null,
  modoExterno: false,
  modoExternoAlternativo: false,
  formularioAtivo: false
};

// Dicas de segurança DDS (Diálogo Diário de Segurança)
const DICAS_SEGURANCA = [
  {
    data: new Date().toLocaleDateString('pt-BR'),
    tema: "Uso de EPIs",
    titulo: "Verifique seus EPIs diariamente",
    mensagem: "Antes de iniciar o trabalho, verifique o estado de conservação de todos os seus Equipamentos de Proteção Individual. Capacete, óculos, luvas e calçados de segurança devem estar em perfeito estado.",
    checklist: [
      "Capacete sem rachaduras",
      "Óculos de proteção limpos",
      "Luvas adequadas à atividade",
      "Calçados de segurança com solado antiderrapante"
    ]
  },
  {
    data: new Date().toLocaleDateString('pt-BR'),
    tema: "Trabalho em Altura",
    titulo: "Sistemas de proteção contra quedas",
    mensagem: "Sempre use cinto de segurança tipo paraquedista quando trabalhar em altura acima de 2 metros. Verifique os pontos de ancoragem antes de usar.",
    checklist: [
      "Cinto de segurança inspecionado",
      "Pontos de ancoragem seguros",
      "Escadas em bom estado",
      "Área sinalizada abaixo"
    ]
  },
  {
    data: new Date().toLocaleDateString('pt-BR'),
    tema: "Sinalização",
    titulo: "Mantenha a área bem sinalizada",
    mensagem: "Toda área de risco deve estar devidamente sinalizada com placas de advertência, perigo e obrigação. Reporte placas danificadas ou faltantes.",
    checklist: [
      "Placas visíveis e legíveis",
      "Fitas de delimitação intactas",
      "Sinalização luminosa funcionando",
      "Conex e barreiras posicionadas"
    ]
  }
];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Portal QSSMA - Inicializando...');
  
  // Verificar sessão existente
  verificarSessao();
  
  // Inicializar funcionalidades
  initDarkMode();
  initContrastMode();
  initPWA();
  initEventListeners();
  initConnectionMonitor();
  initAvisos();
  initPanicButton();
  initExternalMode();
  
  console.log('✅ Portal QSSMA inicializado com sucesso');
});

// ========== MODO EXTERNO (ALTO CONTRASTE) ==========
function initExternalMode() {
  const externalModeBtn = document.getElementById('externalModeBtn');
  const contrastToggle = document.getElementById('contrastToggle');
  
  // Verificar preferência salva
  const modoExternoSalvo = localStorage.getItem('qssma_modo_externo');
  const modoAlternativoSalvo = localStorage.getItem('qssma_modo_alternativo');
  
  if (modoExternoSalvo === 'true') {
    estadoApp.modoExterno = true;
    estadoApp.modoExternoAlternativo = modoAlternativoSalvo === 'true';
    aplicarModoExterno();
  }
  
  if (externalModeBtn) {
    externalModeBtn.addEventListener('click', toggleExternalMode);
  }
  
  if (contrastToggle) {
    contrastToggle.addEventListener('click', toggleContrastMode);
  }
}

window.toggleExternalMode = function() {
  estadoApp.modoExterno = !estadoApp.modoExterno;
  
  if (estadoApp.modoExterno) {
    // Alternar entre os dois modos de alto contraste
    estadoApp.modoExternoAlternativo = !estadoApp.modoExternoAlternativo;
  }
  
  aplicarModoExterno();
  salvarPreferenciasModo();
  
  mostrarNotificacao(
    '🌞 Modo Externo', 
    estadoApp.modoExterno ? 
      (estadoApp.modoExternoAlternativo ? 'Modo Preto/Amarelo ativado' : 'Modo Branco/Preto ativado') :
      'Modo normal ativado'
  );
};

window.toggleContrastMode = function() {
  estadoApp.modoExterno = true;
  estadoApp.modoExternoAlternativo = !estadoApp.modoExternoAlternativo;
  
  aplicarModoExterno();
  salvarPreferenciasModo();
  
  mostrarNotificacao(
    '🎨 Contraste', 
    estadoApp.modoExternoAlternativo ? 
      'Modo Preto/Amarelo (Alto Contraste)' :
      'Modo Branco/Preto (Alto Contraste)'
  );
};

function aplicarModoExterno() {
  const body = document.body;
  
  if (estadoApp.modoExterno) {
    body.classList.add('modo-externo');
    if (estadoApp.modoExternoAlternativo) {
      body.classList.add('alternativo');
    } else {
      body.classList.remove('alternativo');
    }
  } else {
    body.classList.remove('modo-externo', 'alternativo');
  }
  
  // Atualizar ícone do botão
  const externalModeBtn = document.getElementById('externalModeBtn');
  const contrastToggle = document.getElementById('contrastToggle');
  
  if (externalModeBtn) {
    if (estadoApp.modoExterno) {
      externalModeBtn.innerHTML = estadoApp.modoExternoAlternativo ? 
        '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
      externalModeBtn.style.background = estadoApp.modoExternoAlternativo ?
        'linear-gradient(135deg, #000000, #333333)' :
        'linear-gradient(135deg, #ffffff, #f0f0f0)';
      externalModeBtn.style.color = estadoApp.modoExternoAlternativo ? '#ffff00' : '#000000';
    } else {
      externalModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
      externalModeBtn.style.background = 'linear-gradient(135deg, #ffcc00, #ff9900)';
      externalModeBtn.style.color = '#000';
    }
  }
  
  if (contrastToggle) {
    contrastToggle.style.display = estadoApp.modoExterno ? 'flex' : 'flex';
  }
}

function salvarPreferenciasModo() {
  localStorage.setItem('qssma_modo_externo', estadoApp.modoExterno);
  localStorage.setItem('qssma_modo_alternativo', estadoApp.modoExternoAlternativo);
}

function initContrastMode() {
  const contrastToggle = document.getElementById('contrastToggle');
  if (contrastToggle) {
    contrastToggle.style.display = 'flex';
  }
}

// ========== BOTÃO DE PÂNICO ==========
function initPanicButton() {
  const panicBtn = document.getElementById('panicBtn');
  
  // Verificar se estamos em uma tela de login
  function atualizarVisibilidadePanicButton() {
    const telaAtiva = document.querySelector('.tela.ativa');
    const telaId = telaAtiva ? telaAtiva.id : '';
    
    // Esconder em telas de login/boas-vindas
    const esconderEm = ['welcome', 'telaEscolhaPerfil', 'tela-usuario-login', 'tela-gestor-login'];
    
    if (panicBtn) {
      if (esconderEm.includes(telaId) || estadoApp.formularioAtivo) {
        panicBtn.style.display = 'none';
      } else {
        panicBtn.style.display = 'flex';
      }
    }
  }
  
  // Observar mudanças de tela
  const observer = new MutationObserver(atualizarVisibilidadePanicButton);
  observer.observe(document.body, { 
    attributes: true, 
    attributeFilter: ['class'],
    subtree: true 
  });
  
  atualizarVisibilidadePanicButton();
}

window.abrirEmergencia = function() {
  openModal('emergenciaModalBack');
  
  // Vibrar se suportado
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
  
  // Tocar som de alerta (opcional)
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio não suportado:', e);
  }
};

window.ligarEmergencia = function(numero) {
  if (confirm(`Ligar para ${numero}?\n\nEsta ação abrirá o discador do seu telefone.`)) {
    window.open(`tel:${numero}`, '_self');
  }
};

// ========== FORMULÁRIOS INTERNOS ==========
window.abrirFormularioInterno = function(url, titulo) {
  estadoApp.formularioAtivo = true;
  
  // Atualizar título
  document.getElementById('formularioTitulo').textContent = titulo;
  document.getElementById('formularioDescricao').textContent = 'Preencha o formulário abaixo';
  
  // Mostrar loading
  document.getElementById('formLoading').style.display = 'flex';
  
  // Configurar iframe
  const iframe = document.getElementById('formularioIframe');
  iframe.style.display = 'none';
  iframe.src = url;
  
  // Quando o iframe carregar
  iframe.onload = function() {
    document.getElementById('formLoading').style.display = 'none';
    iframe.style.display = 'block';
  };
  
  // Mostrar tela de formulário
  mostrarTela('tela-formulario-interno');
  
  // Mostrar botão voltar
  document.getElementById('backFromFormBtn').classList.add('visible');
  
  // Esconder botão de pânico
  document.getElementById('panicBtn').style.display = 'none';
};

window.fecharFormulario = function() {
  estadoApp.formularioAtivo = false;
  
  // Limpar iframe
  const iframe = document.getElementById('formularioIframe');
  iframe.src = '';
  iframe.style.display = 'none';
  
  // Esconder botão voltar
  document.getElementById('backFromFormBtn').classList.remove('visible');
  
  // Voltar para tela anterior
  if (estadoApp.perfil === 'usuario') {
    mostrarTela('tela-usuario');
  } else if (estadoApp.perfil === 'gestor') {
    mostrarTela('tela-gestor-dashboard');
  }
};

// ========== DICAS DE SEGURANÇA ==========
window.mostrarDicasSeguranca = function() {
  const dicaIndex = Math.floor(Math.random() * DICAS_SEGURANCA.length);
  const dica = DICAS_SEGURANCA[dicaIndex];
  
  document.getElementById('ddsData').textContent = dica.data;
  document.getElementById('ddsTema').textContent = dica.tema;
  document.getElementById('ddsTitulo').textContent = dica.titulo;
  document.getElementById('ddsMensagem').innerHTML = `<p>${dica.mensagem}</p>`;
  
  // Limpar checklist anterior
  const checklistContainer = document.querySelector('.dds-checklist');
  const checklistItems = checklistContainer.querySelectorAll('.checklist-item');
  checklistItems.forEach(item => item.remove());
  
  // Adicionar novos itens
  const checklistDiv = checklistContainer.querySelector('.checklist-item').parentNode;
  dica.checklist.forEach((item, index) => {
    const checklistItem = document.createElement('div');
    checklistItem.className = 'checklist-item';
    checklistItem.innerHTML = `
      <input type="checkbox" id="check${index}">
      <label for="check${index}">${item}</label>
    `;
    checklistDiv.appendChild(checklistItem);
  });
  
  openModal('dicasModalBack');
};

window.marcarDDSLido = function() {
  const hoje = new Date().toLocaleDateString('pt-BR');
  localStorage.setItem(`dds_lido_${hoje}`, 'true');
  
  mostrarNotificacao('✅ DDS Registrado', 'Diálogo diário de segurança registrado com sucesso!');
  closeModal('dicasModalBack');
};

// ========== GERENCIAMENTO DE SESSÃO ==========
function verificarSessao() {
  const perfil = localStorage.getItem('perfil_ativo');
  const matricula = localStorage.getItem('usuario_matricula');
  const nome = localStorage.getItem('usuario_nome');
  const gestorLogado = localStorage.getItem('gestor_logado');
  
  if (perfil === 'usuario' && matricula && nome) {
    estadoApp.usuario = { 
      matricula, 
      nome,
      funcao: localStorage.getItem('usuario_funcao') || 'Não informada'
    };
    estadoApp.perfil = 'usuario';
    mostrarTela('tela-usuario');
    updateUserStatus(nome, matricula);
    iniciarMonitoramentoAvisos();
  } else if (perfil === 'gestor' && gestorLogado) {
    estadoApp.perfil = 'gestor';
    estadoApp.gestor = { 
      nome: 'Gestor',
      email: localStorage.getItem('gestor_email')
    };
    mostrarTela('tela-gestor-dashboard');
    iniciarMonitoramentoAvisos();
    carregarEstatisticasGestor();
  }
}

function updateUserStatus(nome, matricula) {
  const userStatus = document.getElementById('userStatus');
  const userName = document.getElementById('userName');
  const colaboradorNome = document.getElementById('colaboradorNome');
  const colaboradorMatricula = document.getElementById('colaboradorMatricula');
  const colaboradorFuncao = document.getElementById('colaboradorFuncao');
  
  if (userStatus) userStatus.style.display = 'flex';
  if (userName) userName.textContent = nome;
  if (colaboradorNome) colaboradorNome.textContent = nome;
  if (colaboradorMatricula) colaboradorMatricula.textContent = matricula;
  if (colaboradorFuncao) {
    colaboradorFuncao.textContent = localStorage.getItem('usuario_funcao') || 'Não informada';
  }
}

// ========== SELEÇÃO DE PERFIL ==========
window.entrarNoPortal = function () {
  mostrarTela('telaEscolhaPerfil');
};

window.selecionarPerfil = function (perfil) {
  console.log('👤 Perfil selecionado:', perfil);
  estadoApp.perfil = perfil;
  localStorage.setItem('perfil_ativo', perfil);

  if (perfil === 'usuario') {
    mostrarTela('tela-usuario-login');
  } else if (perfil === 'gestor') {
    mostrarTela('tela-gestor-login');
  }
};

// ========== LOGIN USUÁRIO - COM VALIDAÇÃO MELHORADA ==========
window.confirmarMatriculaUsuario = async function () {
  showLoading('🔍 Validando matrícula...');
  
  const input = document.getElementById('matriculaUsuario');
  const loginBtn = document.getElementById('loginUsuarioBtn');
  
  if (!input) {
    alert('Campo de matrícula não encontrado');
    hideLoading();
    return;
  }

  const matricula = input.value.trim().toUpperCase();

  if (!matricula) {
    alert('Informe sua matrícula');
    input.focus();
    hideLoading();
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Validando...';
    
    const snap = await getColaborador(matricula);

    if (!snap.exists()) {
      // Mensagem clara e útil para o usuário
      alert('❌ Matrícula não encontrada.\n\n📋 Por favor, verifique:\n1. Se digitou corretamente\n2. Se já está cadastrado no sistema\n\n👥 Caso o problema persista, procure:\n• O RH da empresa\n• O Gestor de QSSMA\n• Seu supervisor imediato');
      input.focus();
      input.select();
      return;
    }

    const dados = snap.data();

    if (!dados.ativo) {
      alert('❌ Colaborador inativo.\n\nEntre em contato com o RH ou Gestor de QSSMA para regularizar sua situação.');
      return;
    }

    localStorage.setItem('usuario_matricula', matricula);
    localStorage.setItem('usuario_nome', dados.nome);
    localStorage.setItem('usuario_funcao', dados.funcao || 'Não informada');
    localStorage.setItem('usuario_email', dados.email || '');
    localStorage.setItem('perfil_ativo', 'usuario');
    
    estadoApp.usuario = { 
      matricula, 
      nome: dados.nome,
      funcao: dados.funcao || 'Não informada',
      email: dados.email || ''
    };
    
    updateUserStatus(dados.nome, matricula);
    mostrarTela('tela-usuario');
    iniciarMonitoramentoAvisos();
    
    console.log('✅ Colaborador autenticado:', dados.nome);
    mostrarNotificacao('✅ Login realizado', `Bem-vindo(a), ${dados.nome}!`);

  } catch (erro) {
    console.error('Erro Firebase:', erro);
    alert('❌ Erro ao validar matrícula.\n\nVerifique sua conexão com a internet e tente novamente.\n\nSe o problema persistir, contate o suporte técnico.');
  } finally {
    hideLoading();
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    }
  }
};

// ========== LOGIN GESTOR ==========
window.loginGestor = async function () {
  const email = document.getElementById('gestorEmail').value;
  const senha = document.getElementById('gestorSenha').value;
  
  if (!email || !senha) {
    alert('Preencha e-mail e senha');
    return;
  }
  
  showLoading('🔐 Autenticando gestor...');
  
  try {
    const user = await loginEmailSenha(email, senha);
    
    localStorage.setItem('gestor_logado', 'true');
    localStorage.setItem('gestor_email', email);
    localStorage.setItem('gestor_uid', user.uid);
    localStorage.setItem('perfil_ativo', 'gestor');
    
    estadoApp.gestor = { 
      email, 
      uid: user.uid,
      nome: 'Gestor QSSMA'
    };
    
    mostrarTela('tela-gestor-dashboard');
    iniciarMonitoramentoAvisos();
    carregarEstatisticasGestor();
    
    console.log('✅ Gestor logado com sucesso');
    mostrarNotificacao('✅ Acesso Gestor', 'Painel administrativo liberado');
    
  } catch (erro) {
    console.error('Erro no login gestor:', erro);
    alert(`❌ Erro ao fazer login:\n\n${erro.message}\n\nVerifique suas credenciais e tente novamente.`);
  } finally {
    hideLoading();
  }
};

// ========== LOGOUT ==========
window.logout = function () {
  if (estadoApp.unsubscribeAvisos) estadoApp.unsubscribeAvisos();
  
  estadoApp = {
    usuario: null,
    gestor: null,
    perfil: null,
    isOnline: navigator.onLine,
    avisosAtivos: [],
    unsubscribeAvisos: null,
    estatisticas: null,
    modoExterno: estadoApp.modoExterno, // Mantém o modo
    modoExternoAlternativo: estadoApp.modoExternoAlternativo,
    formularioAtivo: false
  };
  
  localStorage.removeItem('perfil_ativo');
  localStorage.removeItem('usuario_matricula');
  localStorage.removeItem('usuario_nome');
  localStorage.removeItem('usuario_funcao');
  localStorage.removeItem('usuario_email');
  localStorage.removeItem('gestor_logado');
  localStorage.removeItem('gestor_email');
  localStorage.removeItem('gestor_uid');
  
  const userStatus = document.getElementById('userStatus');
  if (userStatus) userStatus.style.display = 'none';
  
  // Fechar formulário se estiver aberto
  document.getElementById('backFromFormBtn').classList.remove('visible');
  estadoApp.formularioAtivo = false;
  
  mostrarTela('welcome');
  
  console.log('👋 Usuário deslogado');
  mostrarNotificacao('👋 Até logo', 'Você saiu do sistema');
};

// ========== NAVEGAÇÃO ENTRE TELAS ==========
window.mostrarTela = function(id) {
  console.log('🔄 Mostrando tela:', id);
  
  document.querySelectorAll('.tela').forEach(tela => {
    tela.classList.add('hidden');
    tela.classList.remove('ativa');
  });
  
  const alvo = document.getElementById(id);
  if (!alvo) {
    console.error('Tela não encontrada:', id);
    return;
  }
  
  alvo.classList.remove('hidden');
  alvo.classList.add('ativa');
  
  // Atualizar visibilidade do botão de pânico
  setTimeout(() => {
    const panicBtn = document.getElementById('panicBtn');
    if (panicBtn) {
      const esconderEm = ['welcome', 'telaEscolhaPerfil', 'tela-usuario-login', 'tela-gestor-login', 'tela-formulario-interno'];
      panicBtn.style.display = esconderEm.includes(id) ? 'none' : 'flex';
    }
  }, 100);
  
  switch(id) {
    case 'tela-gestor-dashboard':
      carregarEstatisticasGestor();
      carregarAvisosGestor();
      break;
    case 'tela-usuario':
      atualizarInfoUsuario();
      break;
    case 'tela-formulario-interno':
      // Já tratado na função abrirFormularioInterno
      break;
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function atualizarInfoUsuario() {
  if (!estadoApp.usuario) return;
  
  const nomeElement = document.getElementById('colaboradorNome');
  const matriculaElement = document.getElementById('colaboradorMatricula');
  const funcaoElement = document.getElementById('colaboradorFuncao');
  
  if (nomeElement) nomeElement.textContent = estadoApp.usuario.nome;
  if (matriculaElement) matriculaElement.textContent = estadoApp.usuario.matricula;
  if (funcaoElement) funcaoElement.textContent = estadoApp.usuario.funcao;
}

// ========== AVISOS ==========
function initAvisos() {
  const avisosBtn = document.getElementById('avisosBtn');
  if (avisosBtn) {
    avisosBtn.addEventListener('click', mostrarAvisos);
  }
}

window.mostrarAvisos = function() {
  const avisos = estadoApp.avisosAtivos || [];
  
  if (avisos.length === 0) {
    alert('📭 Nenhum aviso no momento');
    return;
  }
  
  const avisosHTML = avisos.filter(aviso => aviso.ativo).map(aviso => `
    <div class="aviso-item">
      <div class="aviso-header">
        <strong>${aviso.titulo}</strong>
        <small>${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleDateString() : ''}</small>
      </div>
      <p>${aviso.mensagem}</p>
      <small class="aviso-destino">Para: ${aviso.destino || 'Todos'}</small>
    </div>
  `).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-back';
  modal.innerHTML = `
    <div class="modal">
      <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
      <h3>📢 Avisos e Comunicados</h3>
      <div class="avisos-list">
        ${avisosHTML}
      </div>
      <div style="margin-top:12px">
        <button class="btn" onclick="this.parentElement.parentElement.remove()">Fechar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
};

function iniciarMonitoramentoAvisos() {
  if (estadoApp.unsubscribeAvisos) return;
  
  estadoApp.unsubscribeAvisos = monitorarAvisos((avisos) => {
    estadoApp.avisosAtivos = avisos;
    
    const avisosCount = document.getElementById('avisosCount');
    if (avisosCount) {
      avisosCount.textContent = avisos.length;
      avisosCount.style.display = avisos.length > 0 ? 'inline' : 'none';
    }
    
    const avisosAtivosCount = document.getElementById('avisosAtivosCount');
    if (avisosAtivosCount) {
      avisosAtivosCount.textContent = avisos.length;
    }
  });
}

// ========== GESTÃO DE AVISOS (GESTOR) ==========
async function carregarAvisosGestor() {
  try {
    const avisos = await getAvisos();
    estadoApp.avisosAtivos = avisos;
    
    const container = document.getElementById('avisosAdminList');
    if (!container) return;
    
    if (avisos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bullhorn"></i>
          <h4>Nenhum aviso cadastrado</h4>
          <p>Clique em "Novo Aviso" para criar o primeiro.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = avisos.map(aviso => `
      <div class="aviso-admin-item" id="aviso-${aviso.id}">
        <div class="aviso-admin-header">
          <div>
            <h4>${aviso.titulo}</h4>
            <small class="aviso-destino-badge">Para: ${aviso.destino || 'Todos'}</small>
            <small class="aviso-data">${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleString() : ''}</small>
          </div>
          <div class="aviso-admin-actions">
            <button class="icon-btn" onclick="editarAviso('${aviso.id}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="icon-btn danger" onclick="excluirAviso('${aviso.id}')" title="Excluir">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="aviso-admin-content">
          <p>${aviso.mensagem}</p>
          <div class="aviso-status">
            <span class="status-badge ${aviso.ativo ? 'ativo' : 'inativo'}">
              ${aviso.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (erro) {
    console.error('Erro ao carregar avisos:', erro);
    const container = document.getElementById('avisosAdminList');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h4>Erro ao carregar avisos</h4>
          <p>Tente novamente mais tarde.</p>
        </div>
      `;
    }
  }
}

// [MANTER TODAS AS FUNÇÕES DE AVISOS DO CÓDIGO ANTERIOR]
// window.criarNovoAviso, window.salvarNovoAviso, window.editarAviso, window.salvarEdicaoAviso, window.excluirAviso

// ========== ESTATÍSTICAS GESTOR ==========
async function carregarEstatisticasGestor() {
  try {
    const estatisticas = await getEstatisticasDashboard();
    estadoApp.estatisticas = estatisticas;
    
    const totalColaboradores = document.getElementById('totalColaboradores');
    const avisosAtivosCount = document.getElementById('avisosAtivosCount');
    const usuariosOnline = document.getElementById('usuariosOnline');
    
    if (totalColaboradores) totalColaboradores.textContent = estatisticas.totalColaboradores;
    if (avisosAtivosCount) avisosAtivosCount.textContent = estatisticas.totalAvisosAtivos;
    if (usuariosOnline) usuariosOnline.textContent = estatisticas.usuariosOnline;
    
    const statColaboradores = document.getElementById('statColaboradores');
    const statAvisos = document.getElementById('statAvisos');
    
    if (statColaboradores) statColaboradores.textContent = estatisticas.totalColaboradores;
    if (statAvisos) statAvisos.textContent = estatisticas.totalAvisosAtivos;
    
  } catch (erro) {
    console.error('Erro ao carregar estatísticas:', erro);
    
    const totalColaboradores = document.getElementById('totalColaboradores');
    const avisosAtivosCount = document.getElementById('avisosAtivosCount');
    
    if (totalColaboradores) totalColaboradores.textContent = '0';
    if (avisosAtivosCount) avisosAtivosCount.textContent = '0';
  }
}

window.atualizarRelatorios = function() {
  carregarEstatisticasGestor();
  mostrarNotificacao('🔄 Atualizando', 'Estatísticas atualizadas');
};

window.exportarRelatorios = function() {
  if (!estadoApp.estatisticas) {
    alert('Nenhum dado disponível para exportar');
    return;
  }
  
  let csvContent = "Relatório Portal QSSMA\n";
  csvContent += `Data: ${new Date().toLocaleDateString()}\n\n`;
  csvContent += "Métrica,Valor\n";
  csvContent += `Colaboradores Cadastrados,${estadoApp.estatisticas.totalColaboradores}\n`;
  csvContent += `Avisos Ativos,${estadoApp.estatisticas.totalAvisosAtivos}\n`;
  csvContent += `Usuários Online,${estadoApp.estatisticas.usuariosOnline}\n`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_qssma_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  mostrarNotificacao('✅ Relatório Exportado', 'Download iniciado!');
};

// ========== WHATSAPP SUPPORT ==========
window.abrirSuporteWhatsApp = function() {
  const telefone = '559392059914';
  const nomeUsuario = estadoApp.usuario?.nome || estadoApp.gestor?.nome || 'Usuário Portal QSSMA';
  const matriculaUsuario = estadoApp.usuario?.matricula || 'Não informada';
  
  const mensagem = encodeURIComponent(
    `Olá! Sou ${nomeUsuario} (Matrícula: ${matriculaUsuario}).\n` +
    `Preciso de suporte no Portal QSSMA.\n` +
    `Data: ${new Date().toLocaleDateString('pt-BR')}\n` +
    `Hora: ${new Date().toLocaleTimeString('pt-BR')}`
  );
  
  const url = `https://wa.me/${telefone}?text=${mensagem}`;
  
  window.open(url, '_blank', 'noopener,noreferrer');
};

// ========== PWA - INSTALAÇÃO MELHORADA ==========
function initPWA() {
  const installBtn = document.getElementById('installBtn');
  
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar botão de instalação
    if (installBtn) {
      installBtn.style.display = 'flex';
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
          alert('Este aplicativo já está instalado ou não pode ser instalado.');
          return;
        }
        
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ Usuário aceitou a instalação');
          installBtn.style.display = 'none';
          mostrarNotificacao('✅ App Instalado', 'Portal QSSMA adicionado à sua tela inicial!');
        } else {
          console.log('❌ Usuário recusou a instalação');
        }
        
        deferredPrompt = null;
      });
    }
    
    // Mostrar alerta na primeira visita
    const jaMostrouAlerta = localStorage.getItem('pwa_alerta_mostrado');
    if (!jaMostrouAlerta && installBtn) {
      setTimeout(() => {
        mostrarNotificacao(
          '📱 Melhor experiência',
          'Adicione este app à sua tela inicial para acesso rápido e offline!'
        );
        localStorage.setItem('pwa_alerta_mostrado', 'true');
      }, 3000);
    }
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA instalado com sucesso');
    if (installBtn) installBtn.style.display = 'none';
    localStorage.setItem('pwa_instalado', 'true');
  });
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 App rodando em modo standalone (instalado)');
    if (installBtn) installBtn.style.display = 'none';
  }
}

// ========== NOTIFICAÇÕES ==========
function mostrarNotificacao(titulo, mensagem) {
  // Notificação na tela (sempre funciona)
  criarNotificacaoTela(titulo, mensagem);
  
  // Notificação do sistema (se permitido)
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    criarNotificacaoSistema(titulo, mensagem);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        criarNotificacaoSistema(titulo, mensagem);
      }
    });
  }
}

function criarNotificacaoSistema(titulo, mensagem) {
  const notification = new Notification(titulo, {
    body: mensagem,
    icon: 'logo.jpg',
    tag: 'portal-qssma',
    badge: 'logo.jpg',
    vibrate: [200, 100, 200]
  });
  
  notification.onclick = function() {
    window.focus();
    this.close();
  };
}

function criarNotificacaoTela(titulo, mensagem) {
  const notificacao = document.createElement('div');
  notificacao.className = 'notificacao-tela';
  notificacao.innerHTML = `
    <div class="notificacao-conteudo">
      <strong>${titulo}</strong>
      <p>${mensagem}</p>
    </div>
    <button onclick="this.parentElement.remove()">✕</button>
  `;
  
  document.body.appendChild(notificacao);
  
  setTimeout(() => {
    if (notificacao.parentElement) {
      notificacao.remove();
    }
  }, 5000);
}

// ========== FUNÇÕES DE UTILIDADE ==========
function showLoading(message = 'Carregando...') {
  const overlay = document.getElementById('loadingOverlay');
  const text = document.getElementById('loadingText');
  
  if (overlay) overlay.style.display = 'flex';
  if (text) text.textContent = message;
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ========== FUNÇÕES DE TEMAS ==========
function initDarkMode() {
  const darkToggle = document.getElementById('darkToggle');
  if (!darkToggle) return;
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const savedPreference = localStorage.getItem('qssma_dark');
  
  if (savedPreference === '1' || (!savedPreference && prefersDark.matches)) {
    document.body.classList.add('dark');
    updateDarkModeIcon(true);
  }
  
  darkToggle.addEventListener('click', toggleDarkMode);
  
  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('qssma_dark')) {
      if (e.matches) {
        document.body.classList.add('dark');
        updateDarkModeIcon(true);
      } else {
        document.body.classList.remove('dark');
        updateDarkModeIcon(false);
      }
    }
  });
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('qssma_dark', isDark ? '1' : '0');
  updateDarkModeIcon(isDark);
  
  const darkToggle = document.getElementById('darkToggle');
  if (darkToggle) {
    darkToggle.style.transform = 'scale(0.95)';
    setTimeout(() => {
      darkToggle.style.transform = '';
    }, 150);
  }
  
  mostrarNotificacao(
    '🌙 Tema',
    isDark ? 'Modo escuro ativado' : 'Modo claro ativado'
  );
}

function updateDarkModeIcon(isDark) {
  const darkToggle = document.getElementById('darkToggle');
  if (!darkToggle) return;
  
  darkToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  darkToggle.setAttribute('title', isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro');
}

// ========== FUNÇÕES DE CONEXÃO ==========
function initConnectionMonitor() {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  updateOnlineStatus();
}

function updateOnlineStatus() {
  estadoApp.isOnline = navigator.onLine;
  const statusElement = document.getElementById('connectionStatus');
  const offlineBanner = document.getElementById('offlineBanner');
  
  if (statusElement) {
    statusElement.innerHTML = '<i class="fas fa-circle"></i>';
    statusElement.style.color = estadoApp.isOnline ? '#4CAF50' : '#FF5722';
    statusElement.title = estadoApp.isOnline ? 'Online' : 'Offline';
  }
  
  if (offlineBanner) {
    offlineBanner.style.display = estadoApp.isOnline ? 'none' : 'block';
  }
  
  if (!estadoApp.isOnline) {
    console.warn('📶 Aplicativo offline');
    mostrarNotificacao('📶 Modo Offline', 'Algumas funcionalidades podem não estar disponíveis');
  }
}

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('✅ ServiceWorker registrado:', registration.scope);
        
        // Verificar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 Nova versão do Service Worker encontrada');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              mostrarNotificacao(
                '🔄 Atualização disponível',
                'Recarregue a página para atualizar o aplicativo'
              );
            }
          });
        });
      })
      .catch(error => {
        console.log('❌ Falha ao registrar ServiceWorker:', error);
      });
  });
}

// ========== EVENT LISTENERS ==========
function initEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
      if (estadoApp.formularioAtivo) {
        fecharFormulario();
      }
    }
  });
  
  document.querySelectorAll('.modal-back').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  });
  
  // Atalho de teclado para emergência (Shift + E)
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'E') {
      e.preventDefault();
      abrirEmergencia();
    }
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal-back').forEach(modal => {
    modal.remove();
  });
}
// ========== AVISOS ==========
function initAvisos() {
  const avisosBtn = document.getElementById('avisosBtn');
  if (avisosBtn) {
    avisosBtn.addEventListener('click', mostrarAvisos);
  }
}

window.mostrarAvisos = function() {
  const avisos = estadoApp.avisosAtivos || [];
  
  if (avisos.length === 0) {
    alert('📭 Nenhum aviso no momento');
    return;
  }
  
  const avisosHTML = avisos.filter(aviso => aviso.ativo).map(aviso => `
    <div class="aviso-item">
      <div class="aviso-header">
        <strong>${aviso.titulo}</strong>
        <small>${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleDateString() : ''}</small>
      </div>
      <p>${aviso.mensagem}</p>
      <small class="aviso-destino">Para: ${aviso.destino || 'Todos'}</small>
    </div>
  `).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-back';
  modal.innerHTML = `
    <div class="modal">
      <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
      <h3>📢 Avisos e Comunicados</h3>
      <div class="avisos-list">
        ${avisosHTML}
      </div>
      <div style="margin-top:12px">
        <button class="btn" onclick="this.parentElement.parentElement.remove()">Fechar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
};

function iniciarMonitoramentoAvisos() {
  if (estadoApp.unsubscribeAvisos) return;
  
  estadoApp.unsubscribeAvisos = monitorarAvisos((avisos) => {
    estadoApp.avisosAtivos = avisos;
    
    const avisosCount = document.getElementById('avisosCount');
    if (avisosCount) {
      avisosCount.textContent = avisos.length;
      avisosCount.style.display = avisos.length > 0 ? 'inline' : 'none';
    }
    
    const avisosAtivosCount = document.getElementById('avisosAtivosCount');
    if (avisosAtivosCount) {
      avisosAtivosCount.textContent = avisos.length;
    }
  });
}

// ========== GESTÃO DE AVISOS (GESTOR) ==========
async function carregarAvisosGestor() {
  try {
    const avisos = await getAvisos();
    estadoApp.avisosAtivos = avisos;
    
    const container = document.getElementById('avisosAdminList');
    if (!container) return;
    
    if (avisos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bullhorn"></i>
          <h4>Nenhum aviso cadastrado</h4>
          <p>Clique em "Novo Aviso" para criar o primeiro.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = avisos.map(aviso => `
      <div class="aviso-admin-item" id="aviso-${aviso.id}">
        <div class="aviso-admin-header">
          <div>
            <h4>${aviso.titulo}</h4>
            <small class="aviso-destino-badge">Para: ${aviso.destino || 'Todos'}</small>
            <small class="aviso-data">${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleString() : ''}</small>
          </div>
          <div class="aviso-admin-actions">
            <button class="icon-btn" onclick="editarAviso('${aviso.id}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="icon-btn danger" onclick="excluirAviso('${aviso.id}')" title="Excluir">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="aviso-admin-content">
          <p>${aviso.mensagem}</p>
          <div class="aviso-status">
            <span class="status-badge ${aviso.ativo ? 'ativo' : 'inativo'}">
              ${aviso.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (erro) {
    console.error('Erro ao carregar avisos:', erro);
    const container = document.getElementById('avisosAdminList');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h4>Erro ao carregar avisos</h4>
          <p>Tente novamente mais tarde.</p>
        </div>
      `;
    }
  }
}

window.criarNovoAviso = function() {
  const modal = document.createElement('div');
  modal.className = 'modal-back';
  modal.innerHTML = `
    <div class="modal">
      <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
      <h3><i class="fas fa-plus"></i> Criar Novo Aviso</h3>
      
      <div class="form-group">
        <label>Título *</label>
        <input type="text" id="novoAvisoTitulo" class="form-input" placeholder="Título do aviso" required>
      </div>
      
      <div class="form-group">
        <label>Mensagem *</label>
        <textarea id="novoAvisoMensagem" class="form-input" rows="4" placeholder="Mensagem do aviso" required></textarea>
      </div>
      
      <div class="form-group">
        <label>Destino</label>
        <select id="novoAvisoDestino" class="form-input">
          <option value="todos">Todos</option>
          <option value="colaboradores">Colaboradores</option>
          <option value="gestores">Gestores</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" id="novoAvisoAtivo" checked> Aviso ativo
        </label>
      </div>
      
      <div class="form-actions">
        <button class="btn btn-primary" onclick="salvarNovoAviso()">
          <i class="fas fa-save"></i> Salvar Aviso
        </button>
        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i> Cancelar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
};

window.salvarNovoAviso = async function() {
  const titulo = document.getElementById('novoAvisoTitulo').value;
  const mensagem = document.getElementById('novoAvisoMensagem').value;
  const destino = document.getElementById('novoAvisoDestino').value;
  const ativo = document.getElementById('novoAvisoAtivo').checked;
  
  if (!titulo || !mensagem) {
    alert('Preencha título e mensagem');
    return;
  }
  
  try {
    showLoading('Salvando aviso...');
    
    // Verificar se o usuário está autenticado
    if (!auth.currentUser) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    await registrarAviso({
      titulo: titulo,
      mensagem: mensagem,
      destino: destino,
      ativo: ativo,
      timestamp: new Date()
    });
    
    mostrarNotificacao('✅ Aviso Criado', 'Aviso criado com sucesso!');
    
    document.querySelector('.modal-back').remove();
    carregarAvisosGestor();
    
  } catch (erro) {
    console.error('Erro ao salvar aviso:', erro);
    alert(`❌ Erro ao salvar aviso: ${erro.message}\n\nVerifique se está logado como gestor.`);
  } finally {
    hideLoading();
  }
};

window.editarAviso = async function(avisoId) {
  try {
    showLoading('Carregando aviso...');
    
    const aviso = estadoApp.avisosAtivos.find(a => a.id === avisoId);
    if (!aviso) {
      alert('Aviso não encontrado');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-back';
    modal.innerHTML = `
      <div class="modal">
        <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
        <h3><i class="fas fa-edit"></i> Editar Aviso</h3>
        
        <div class="form-group">
          <label>Título *</label>
          <input type="text" id="editarAvisoTitulo" class="form-input" value="${aviso.titulo || ''}" required>
        </div>
        
        <div class="form-group">
          <label>Mensagem *</label>
          <textarea id="editarAvisoMensagem" class="form-input" rows="4" required>${aviso.mensagem || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label>Destino</label>
          <select id="editarAvisoDestino" class="form-input">
            <option value="todos" ${aviso.destino === 'todos' ? 'selected' : ''}>Todos</option>
            <option value="colaboradores" ${aviso.destino === 'colaboradores' ? 'selected' : ''}>Colaboradores</option>
            <option value="gestores" ${aviso.destino === 'gestores' ? 'selected' : ''}>Gestores</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="editarAvisoAtivo" ${aviso.ativo ? 'checked' : ''}> Aviso ativo
          </label>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary" onclick="salvarEdicaoAviso('${avisoId}')">
            <i class="fas fa-save"></i> Salvar Alterações
          </button>
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
  } catch (erro) {
    console.error('Erro ao carregar aviso:', erro);
    alert('❌ Erro ao carregar aviso');
  } finally {
    hideLoading();
  }
};

window.salvarEdicaoAviso = async function(avisoId) {
  const titulo = document.getElementById('editarAvisoTitulo').value;
  const mensagem = document.getElementById('editarAvisoMensagem').value;
  const destino = document.getElementById('editarAvisoDestino').value;
  const ativo = document.getElementById('editarAvisoAtivo').checked;
  
  if (!titulo || !mensagem) {
    alert('Preencha título e mensagem');
    return;
  }
  
  try {
    showLoading('Salvando alterações...');
    
    await updateAviso(avisoId, {
      titulo: titulo,
      mensagem: mensagem,
      destino: destino,
      ativo: ativo,
      timestamp: new Date()
    });
    
    mostrarNotificacao('✅ Aviso Atualizado', 'Aviso atualizado com sucesso!');
    
    document.querySelector('.modal-back').remove();
    carregarAvisosGestor();
    
  } catch (erro) {
    console.error('Erro ao atualizar aviso:', erro);
    alert('❌ Erro ao atualizar aviso');
  } finally {
    hideLoading();
  }
};

window.excluirAviso = async function(avisoId) {
  if (!confirm('Tem certeza que deseja excluir este aviso?\n\nEsta ação não pode ser desfeita.')) {
    return;
  }
  
  try {
    showLoading('Excluindo aviso...');
    
    await deleteAviso(avisoId);
    
    mostrarNotificacao('✅ Aviso Excluído', 'Aviso excluído com sucesso!');
    
    const avisoElement = document.getElementById(`aviso-${avisoId}`);
    if (avisoElement) {
      avisoElement.remove();
    }
    
    if (document.querySelectorAll('.aviso-admin-item').length === 0) {
      const container = document.getElementById('avisosAdminList');
      if (container) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-bullhorn"></i>
            <h4>Nenhum aviso cadastrado</h4>
            <p>Clique em "Novo Aviso" para criar o primeiro.</p>
          </div>
        `;
      }
    }
    
  } catch (erro) {
    console.error('Erro ao excluir aviso:', erro);
    alert('❌ Erro ao excluir aviso');
  } finally {
    hideLoading();
  }
};
// ========== FUNÇÕES DE AVISOS (MANTER DO CÓDIGO ANTERIOR) ==========
// [Inserir aqui as funções de avisos do código anterior que não foram reescritas]

console.log('🚀 app.js carregado com sucesso!');
