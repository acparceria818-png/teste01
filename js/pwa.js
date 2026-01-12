// pwa.js - Gerenciamento de instalação PWA
import { showToast } from './notifications.js';

let deferredPrompt = null;
let installPromptShown = false;

// Inicializar PWA
export function initPWA() {
  // Antes do prompt de instalação
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar botão de instalação se apropriado
    if (!installPromptShown && window.matchMedia('(display-mode: browser)').matches) {
      showInstallButton();
    }
  });
  
  // Após instalação
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA instalado com sucesso');
    deferredPrompt = null;
    hideInstallButton();
    showToast('✅', 'Aplicativo instalado com sucesso!', 'success');
  });
  
  // Verificar se já está instalado
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 Aplicativo está rodando como PWA');
  }
}

// Mostrar botão de instalação
function showInstallButton() {
  const installBtn = document.getElementById('installPromptBtn');
  if (installBtn) {
    installBtn.style.display = 'flex';
    installBtn.addEventListener('click', handleInstallClick);
  }
}

// Ocultar botão de instalação
function hideInstallButton() {
  const installBtn = document.getElementById('installPromptBtn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
}

// Manipular clique na instalação
async function handleInstallClick() {
  if (!deferredPrompt) {
    showToast('ℹ️', 'Este app já está instalado', 'info');
    return;
  }
  
  try {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('✅ Usuário aceitou a instalação');
      installPromptShown = true;
    } else {
      console.log('❌ Usuário recusou a instalação');
    }
    
    deferredPrompt = null;
    
  } catch (error) {
    console.error('Erro na instalação:', error);
    showToast('❌', 'Erro ao instalar o aplicativo', 'error');
  }
}

// Mostrar prompt de instalação
export function showInstallPrompt() {
  showToast('📱', 'Instale este app para melhor experiência', 'info', 8000);
  
  // Adicionar botão de instalação na toast
  setTimeout(() => {
    const toast = document.querySelector('.toast:last-child');
    if (toast && deferredPrompt) {
      const installBtn = document.createElement('button');
      installBtn.className = 'btn btn-small btn-outline';
      installBtn.innerHTML = '<i class="fas fa-download"></i> Instalar';
      installBtn.onclick = handleInstallClick;
      toast.querySelector('.toast-content').appendChild(installBtn);
    }
  }, 100);
}

// Verificar atualizações do Service Worker
export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.update();
      }
    });
  }
}
