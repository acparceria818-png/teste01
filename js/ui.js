// ui.js - Componentes de interface do usuário
import { showToast } from './notifications.js';

// Inicializar componentes UI
export function initUIComponents() {
  setupModals();
  setupSkeletonLoading();
  setupKeyboardNavigation();
  setupAriaLiveRegions();
}

// Configurar modais
function setupModals() {
  document.addEventListener('click', (e) => {
    // Fechar modal ao clicar fora
    if (e.target.classList.contains('modal-back')) {
      closeModal();
    }
    
    // Fechar modal com ESC
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// Modal functions
let currentModal = null;

export function showModal(title, content, options = {}) {
  // Fechar modal anterior se existir
  if (currentModal) {
    closeModal();
  }
  
  const modalId = 'modal-' + Date.now();
  const modalHTML = `
    <div id="${modalId}" class="modal-back" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
      <div class="modal">
        <div class="modal-header">
          <h3 id="${modalId}-title">${title}</h3>
          <button class="close" onclick="closeModal()" aria-label="Fechar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  currentModal = document.getElementById(modalId);
  
  // Focar no primeiro elemento interativo
  setTimeout(() => {
    const firstInput = currentModal.querySelector('input, button, select, textarea');
    if (firstInput) firstInput.focus();
  }, 100);
}

export function closeModal() {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }
}

// Skeleton loading
function setupSkeletonLoading() {
  // Adicionar skeleton loading em elementos com data-skeleton
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-skeleton]').forEach(el => {
      el.classList.add('skeleton');
    });
  });
}

// Navegação por teclado
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Tab navigation in modals
    if (currentModal && e.key === 'Tab') {
      const focusableElements = currentModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}

// Aria live regions
function setupAriaLiveRegions() {
  // Criar região para notificações dinâmicas
  const liveRegion = document.createElement('div');
  liveRegion.id = 'aria-live-region';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.position = 'absolute';
  liveRegion.style.width = '1px';
  liveRegion.style.height = '1px';
  liveRegion.style.overflow = 'hidden';
  liveRegion.style.clip = 'rect(0,0,0,0)';
  document.body.appendChild(liveRegion);
}

// Announce para screen readers
export function announceToScreenReader(message) {
  const liveRegion = document.getElementById('aria-live-region');
  if (liveRegion) {
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  }
}

// Form validation
export function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;
  
  const inputs = form.querySelectorAll('[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('invalid');
      isValid = false;
    } else {
      input.classList.remove('invalid');
    }
  });
  
  return isValid;
}

// Add ripple effect to buttons
export function addRippleEffect() {
  document.addEventListener('click', (e) => {
    const button = e.target.closest('.btn, .icon-btn');
    if (button) {
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    }
  });
}

// Expor funções globais
window.showModal = showModal;
window.closeModal = closeModal;
