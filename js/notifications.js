// notifications.js - Sistema de notificações e toasts
import { announceToScreenReader } from './ui.js';

// Tipos de toast
const TOAST_TYPES = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info'
};

// Mostrar toast notification
export function showToast(icon, message, type = 'info', duration = 5000) {
  // Criar container se não existir
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  // Criar toast
  const toastId = 'toast-' + Date.now();
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <p>${message}</p>
    </div>
    <button class="toast-close" onclick="document.getElementById('${toastId}').remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Adicionar ao container
  container.appendChild(toast);
  
  // Anunciar para leitores de tela
  announceToScreenReader(message);
  
  // Remover automaticamente após duração
  setTimeout(() => {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
      toastElement.classList.add('fade-out');
      setTimeout(() => toastElement.remove(), 300);
    }
  }, duration);
  
  return toastId;
}

// Mostrar notificação do sistema (se permitido)
export function showSystemNotification(title, message) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    createSystemNotification(title, message);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        createSystemNotification(title, message);
      }
    });
  }
}

// Criar notificação do sistema
function createSystemNotification(title, message) {
  const notification = new Notification(title, {
    body: message,
    icon: 'assets/logo.jpg',
    badge: 'assets/logo.jpg',
    tag: 'portal-qssma',
    requireInteraction: true,
    vibrate: [200, 100, 200]
  });
  
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  
  return notification;
}

// Confirm dialog
export function showConfirm(message, callback) {
  const modalHTML = `
    <div class="confirm-dialog">
      <div class="confirm-content">
        <p>${message}</p>
      </div>
      <div class="confirm-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="handleConfirm()">Confirmar</button>
      </div>
    </div>
  `;
  
  showModal('Confirmação', modalHTML);
  
  window.handleConfirm = () => {
    closeModal();
    if (callback) callback();
  };
}

// Error handler padronizado
export function handleError(error, context = '') {
  console.error(`Erro ${context}:`, error);
  
  let userMessage = 'Ocorreu um erro inesperado.';
  
  if (error.message.includes('network') || error.message.includes('offline')) {
    userMessage = 'Verifique sua conexão com a internet.';
  } else if (error.message.includes('permission') || error.message.includes('access')) {
    userMessage = 'Você não tem permissão para realizar esta ação.';
  } else if (error.message.includes('not found')) {
    userMessage = 'Recurso não encontrado.';
  }
  
  showToast('❌', `${userMessage} ${context ? `(${context})` : ''}`, 'error');
}

// Expor funções globais
window.showToast = showToast;
window.showConfirm = showConfirm;
