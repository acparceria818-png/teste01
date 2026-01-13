// app.js - PORTAL QSSMA (VERSÃO CORRIGIDA)
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
} from './modules/firebaseAuth.js';

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

// ========== EVENT LISTENERS (ESSENCIAL - O PROBLEMA ESTÁ AQUI) ==========
function initEventListeners() {
  console.log('🔗 Inicializando event listeners...');
  
  // 1. Botão Acessar Portal
  const acessarBtn = document.getElementById('acessarPortalBtn');
  if (acessarBtn) {
    console.log('✅ Botão Acessar Portal encontrado');
    acessarBtn.addEventListener('click', () => {
      console.log('🎯 Clicou em Acessar Portal');
      mostrarTela('telaEscolhaPerfil');
    });
  }
  
  // 2. Botões de Perfil
  const perfilUsuarioBtn = document.getElementById('perfilUsuarioBtn');
  if (perfilUsuarioBtn) {
    perfilUsuarioBtn.addEventListener('click', () => {
      console.log('🎯 Clicou em Perfil Usuário');
      mostrarTela('tela-usuario-login');
    });
  }
  
  const perfilGestorBtn = document.getElementById('perfilGestorBtn');
  if (perfilGestorBtn) {
    perfilGestorBtn.addEventListener('click', () => {
      console.log('🎯 Clicou em Perfil Gestor');
      mostrarTela('tela-gestor-login');
    });
  }
  
  // 3. Botão Login Usuário
  const loginUsuarioBtn = document.getElementById('loginUsuarioBtn');
  if (loginUsuarioBtn) {
    loginUsuarioBtn.addEventListener('click', async () => {
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
    });
  }
  
  // 4. Botão Login Gestor
  const loginGestorBtn = document.getElementById('loginGestorBtn');
  if (loginGestorBtn) {
    loginGestorBtn.addEventListener('click', async () => {
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
    });
  }
  
  // 5. Botões de Voltar
  const voltarWelcomeBtn = document.getElementById('voltarWelcomeBtn');
  if (voltarWelcomeBtn) {
    voltarWelcomeBtn.addEventListener('click', () => mostrarTela('welcome'));
  }
  
  const voltarPerfilBtn = document.getElementById('voltarPerfilBtn');
  if (voltarPerfilBtn) {
    voltarPerfilBtn.addEventListener('click', () => mostrarTela('telaEscolhaPerfil'));
  }
  
  const voltarPerfilGestorBtn = document.getElementById('voltarPerfilGestorBtn');
  if (voltarPerfilGestorBtn) {
    voltarPerfilGestorBtn.addEventListener('click', () => mostrarTela('telaEscolhaPerfil'));
  }
  
  // 6. Botões de Logout
  const logoutUsuarioBtn = document.getElementById('logoutUsuarioBtn');
  if (logoutUsuarioBtn) {
    logoutUsuarioBtn.addEventListener('click', () => {
      logout();
      limparSessao();
      mostrarTela('welcome');
      showToast('info', 'Até logo', 'Você saiu do sistema');
    });
  }
  
  const logoutGestorBtn = document.getElementById('logoutGestorBtn');
  if (logoutGestorBtn) {
    logoutGestorBtn.addEventListener('click', () => {
      logout();
      limparSessao();
      mostrarTela('welcome');
      showToast('info', 'Até logo', 'Você saiu do sistema');
    });
  }
  
  // 7. Botão SOS
  const sosBtn = document.getElementById('sosButton');
  if (sosBtn) {
    sosBtn.addEventListener('click', () => {
      console.log('🎯 Clicou em SOS');
      abrirSOS();
    });
  }
  
  // 8. Botão Fechar SOS
  const fecharSOSBtn = document.getElementById('fecharSOSBtn');
  if (fecharSOSBtn) {
    fecharSOSBtn.addEventListener('click', () => {
      fecharSOS();
    });
  }
  
  // 9. Botões do Dashboard do Gestor
  const novoAvisoBtn = document.getElementById('novoAvisoBtn');
  if (novoAvisoBtn) {
    novoAvisoBtn.addEventListener('click', () => {
      criarNovoAviso();
    });
  }
  
  const exportarRelatoriosBtn = document.getElementById('exportarRelatoriosBtn');
  if (exportarRelatoriosBtn) {
    exportarRelatoriosBtn.addEventListener('click', exportarRelatorios);
  }
  
  const atualizarRelatoriosBtn = document.getElementById('atualizarRelatoriosBtn');
  if (atualizarRelatoriosBtn) {
    atualizarRelatoriosBtn.addEventListener('click', atualizarRelatorios);
  }
  
  // 10. Tabs do Dashboard do Gestor
  document.querySelectorAll('.dashboard-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      mudarTabGestor(tabId);
    });
  });
  
  // 11. Botão Fechar Modal de Avisos
  const fecharAvisosBtn = document.getElementById('fecharAvisosBtn');
  const fecharAvisosModalBtn = document.getElementById('fecharAvisosModalBtn');
  if (fecharAvisosBtn) fecharAvisosBtn.addEventListener('click', fecharModalAvisos);
  if (fecharAvisosModalBtn) fecharAvisosModalBtn.addEventListener('click', fecharModalAvisos);
  
  console.log('✅ Event listeners inicializados');
}

function fecharModalAvisos() {
  const modal = document.getElementById('avisosModal');
  if (modal) modal.classList.add('hidden');
}

function mudarTabGestor(tabId) {
  // Atualizar tabs ativas
  document.querySelectorAll('.dashboard-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Ativar tab selecionada
  const tabAtiva = document.querySelector(`.dashboard-tab[data-tab="${tabId}"]`);
  const conteudoAtivo = document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  
  if (tabAtiva) tabAtiva.classList.add('active');
  if (conteudoAtivo) conteudoAtivo.classList.add('active');
}

// ========== NAVEGAÇÃO ENTRE TELAS (FUNÇÕES GLOBAIS) ==========
window.entrarNoPortal = function() {
  mostrarTela('telaEscolhaPerfil');
};

window.selecionarPerfil = function(perfil) {
  console.log('👤 Perfil selecionado:', perfil);
  estadoApp.perfil = perfil;
  localStorage.setItem('perfil_ativo', perfil);

  if (perfil === 'usuario') {
    mostrarTela('tela-usuario-login');
    setTimeout(() => {
      const input = document.getElementById('matriculaUsuario');
      if (input) input.focus();
    }, 100);
  } else if (perfil === 'gestor') {
    mostrarTela('tela-gestor-login');
    setTimeout(() => {
      const input = document.getElementById('gestorEmail');
      if (input) input.focus();
    }, 100);
  }
};

// ========== LOGIN USUÁRIO (FUNÇÃO GLOBAL) ==========
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

// ========== LOGIN GESTOR (FUNÇÃO GLOBAL) ==========
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

// ========== LOGOUT (FUNÇÃO GLOBAL) ==========
window.logout = function() {
  logout();
  limparSessao();
  mostrarTela('welcome');
  showToast('info', 'Até logo', 'Você saiu do sistema');
};

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
// Avisos
window.mostrarAvisos = mostrarAvisosUsuario;
window.criarNovoAviso = criarNovoAviso;
window.salvarNovoAviso = salvarNovoAviso;
window.editarAviso = editarAviso;
window.salvarEdicaoAviso = salvarEdicaoAviso;
window.excluirAviso = excluirAviso;

// Acessibilidade
window.abrirFormularioInterno = abrirFormularioInterno;
window.fecharFormulario = fecharFormulario;
window.abrirSOS = abrirSOS;
window.fecharSOS = fecharSOS;

// Utilitários
window.mostrarTela = mostrarTela;
window.abrirSuporteWhatsApp = function() {
  const telefone = '559392059914';
  const mensagem = encodeURIComponent('Olá! Preciso de suporte no Portal QSSMA.');
  const url = `https://wa.me/${telefone}?text=${mensagem}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

console.log('🚀 app.js carregado com sucesso!');
// Forçar atualização do Service Worker se houver mudanças
if ('serviceWorker' in navigator) {
  let refreshing = false;
  
  // Detectar quando um novo service worker está pronto
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
  
  // Verificar atualizações periodicamente
  setInterval(() => {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) reg.update();
    });
  }, 60 * 60 * 1000); // A cada hora
}
