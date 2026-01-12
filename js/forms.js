// forms.js - Gerenciamento de formulários embutidos
import { showToast } from './notifications.js';
import { loadScreen } from './state.js';

// URLs dos formulários Google
const FORM_URLS = {
  evento: 'https://forms.gle/4kxcxyYX8wzdDyDt5',
  radar: 'https://forms.gle/BZahsh5ZAAVyixjx5',
  flash: 'https://forms.gle/9d6f4w7hcpyDSCCs5'
};

// Títulos dos formulários
const FORM_TITLES = {
  evento: 'Informe de Evento',
  radar: 'Radar Móvel',
  flash: 'Flash Report'
};

// Abrir formulário em iframe
export function openFormEmbed(formType) {
  const url = FORM_URLS[formType];
  const title = FORM_TITLES[formType];
  
  if (!url) {
    showToast('❌', 'Formulário não encontrado', 'error');
    return;
  }
  
  loadScreen('form-embed', { url, title });
}

// Renderizar tela de formulário embutido
export async function renderFormEmbed(url, title) {
  return `
    <header class="app-header">
      <button class="icon-btn back-btn" onclick="loadScreen('user-dashboard')">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>${title}</h1>
      <button class="icon-btn" onclick="toggleFullscreen()" title="Tela cheia">
        <i class="fas fa-expand"></i>
      </button>
    </header>
    
    <main class="container">
      <section class="form-embed-screen">
        <div class="form-header">
          <h2>${title}</h2>
          <p>Preencha o formulário abaixo. Todos os campos são importantes.</p>
        </div>
        
        <div class="form-container">
          <iframe 
            src="${url}?embedded=true" 
            class="google-form-iframe"
            title="${title}"
            frameborder="0"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
        
        <div class="form-footer">
          <div class="alert-card info">
            <i class="fas fa-info-circle"></i>
            <div class="alert-content">
              <p><strong>Importante:</strong> Após enviar o formulário, você será redirecionado de volta ao dashboard.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
}

// Toggle fullscreen para o iframe
window.toggleFullscreen = function() {
  const iframe = document.querySelector('.google-form-iframe');
  if (!iframe) return;
  
  if (!document.fullscreenElement) {
    iframe.requestFullscreen().catch(err => {
      console.error('Erro ao entrar em tela cheia:', err);
    });
  } else {
    document.exitFullscreen();
  }
};

// Monitorar envio de formulário (detecção básica)
function monitorFormSubmission() {
  const iframe = document.querySelector('.google-form-iframe');
  if (!iframe) return;
  
  iframe.onload = function() {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const submitMsg = iframeDoc.querySelector('.freebirdFormviewerViewResponseConfirmationMessage');
      
      if (submitMsg && submitMsg.textContent.includes('Obrigado')) {
        showToast('✅', 'Formulário enviado com sucesso!', 'success');
        setTimeout(() => loadScreen('user-dashboard'), 2000);
      }
    } catch (e) {
      // Cross-origin restriction, não podemos acessar o conteúdo
    }
  };
}

// Inicializar monitoramento quando a tela carregar
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash === '#form-embed') {
    monitorFormSubmission();
  }
});
