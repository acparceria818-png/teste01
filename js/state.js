// state.js - Gerenciamento de estado global
import { showToast } from './notifications.js';
import { loadDashboard } from './dashboard.js';
import { loadUserScreen } from './auth.js';
import { loadFormScreen } from './forms.js';

// Estado global da aplicação
const state = {
  user: null,
  role: null,
  isOnline: navigator.onLine,
  avisos: [],
  statistics: null,
  theme: 'light',
  highContrast: false,
  currentScreen: 'welcome'
};

// Getter/Setter para o estado
export function getState() {
  return { ...state };
}

export function setState(updates) {
  Object.assign(state, updates);
  persistState();
  notifyStateChange();
}

// Persistir estado no localStorage
function persistState() {
  const toPersist = {
    user: state.user,
    role: state.role,
    theme: state.theme,
    highContrast: state.highContrast
  };
  localStorage.setItem('qssma_state', JSON.stringify(toPersist));
}

// Restaurar estado do localStorage
export function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem('qssma_state') || '{}');
    Object.assign(state, saved);
    return state;
  } catch (error) {
    console.error('Erro ao restaurar estado:', error);
    return state;
  }
}

// Notificar mudanças no estado (para observers futuros)
function notifyStateChange() {
  // Em uma aplicação maior, usaríamos um event bus ou observables
  console.log('Estado atualizado:', state);
}

// Gerenciamento de telas
export async function loadScreen(screenId, params = {}) {
  try {
    setState({ currentScreen: screenId });
    
    // Limpar tela atual
    const app = document.getElementById('app');
    if (!app) return;
    
    // Renderizar tela baseada no ID
    switch(screenId) {
      case 'welcome':
        app.innerHTML = await renderWelcomeScreen();
        break;
      case 'profile-select':
        app.innerHTML = await renderProfileSelectScreen();
        break;
      case 'user-login':
        app.innerHTML = await renderUserLoginScreen();
        break;
      case 'gestor-login':
        app.innerHTML = await renderGestorLoginScreen();
        break;
      case 'user-dashboard':
        app.innerHTML = await renderUserDashboard();
        break;
      case 'gestor-dashboard':
        app.innerHTML = await renderGestorDashboard();
        break;
      case 'form-embed':
        app.innerHTML = await renderFormEmbed(params.url, params.title);
        break;
      default:
        app.innerHTML = await renderWelcomeScreen();
    }
    
    // Atualizar header
    updateHeader();
    
    // Adicionar event listeners específicos da tela
    addScreenEventListeners(screenId);
    
    // Mostrar/ocultar botão de pânico
    updatePanicButtonVisibility(screenId);
    
  } catch (error) {
    console.error('Erro ao carregar tela:', error);
    showToast('❌', 'Erro ao carregar tela', 'error');
  }
}

// Funções de renderização (simplificadas - implemente conforme necessário)
async function renderWelcomeScreen() {
  return `
    <header class="app-header">
      <img src="assets/logo.jpg" alt="Logo QSSMA" class="logo" loading="lazy" />
      <h1>PORTAL QSSMA</h1>
      <div class="header-actions">
        <button class="icon-btn" id="themeToggle">
          <i class="fas fa-sun"></i>
        </button>
        <button class="icon-btn" id="contrastToggle" title="Alto Contraste">
          <i class="fas fa-adjust"></i>
        </button>
      </div>
    </header>
    
    <main class="container">
      <section class="welcome-screen">
        <div class="welcome-content">
          <div class="avatar-container">
            <img src="assets/avatar.png" class="avatar-large" alt="Avatar QSSMA" loading="lazy" />
          </div>
          <div class="welcome-text">
            <h2><i class="fas fa-shield-alt"></i> Bem-vindo ao Portal QSSMA</h2>
            <p class="welcome-subtitle">Sistema de gestão e registro de eventos de segurança da empresa.</p>
            
            <div class="pwa-promo">
              <i class="fas fa-mobile-alt"></i>
              <p>Para melhor experiência, instale este app em seu dispositivo</p>
              <button class="btn btn-outline" id="installPromptBtn">
                <i class="fas fa-download"></i> Instalar App
              </button>
            </div>
            
            <button class="btn btn-primary btn-large" onclick="loadScreen('profile-select')">
              <i class="fas fa-sign-in-alt"></i> Acessar Portal
            </button>
          </div>
        </div>
      </section>
    </main>
  `;
}

async function renderProfileSelectScreen() {
  return `
    <header class="app-header">
      <button class="icon-btn back-btn" onclick="loadScreen('welcome')">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>Selecione seu Perfil</h1>
      <div class="header-actions">
        <button class="icon-btn" id="themeToggle">
          <i class="fas fa-sun"></i>
        </button>
      </div>
    </header>
    
    <main class="container">
      <section class="profile-select-screen">
        <div class="cards-grid">
          <div class="profile-card" onclick="loadScreen('user-login')">
            <div class="card-icon usuario">
              <i class="fas fa-user-shield"></i>
            </div>
            <h3>Colaborador</h3>
            <p>Acesso para registro de eventos e inspeções de segurança</p>
            <div class="card-features">
              <span><i class="fas fa-clipboard-check"></i> Registros</span>
              <span><i class="fas fa-search"></i> Inspeções</span>
              <span><i class="fas fa-bell"></i> Avisos</span>
            </div>
          </div>
          
          <div class="profile-card" onclick="loadScreen('gestor-login')">
            <div class="card-icon gestor">
              <i class="fas fa-cogs"></i>
            </div>
            <h3>Gestor</h3>
            <p>Acesso administrativo para gestão do sistema QSSMA</p>
            <div class="card-features">
              <span><i class="fas fa-chart-line"></i> Dashboard</span>
              <span><i class="fas fa-users"></i> Colaboradores</span>
              <span><i class="fas fa-bullhorn"></i> Avisos</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
}

function updateHeader() {
  // Implementação do header dinâmico
}

function addScreenEventListeners(screenId) {
  // Adicionar listeners específicos para cada tela
}

function updatePanicButtonVisibility(screenId) {
  const panicContainer = document.getElementById('panicButtonContainer');
  if (!panicContainer) return;
  
  const noPanicScreens = ['welcome', 'profile-select', 'user-login', 'gestor-login'];
  if (noPanicScreens.includes(screenId)) {
    panicContainer.classList.add('hidden');
  } else {
    panicContainer.classList.remove('hidden');
  }
}
