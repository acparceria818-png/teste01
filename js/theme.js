// theme.js - Gerenciamento de tema e alto contraste
import { getState, setState } from './state.js';

// Inicializar tema
export function initTheme() {
  const savedTheme = localStorage.getItem('qssma_theme') || 'light';
  const savedContrast = localStorage.getItem('qssma_high_contrast') === 'true';
  
  setState({
    theme: savedTheme,
    highContrast: savedContrast
  });
  
  applyTheme(savedTheme, savedContrast);
  setupThemeListeners();
}

// Aplicar tema
function applyTheme(theme, highContrast) {
  document.body.classList.remove('light', 'dark', 'high-contrast');
  document.body.classList.add(theme);
  
  if (highContrast) {
    document.body.classList.add('high-contrast');
  }
  
  // Atualizar ícone
  updateThemeIcon(theme, highContrast);
}

// Atualizar ícone do botão de tema
function updateThemeIcon(theme, highContrast) {
  const themeBtn = document.getElementById('themeToggle');
  const contrastBtn = document.getElementById('contrastToggle');
  
  if (themeBtn) {
    themeBtn.innerHTML = theme === 'dark' ? 
      '<i class="fas fa-sun"></i>' : 
      '<i class="fas fa-moon"></i>';
    themeBtn.title = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
  }
  
  if (contrastBtn) {
    contrastBtn.innerHTML = highContrast ? 
      '<i class="fas fa-adjust"></i>' : 
      '<i class="fas fa-adjust"></i>';
    contrastBtn.title = highContrast ? 'Normal' : 'Alto contraste';
  }
}

// Configurar listeners
function setupThemeListeners() {
  // Toggle tema claro/escuro
  document.addEventListener('click', (e) => {
    if (e.target.closest('#themeToggle')) {
      toggleTheme();
    }
    
    if (e.target.closest('#contrastToggle')) {
      toggleHighContrast();
    }
  });
  
  // Detectar preferência do sistema
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('qssma_theme')) {
      const theme = e.matches ? 'dark' : 'light';
      setState({ theme });
      applyTheme(theme, getState().highContrast);
    }
  });
}

// Alternar tema claro/escuro
function toggleTheme() {
  const state = getState();
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  
  setState({ theme: newTheme });
  localStorage.setItem('qssma_theme', newTheme);
  applyTheme(newTheme, state.highContrast);
}

// Alternar alto contraste
function toggleHighContrast() {
  const state = getState();
  const newContrast = !state.highContrast;
  
  setState({ highContrast: newContrast });
  localStorage.setItem('qssma_high_contrast', newContrast.toString());
  applyTheme(state.theme, newContrast);
}

// Obter cores baseadas no tema
export function getThemeColors() {
  const state = getState();
  
  if (state.highContrast) {
    return {
      primary: '#000000',
      secondary: '#ffffff',
      background: '#ffffff',
      text: '#000000',
      danger: '#ff0000',
      warning: '#ffff00',
      success: '#00ff00',
      info: '#0000ff'
    };
  }
  
  return state.theme === 'dark' ? {
    primary: '#ff5252',
    secondary: '#4a6572',
    background: '#1a1a2e',
    text: '#e0e0e0',
    danger: '#ff5252',
    warning: '#ffb74d',
    success: '#69f0ae',
    info: '#40c4ff'
  } : {
    primary: '#b00000',
    secondary: '#2c3e50',
    background: '#f8f9fa',
    text: '#343a40',
    danger: '#e74c3c',
    warning: '#f39c12',
    success: '#27ae60',
    info: '#3498db'
  };
}
