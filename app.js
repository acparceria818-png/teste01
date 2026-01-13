// app.js - PORTAL QSSMA (VERSÃO MODULARIZADA)
import { 
  db,
  auth,
  loginEmailSenha,
  getColaborador,
  getEstatisticasDashboard
} from './firebase.js';

import {
  showToast,
  showLoading,
  hideLoading,
  mostrarTela,
  updateUserStatus,
  criarCardsUsuario,
  atualizarStatsGestor,
  mostrarBannerPWA
} from './modules/ui.js';

import {
  monitorarAvisos,
  carregarAvisosGestor,
  criarNovoAviso,
  salvarNovoAviso,
  editarAviso,
  salvarEdicaoAviso,
  excluirAviso,
  mostrarAvisosUsuario
} from './modules/avisos.js';

import {
  validarMatricula,
  loginUsuario,
  loginGestor,
  logout,
  verificarPermissaoGestor
} from './modules/auth.js';

import {
  mostrarNotificacao,
  initNotifications
} from './modules/notifications.js';

import {
  toggleContraste,
  toggleModoExterno,
  initAcessibilidade,
  abrirFormularioInterno,
  fecharFormulario,
  abrirSOS,
  fecharSOS
} from './modules/accessibility.js';

// Estado global do aplicativo
const estadoApp = {
  usuario: null,
  gestor: null,
  perfil: null,
  isOnline: navigator.onLine,
  avisosAtivos: [],
  unsubscribeAvisos: null,
  estatisticas: null,
  modoExterno: false,
  altoContraste: false
};

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Portal QSSMA - Inicializando...');
  
  // Verificar sessão existente
  verificarSessao();
  
  // Inicializar funcionalidades
  initApp();
  
  console.log('✅ Portal QSSMA inicializado com sucesso');
});

function initApp() {
  initAcessibilidade();
  initEventListeners();
  initConnectionMonitor();
  initPWA();
  initNotifications();
  
  // Verificar se pode mostrar banner PWA
  setTimeout(() => {
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      mostrarBannerPWA();
    }
  }, 2000);
}

// ========== GERENCIAMENTO DE SESSÃO ==========
async function verificarSessao() {
  try {
    const perfil = localStorage.getItem('perfil_ativo');
    const matricula = localStorage.getItem('usuario_matricula');
    const gestorLogado = localStorage.getItem('gestor_logado');
    
    if (perfil === 'usuario' && matricula) {
      // Verificar se o usuário ainda existe
      const snap = await getColaborador(matricula);
      if (snap.exists() && snap.data().ativo) {
        const dados = snap.data();
        estadoApp.usuario = { 
          matricula, 
          nome: dados.nome,
          funcao: dados.funcao || 'Não informada',
          email: dados.email || ''
        };
        estadoApp.perfil = 'usuario';
        
        updateUserStatus(dados.nome, matricula, dados.funcao);
        mostrarTela('tela-usuario');
        iniciarMonitoramentoAvisos();
        criarCardsUsuario();
        
        showToast('success', 'Bem-vindo de volta!', `Olá, ${dados.nome}`);
        return;
      }
    } else if (perfil === 'gestor' && gestorLogado) {
      // Verificar token do gestor
      if (auth.currentUser) {
        estadoApp.perfil = 'gestor';
        estadoApp.gestor = { 
          email: localStorage.getItem('gestor_email'),
          uid: auth.currentUser.uid
        };
        
        mostrarTela('tela-gestor-dashboard');
        iniciarMonitoramentoAvisos();
        atualizarStatsGestor();
        carregarAvisosGestor();
        
        showToast('success', 'Gestor autenticado', 'Painel administrativo');
        return;
      }
    }
    
    // Se chegou aqui, não tem sessão válida
    limparSessao();
    mostrarTela('welcome');
    
  } catch (erro) {
    console.error('Erro ao verificar sessão:', erro);
    limparSessao();
    mostrarTela('welcome');
  }
}

function limparSessao() {
  if (estadoApp.unsubscribeAvisos) {
    estadoApp.unsubscribeAvisos();
    estadoApp.unsubscribeAvisos = null;
  }
  
  estadoApp.usuario = null;
  estadoApp.gestor = null;
  estadoApp.perfil = null;
  estadoApp.avisosAtivos = [];
  
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
}

// ========== SELEÇÃO DE PERFIL ==========
window.entrarNoPortal = function() {
  mostrarTela('telaEscolhaPerfil');
};

window.selecionarPerfil = function(perfil) {
  console.log('👤 Perfil selecionado:', perfil);
  estadoApp.perfil = perfil;
  localStorage.setItem('perfil_ativo', perfil);

  if (perfil === 'usuario') {
    mostrarTela('tela-usuario-login');
    // Focar no campo de matrícula
    setTimeout(() => {
      const input = document.getElementById('matriculaUsuario');
      if (input) input.focus();
    }, 100);
  } else if (perfil === 'gestor') {
    mostrarTela('tela-gestor-login');
    // Focar no campo de email
    setTimeout(() => {
      const input = document.getElementById('gestorEmail');
      if (input) input.focus();
    }, 100);
  }
};

// ========== LOGIN USUÁRIO ==========
window.confirmarMatriculaUsuario = async function() {
  const input = document.getElementById('matriculaUsuario');
  const matricula = input?.value.trim().toUpperCase();

  if (!matricula) {
    showToast('error', 'Campo obrigatório', 'Informe sua matrícula');
    input?.focus();
    return;
  }

  await loginUsuario(matricula, {
    onSuccess: (dados) => {
      estadoApp.usuario = { 
        matricula, 
        nome: dados.nome,
        funcao: dados.funcao || 'Não informada',
        email: dados.email || ''
      };
      
      updateUserStatus(dados.nome, matricula, dados.funcao);
      mostrarTela('tela-usuario');
      iniciarMonitoramentoAvisos();
      criarCardsUsuario();
      
      showToast('success', 'Login realizado', `Bem-vindo(a), ${dados.nome}!`);
    },
    onError: (erro) => {
      if (erro.message.includes('não encontrada')) {
        showToast('error', 'Matrícula não encontrada', 'Procure o RH ou o Gestor de QSSMA');
      } else if (erro.message.includes('inativo')) {
        showToast('error', 'Colaborador inativo', 'Contate a gestão');
      } else {
        showToast('error', 'Erro ao validar', 'Verifique sua conexão e tente novamente');
      }
    }
  });
};

// ========== LOGIN GESTOR ==========
window.loginGestor = async function() {
  const email = document.getElementById('gestorEmail').value;
  const senha = document.getElementById('gestorSenha').value;
  
  if (!email || !senha) {
    showToast('error', 'Campos obrigatórios', 'Preencha e-mail e senha');
    return;
  }
  
  await loginGestor(email, senha, {
    onSuccess: (user) => {
      estadoApp.gestor = { 
        email, 
        uid: user.uid,
        nome: 'Gestor QSSMA'
      };
      
      mostrarTela('tela-gestor-dashboard');
      iniciarMonitoramentoAvisos();
      atualizarStatsGestor();
      carregarAvisosGestor();
      
      showToast('success', 'Acesso Gestor', 'Painel administrativo liberado');
    },
    onError: (erro) => {
      showToast('error', 'Erro no login', erro.message);
    }
  });
};

// ========== LOGOUT ==========
window.logout = function() {
  logout();
  limparSessao();
  mostrarTela('welcome');
  
  showToast('info', 'Até logo', 'Você saiu do sistema');
};

// ========== NAVEGAÇÃO ENTRE TELAS ==========
// Função já importada do módulo UI

// ========== AVISOS ==========
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
// Funções já importadas do módulo avisos

// ========== ESTATÍSTICAS GESTOR ==========
async function carregarEstatisticasGestor() {
  try {
    const estatisticas = await getEstatisticasDashboard();
    estadoApp.estatisticas = estatisticas;
    
    // Atualizar cards do dashboard
    const totalColaboradores = document.getElementById('totalColaboradores');
    const avisosAtivosCount = document.getElementById('avisosAtivosCount');
    const usuariosOnline = document.getElementById('usuariosOnline');
    
    if (totalColaboradores) totalColaboradores.textContent = estatisticas.totalColaboradores;
    if (avisosAtivosCount) avisosAtivosCount.textContent = estatisticas.totalAvisosAtivos;
    if (usuariosOnline) usuariosOnline.textContent = estatisticas.usuariosOnline;
    
    // Atualizar estatísticas na aba de relatórios
    const statColaboradores = document.getElementById('statColaboradores');
    const statAvisos = document.getElementById('statAvisos');
    
    if (statColaboradores) statColaboradores.textContent = estatisticas.totalColaboradores;
    if (statAvisos) statAvisos.textContent = estatisticas.totalAvisosAtivos;
    
  } catch (erro) {
    console.error('Erro ao carregar estatísticas:', erro);
    showToast('error', 'Erro ao carregar', 'Não foi possível carregar as estatísticas');
  }
}

window.atualizarRelatorios = function() {
  carregarEstatisticasGestor();
  showToast('info', 'Atualizando', 'Estatísticas atualizadas');
};

window.exportarRelatorios = async function() {
  try {
    showLoading('Gerando relatório...');
    
    if (!estadoApp.estatisticas) {
      await carregarEstatisticasGestor();
    }
    
    let csvContent = "Relatório Portal QSSMA\n";
    csvContent += `Data: ${new Date().toLocaleDateString()}\n`;
    csvContent += `Hora: ${new Date().toLocaleTimeString()}\n\n`;
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
    
    showToast('success', 'Relatório Exportado', 'Download iniciado!');
    
  } catch (erro) {
    console.error('Erro ao exportar relatório:', erro);
    showToast('error', 'Erro ao exportar', 'Não foi possível gerar o relatório');
  } finally {
    hideLoading();
  }
};

// ========== FUNÇÕES DE UTILIDADE ==========
function initEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
    
    // Navegação por teclado
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });
  
  document.addEventListener('click', () => {
    document.body.classList.remove('keyboard-nav');
  });
  
  // Modo externo
  const modoExternoBtn = document.getElementById('modoExternoBtn');
  if (modoExternoBtn) {
    modoExternoBtn.addEventListener('click', () => {
      toggleModoExterno();
      const isExterno = document.body.getAttribute('data-externo') === 'true';
      showToast('info', 
        isExterno ? 'Modo Externo Ativado' : 'Modo Externo Desativado',
        isExterno ? 'Contraste máximo para ambiente externo' : 'Modo normal ativado'
      );
    });
  }
  
  // Alto contraste
  const contrasteBtn = document.getElementById('contrasteToggle');
  if (contrasteBtn) {
    contrasteBtn.addEventListener('click', () => {
      toggleContraste();
      const isContraste = document.body.getAttribute('data-contraste') === 'true';
      showToast('info',
        isContraste ? 'Alto Contraste Ativado' : 'Alto Contraste Desativado',
        isContraste ? 'Cores otimizadas para visibilidade' : 'Cores padrão'
      );
    });
  }
  
  // SOS
  const sosBtn = document.getElementById('sosButton');
  if (sosBtn) {
    sosBtn.addEventListener('click', abrirSOS);
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-back').forEach(modal => {
    modal.remove();
  });
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
    statusElement.innerHTML = estadoApp.isOnline ? '<i class="fas fa-circle"></i>' : '<i class="fas fa-circle"></i>';
    statusElement.style.color = estadoApp.isOnline ? '#4CAF50' : '#FF5722';
    statusElement.title = estadoApp.isOnline ? 'Online' : 'Offline';
  }
  
  if (offlineBanner) {
    offlineBanner.style.display = estadoApp.isOnline ? 'none' : 'block';
  }
  
  if (!estadoApp.isOnline) {
    console.warn('📶 Aplicativo offline');
    showToast('warning', 'Modo Offline', 'Algumas funcionalidades podem não estar disponíveis');
  }
}

// ========== PWA INSTALL ==========
let deferredPrompt;

function initPWA() {
  const installBtn = document.getElementById('installBtn');
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (installBtn) {
      installBtn.style.display = 'flex';
      installBtn.addEventListener('click', instalarPWA);
    }
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA instalado com sucesso');
    deferredPrompt = null;
    
    if (installBtn) installBtn.style.display = 'none';
    
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.style.display = 'none';
    
    showToast('success', 'App instalado!', 'O Portal QSSMA foi adicionado à sua tela inicial');
  });
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    if (installBtn) installBtn.style.display = 'none';
  }
}

window.instalarPWA = async function() {
  if (!deferredPrompt) {
    showToast('info', 'App já instalado', 'O aplicativo já está instalado no seu dispositivo');
    return;
  }
  
  try {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('✅ Usuário aceitou a instalação');
      showToast('success', 'Instalando...', 'O app será adicionado à sua tela inicial');
    } else {
      console.log('❌ Usuário recusou a instalação');
      showToast('info', 'Instalação cancelada', 'Você pode instalar depois pelo menu');
    }
    
    deferredPrompt = null;
    
  } catch (erro) {
    console.error('Erro na instalação:', erro);
    showToast('error', 'Erro na instalação', 'Não foi possível instalar o app');
  }
};

window.fecharBannerPWA = function() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) {
    banner.style.display = 'none';
  }
};

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('✅ ServiceWorker registrado:', registration.scope);
      })
      .catch(error => {
        console.log('❌ Falha ao registrar ServiceWorker:', error);
      });
  });
}

// ========== EXPORT FUNÇÕES PARA WINDOW ==========
window.mostrarAvisos = mostrarAvisosUsuario;
window.criarNovoAviso = criarNovoAviso;
window.salvarNovoAviso = salvarNovoAviso;
window.editarAviso = editarAviso;
window.salvarEdicaoAviso = salvarEdicaoAviso;
window.excluirAviso = excluirAviso;
window.abrirFormularioInterno = abrirFormularioInterno;
window.fecharFormulario = fecharFormulario;
window.abrirSOS = abrirSOS;
window.fecharSOS = fecharSOS;

// Adicionar estas funções também
window.entrarNoPortal = entrarNoPortal;
window.selecionarPerfil = selecionarPerfil;
window.confirmarMatriculaUsuario = confirmarMatriculaUsuario;
window.loginGestor = loginGestor;
window.logout = logout;
window.mostrarTela = mostrarTela;
window.atualizarRelatorios = atualizarRelatorios;
window.exportarRelatorios = exportarRelatorios;
window.abrirSuporteWhatsApp = abrirSuporteWhatsApp;
window.instalarPWA = instalarPWA;
window.fecharBannerPWA = fecharBannerPWA;

console.log('🚀 app.js carregado com sucesso!');
