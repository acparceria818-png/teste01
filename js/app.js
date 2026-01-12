// app.js - Bootstrap do Portal QSSMA
import { initTheme } from './theme.js';
import { initPWA, showInstallPrompt } from './pwa.js';
import { initConnectionMonitor, updateOnlineStatus } from './utils.js';
import { initPanicButton } from './emergency.js';
import { showToast } from './notifications.js';
import { checkSession, handleLogout } from './auth.js';
import { initUIComponents } from './ui.js';
import { loadScreen } from './state.js';

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Portal QSSMA - Inicializando...');
  
  try {
    // Inicializar componentes básicos
    initTheme();
    initPWA();
    initConnectionMonitor();
    initUIComponents();
    initPanicButton();
    
    // Verificar sessão existente
    await checkSession();
    
    // Mostrar prompt de instalação se apropriado
    setTimeout(() => {
      if (window.matchMedia('(display-mode: browser)').matches && 
          localStorage.getItem('install_prompt_shown') !== 'true') {
        showInstallPrompt();
        localStorage.setItem('install_prompt_shown', 'true');
      }
    }, 3000);
    
    console.log('✅ Portal QSSMA inicializado com sucesso');
    showToast('✅', 'Sistema pronto para uso', 'success');
    
  } catch (error) {
    console.error('Erro na inicialização:', error);
    showToast('❌', 'Erro ao inicializar o sistema', 'error');
  }
});

// Expor funções globais
window.handleLogout = handleLogout;
window.loadScreen = loadScreen;
window.showToast = showToast;
