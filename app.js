// app.js - Portal QSSMA
import { 
  db,
  auth,
  getColaborador,
  loginEmailSenha,
  registrarAviso,
  getAvisos,
  updateAviso,
  deleteAviso,
  monitorarAvisos,
  getEstatisticasDashboard
} from './firebase.js';

// Estado global
let estadoApp = {
  usuario: null,
  gestor: null,
  perfil: null,
  unsubscribeAvisos: null,
  avisosAtivos: [],
  estatisticas: null,
  modoAltoContraste: false
};

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Portal QSSMA - Inicializando...');
  
  // Adicionar rodapé
  adicionarRodape();
  
  // Verificar sessão existente
  verificarSessao();
  
  // Inicializar funcionalidades
  initDarkMode();
  initPWA();
  initEventListeners();
  initConnectionMonitor();
  initAltoContraste();
  
  console.log('✅ Portal QSSMA inicializado com sucesso');
});

// ========== RODAPÉ ==========
function adicionarRodape() {
  const footer = document.createElement('footer');
  footer.className = 'footer-dev';
  footer.innerHTML = `
    <div class="footer-content">
      <span>Desenvolvido por Juan Sales</span>
      <div class="footer-contacts">
        <a href="tel:+5594992233753"><i class="fas fa-phone"></i> (94) 99223-3753</a>
        <a href="mailto:Juansalesadm@gmail.com"><i class="fas fa-envelope"></i> Juansalesadm@gmail.com</a>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
}

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
      funcao: localStorage.getItem('usuario_funcao'),
      setor: 'Segurança'
    };
    estadoApp.perfil = 'usuario';
    mostrarTela('tela-usuario');
    iniciarMonitoramentoAvisos();
    
  } else if (perfil === 'gestor' && gestorLogado) {
    estadoApp.perfil = 'gestor';
    estadoApp.gestor = { 
      nome: localStorage.getItem('gestor_nome'),
      email: localStorage.getItem('gestor_email')
    };
    mostrarTela('tela-gestor-dashboard');
    iniciarMonitoramentoAvisos();
    carregarEstatisticas();
  }
}

function updateUserStatus(nome, matricula, funcao) {
  const userStatus = document.getElementById('userStatus');
  const userName = document.getElementById('userName');
  const usuarioNome = document.getElementById('usuarioNome');
  const usuarioMatricula = document.getElementById('usuarioMatricula');
  const usuarioFuncao = document.getElementById('usuarioFuncao');
  
  if (userStatus) userStatus.style.display = 'flex';
  if (userName) userName.textContent = nome;
  if (usuarioNome) usuarioNome.textContent = nome;
  if (usuarioMatricula) usuarioMatricula.textContent = matricula;
  if (usuarioFuncao) usuarioFuncao.textContent = funcao;
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

// ========== LOGIN USUÁRIO ==========
window.loginUsuario = async function () {
  const input = document.getElementById('matriculaUsuario');
  const loginBtn = document.getElementById('loginUsuarioBtn');
  
  if (!input) {
    alert('Campo de matrícula não encontrado');
    return;
  }

  const matricula = input.value.trim().toUpperCase();

  if (!matricula) {
    alert('Informe sua matrícula');
    input.focus();
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
    
    const snap = await getColaborador(matricula);

    if (!snap.exists()) {
      alert('❌ Matrícula não encontrada. Procure o RH ou o Gestor de QSSMA.');
      input.focus();
      return;
    }

    const dados = snap.data();

    if (!dados.ativo) {
      alert('❌ Colaborador inativo. Contate a administração.');
      return;
    }

    localStorage.setItem('usuario_matricula', matricula);
    localStorage.setItem('usuario_nome', dados.nome || 'Colaborador');
    localStorage.setItem('usuario_funcao', dados.funcao || '');
    localStorage.setItem('perfil_ativo', 'usuario');
    
    estadoApp.usuario = { 
      matricula, 
      nome: dados.nome || 'Colaborador',
      funcao: dados.funcao || '',
      setor: 'Segurança'
    };
    
    updateUserStatus(dados.nome, matricula, dados.funcao || '');
    
    mostrarTela('tela-usuario');
    iniciarMonitoramentoAvisos();
    
    console.log('✅ Usuário autenticado:', dados.nome);

  } catch (erro) {
    console.error('Erro Firebase:', erro);
    alert('❌ Erro ao validar matrícula. Verifique sua conexão e tente novamente.');
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    }
  }
};

// ========== LOGIN GESTOR ==========
window.loginGestor = async function () {
  const email = document.getElementById('gestorEmail').value;
  const senha = document.getElementById('gestorSenha').value;
  const loginBtn = document.getElementById('loginGestorBtn');
  
  if (!email || !senha) {
    alert('Preencha e-mail e senha');
    return;
  }
  
  try {
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
    
    const user = await loginEmailSenha(email, senha);
    
    localStorage.setItem('gestor_logado', 'true');
    localStorage.setItem('gestor_email', email);
    localStorage.setItem('gestor_nome', 'Gestor QSSMA');
    localStorage.setItem('perfil_ativo', 'gestor');
    
    estadoApp.gestor = { 
      email, 
      nome: 'Gestor QSSMA'
    };
    
    mostrarTela('tela-gestor-dashboard');
    iniciarMonitoramentoAvisos();
    carregarEstatisticas();
    
    console.log('✅ Gestor logado com sucesso');
    
  } catch (error) {
    console.error('Erro login gestor:', error);
    alert(`❌ ${error.message}`);
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    }
  }
};

// ========== LOGOUT ==========
window.logout = function () {
  if (estadoApp.unsubscribeAvisos) estadoApp.unsubscribeAvisos();
  
  estadoApp = {
    usuario: null,
    gestor: null,
    perfil: null,
    unsubscribeAvisos: null,
    avisosAtivos: [],
    estatisticas: null,
    modoAltoContraste: false
  };
  
  localStorage.removeItem('perfil_ativo');
  localStorage.removeItem('usuario_matricula');
  localStorage.removeItem('usuario_nome');
  localStorage.removeItem('usuario_funcao');
  localStorage.removeItem('gestor_logado');
  localStorage.removeItem('gestor_email');
  localStorage.removeItem('gestor_nome');
  
  const userStatus = document.getElementById('userStatus');
  if (userStatus) userStatus.style.display = 'none';
  
  mostrarTela('welcome');
  
  console.log('👋 Usuário deslogado');
};

// ========== BOTÕES DE INSPEÇÃO (COM IFRAME) ==========
window.abrirFormularioInterno = function(tipo, url) {
  const iframeContainer = document.getElementById('iframeContainer');
  const iframe = document.getElementById('formIframe');
  const formTitle = document.getElementById('formTitle');
  
  if (!iframeContainer || !iframe || !formTitle) return;
  
  let titulo = '';
  switch(tipo) {
    case 'evento':
      titulo = 'INFORME DE EVENTO';
      break;
    case 'radar':
      titulo = 'RADAR MÓVEL DE VELOCIDADE';
      break;
    case 'flash':
      titulo = 'FLASH REPORT';
      break;
  }
  
  formTitle.textContent = titulo;
  iframe.src = url;
  
  mostrarTela('tela-formulario-iframe');
  
  // Registrar ação
  if (estadoApp.usuario) {
    console.log(`📝 ${estadoApp.usuario.nome} abriu ${titulo}`);
  }
};

window.fecharFormulario = function() {
  const iframe = document.getElementById('formIframe');
  if (iframe) {
    iframe.src = 'about:blank';
  }
  
  if (estadoApp.perfil === 'usuario') {
    mostrarTela('tela-usuario');
  } else {
    mostrarTela('tela-gestor-dashboard');
  }
};

// ========== SUPORTE WHATSAPP ==========
window.abrirSuporteWhatsApp = function() {
  const telefone = '559392059914';
  const mensagem = encodeURIComponent('Olá! Preciso de suporte no Portal QSSMA.');
  const url = `https://wa.me/${telefone}?text=${mensagem}`;
  
  window.open(url, '_blank', 'noopener,noreferrer');
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
  });
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
        <small>${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleDateString('pt-BR') : ''}</small>
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
      <div class="modal-footer">
        <button class="btn" onclick="this.parentElement.parentElement.remove()">Fechar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
};

// ========== GESTÃO DE AVISOS (GESTOR) ==========
window.gerenciarAvisos = async function() {
  try {
    showLoading('Carregando avisos...');
    
    const avisos = await getAvisos();
    estadoApp.avisosAtivos = avisos;
    
    const modal = document.createElement('div');
    modal.className = 'modal-back';
    modal.innerHTML = `
      <div class="modal large">
        <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
        <h3><i class="fas fa-bullhorn"></i> Gerenciar Avisos</h3>
        
        <div class="admin-actions-bar">
          <button class="btn success" onclick="criarNovoAviso()">
            <i class="fas fa-plus"></i> Novo Aviso
          </button>
        </div>
        
        <div class="avisos-admin-list">
          ${avisos.length === 0 ? `
            <div class="empty-state">
              <i class="fas fa-bullhorn"></i>
              <h4>Nenhum aviso cadastrado</h4>
              <p>Clique em "Novo Aviso" para criar o primeiro.</p>
            </div>
          ` : avisos.map(aviso => `
            <div class="aviso-admin-item" id="aviso-${aviso.id}">
              <div class="aviso-admin-header">
                <div>
                  <h4>${aviso.titulo}</h4>
                  <small class="aviso-destino-badge">Para: ${aviso.destino || 'Todos'}</small>
                  <small class="aviso-data">${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleString('pt-BR') : ''}</small>
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
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
  } catch (erro) {
    console.error('Erro ao carregar avisos:', erro);
    alert('❌ Erro ao carregar avisos');
  } finally {
    hideLoading();
  }
};

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
          <option value="usuarios">Usuários</option>
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
    
    await registrarAviso({
      titulo: titulo,
      mensagem: mensagem,
      destino: destino,
      ativo: ativo,
      timestamp: new Date()
    });
    
    mostrarNotificacao('✅ Aviso Criado', 'Aviso criado com sucesso!');
    
    document.querySelector('.modal-back').remove();
    gerenciarAvisos();
    
  } catch (erro) {
    console.error('Erro ao salvar aviso:', erro);
    alert('❌ Erro ao salvar aviso');
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
            <option value="usuarios" ${aviso.destino === 'usuarios' ? 'selected' : ''}>Usuários</option>
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
    gerenciarAvisos();
    
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
    
  } catch (erro) {
    console.error('Erro ao excluir aviso:', erro);
    alert('❌ Erro ao excluir aviso');
  } finally {
    hideLoading();
  }
};

// ========== ESTATÍSTICAS DASHBOARD ==========
async function carregarEstatisticas() {
  try {
    const estatisticas = await getEstatisticasDashboard();
    estadoApp.estatisticas = estatisticas;
    
    const totalAvisos = document.getElementById('totalAvisos');
    const eventosHoje = document.getElementById('eventosHoje');
    const totalColaboradores = document.getElementById('totalColaboradores');
    
    if (totalAvisos) totalAvisos.textContent = estatisticas.totalAvisos;
    if (eventosHoje) eventosHoje.textContent = estatisticas.eventosHoje;
    if (totalColaboradores) totalColaboradores.textContent = estatisticas.totalColaboradores;
    
  } catch (erro) {
    console.error('Erro ao carregar estatísticas:', erro);
  }
}

// ========== MODO ALTO CONTRASTE ==========
function initAltoContraste() {
  const altoContrasteBtn = document.getElementById('altoContrasteBtn');
  if (altoContrasteBtn) {
    altoContrasteBtn.addEventListener('click', toggleAltoContraste);
    
    const salvo = localStorage.getItem('alto_contraste');
    if (salvo === 'true') {
      toggleAltoContraste();
    }
  }
}

function toggleAltoContraste() {
  estadoApp.modoAltoContraste = !estadoApp.modoAltoContraste;
  
  if (estadoApp.modoAltoContraste) {
    document.body.classList.add('alto-contraste');
    localStorage.setItem('alto_contraste', 'true');
    mostrarNotificacao('🌞 Modo Externo', 'Alto contraste ativado para melhor visibilidade');
  } else {
    document.body.classList.remove('alto-contraste');
    localStorage.setItem('alto_contraste', 'false');
  }
}

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
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ========== NOTIFICAÇÕES ==========
function mostrarNotificacao(titulo, mensagem) {
  if (!("Notification" in window)) {
    console.log("Este navegador não suporta notificações desktop");
    return;
  }
  
  if (Notification.permission === "granted") {
    criarNotificacao(titulo, mensagem);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        criarNotificacao(titulo, mensagem);
      }
    });
  }
  
  criarNotificacaoTela(titulo, mensagem);
}

function criarNotificacao(titulo, mensagem) {
  const notification = new Notification(titulo, {
    body: mensagem,
    icon: 'logo.jpg',
    tag: 'portal-qssma'
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

// ========== FUNÇÕES DE TEMAS E PWA ==========
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
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('qssma_dark', isDark ? '1' : '0');
  updateDarkModeIcon(isDark);
}

function updateDarkModeIcon(isDark) {
  const darkToggle = document.getElementById('darkToggle');
  if (!darkToggle) return;
  
  darkToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  darkToggle.setAttribute('title', isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro');
}

function initPWA() {
  const installBtn = document.getElementById('installBtn');
  if (!installBtn) return;
  
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'flex';
    console.log('📱 PWA pode ser instalado');
    
    // Mostrar aviso PWA na tela inicial
    const pwaAviso = document.createElement('div');
    pwaAviso.className = 'alert-card pwa-alert';
    pwaAviso.innerHTML = `
      <div class="alert-icon">
        <i class="fas fa-mobile-alt"></i>
      </div>
      <div class="alert-content">
        <strong>Para melhor experiência, adicione este app à sua tela inicial</strong>
        <p>Clique no botão "Instalar" acima para acesso rápido.</p>
      </div>
    `;
    
    const welcomeText = document.querySelector('.welcome-text');
    if (welcomeText) {
      welcomeText.appendChild(pwaAviso);
    }
  });
  
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
    } else {
      console.log('❌ Usuário recusou a instalação');
    }
    
    deferredPrompt = null;
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA instalado com sucesso');
    installBtn.style.display = 'none';
  });
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    installBtn.style.display = 'none';
  }
}

// ========== FUNÇÕES DE CONEXÃO ==========
function initConnectionMonitor() {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  updateOnlineStatus();
}

function updateOnlineStatus() {
  const statusElement = document.getElementById('connectionStatus');
  const offlineBanner = document.getElementById('offlineBanner');
  
  if (statusElement) {
    statusElement.style.color = navigator.onLine ? '#4CAF50' : '#FF5722';
    statusElement.title = navigator.onLine ? 'Online' : 'Offline';
  }
  
  if (offlineBanner) {
    offlineBanner.style.display = navigator.onLine ? 'none' : 'block';
  }
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

function initEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
  
  document.querySelectorAll('.modal-back').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal-back').forEach(modal => {
    modal.remove();
  });
}

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

// Botão de Pânico Flutuante
function criarBotaoPanico() {
  if (estadoApp.perfil && estadoApp.perfil !== 'welcome') {
    const botaoPanico = document.createElement('button');
    botaoPanico.className = 'botao-panico-flutuante';
    botaoPanico.innerHTML = '<i class="fas fa-phone-alt"></i>';
    botaoPanico.setAttribute('title', 'Emergência - Suporte QSSMA');
    botaoPanico.onclick = abrirSuporteWhatsApp;
    
    document.body.appendChild(botaoPanico);
  }
}

// Chamar após mudança de tela
window.mostrarTela = (function(original) {
  return function(id) {
    original(id);
    
    // Remover botão anterior se existir
    const botaoAntigo = document.querySelector('.botao-panico-flutuante');
    if (botaoAntigo) {
      botaoAntigo.remove();
    }
    
    // Criar novo botão se não for tela inicial
    if (id !== 'welcome' && id !== 'telaEscolhaPerfil') {
      criarBotaoPanico();
    }
  };
})(window.mostrarTela);

console.log('🚀 Portal QSSMA carregado com sucesso!');
