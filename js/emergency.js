// emergency.js - Botão de pânico e emergência
import { showConfirm } from './notifications.js';
import { getState } from './state.js';

// Números de emergência
const EMERGENCY_NUMBERS = {
  bombeiros: '193',
  ambulancia: '192',
  policia: '190',
  qssma: '559392059914'
};

// Inicializar botão de pânico
export function initPanicButton() {
  createPanicButton();
  setupEmergencyListeners();
}

// Criar botão de pânico
function createPanicButton() {
  const container = document.createElement('div');
  container.id = 'panicButtonContainer';
  container.className = 'panic-button-container hidden';
  
  container.innerHTML = `
    <button id="panicButton" class="panic-button" aria-label="Botão de pânico - SOS">
      <div class="panic-icon">
        <i class="fas fa-phone-alt"></i>
      </div>
      <span class="panic-label">SOS</span>
    </button>
    <div class="emergency-menu" id="emergencyMenu">
      <button class="emergency-option" data-number="192">
        <i class="fas fa-ambulance"></i> Ambulância (192)
      </button>
      <button class="emergency-option" data-number="193">
        <i class="fas fa-fire"></i> Bombeiros (193)
      </button>
      <button class="emergency-option" data-number="190">
        <i class="fas fa-shield-alt"></i> Polícia (190)
      </button>
      <button class="emergency-option" data-number="559392059914">
        <i class="fas fa-user-shield"></i> Gestor QSSMA
      </button>
    </div>
  `;
  
  document.body.appendChild(container);
}

// Configurar listeners de emergência
function setupEmergencyListeners() {
  document.addEventListener('click', (e) => {
    const state = getState();
    
    // Só mostrar em telas autorizadas
    const noPanicScreens = ['welcome', 'profile-select', 'user-login', 'gestor-login'];
    const container = document.getElementById('panicButtonContainer');
    
    if (container && !noPanicScreens.includes(state.currentScreen)) {
      container.classList.remove('hidden');
    } else if (container) {
      container.classList.add('hidden');
    }
    
    // Botão de pânico principal
    if (e.target.closest('#panicButton')) {
      toggleEmergencyMenu();
    }
    
    // Opções de emergência
    if (e.target.closest('.emergency-option')) {
      const option = e.target.closest('.emergency-option');
      const number = option.dataset.number;
      const service = option.textContent.trim();
      
      showConfirm(`Deseja ligar para ${service}?`, () => {
        makeEmergencyCall(number);
      });
      
      hideEmergencyMenu();
    }
    
    // Fechar menu ao clicar fora
    if (!e.target.closest('#panicButtonContainer')) {
      hideEmergencyMenu();
    }
  });
}

// Alternar menu de emergência
function toggleEmergencyMenu() {
  const menu = document.getElementById('emergencyMenu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

// Ocultar menu de emergência
function hideEmergencyMenu() {
  const menu = document.getElementById('emergencyMenu');
  if (menu) {
    menu.classList.remove('show');
  }
}

// Fazer chamada de emergência
function makeEmergencyCall(number) {
  console.log(`🆘 Chamando emergência: ${number}`);
  
  // Tentar ligação direta
  window.open(`tel:${number}`, '_self');
  
  // Backup: abrir no WhatsApp se não conseguir ligar
  setTimeout(() => {
    if (number.length > 3) { // Não é 192/193/190
      window.open(`https://wa.me/${number}?text=EMERGÊNCIA%20QSSMA%20-%20Preciso%20de%20ajuda%20urgente!`, '_blank');
    }
  }, 1000);
}

// Vibrar dispositivo (se suportado)
export function vibrateDevice(pattern = [200, 100, 200]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
