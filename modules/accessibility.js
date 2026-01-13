// modules/accessibility.js - Acessibilidade e modos especiais
import { showToast } from './ui.js';

let modoExternoAtivo = false;
let altoContrasteAtivo = false;

export function initAcessibilidade() {
  // Verificar preferências salvas
  const modoExterno = localStorage.getItem('modo_externo') === 'true';
  const altoContraste = localStorage.getItem('alto_contraste') === 'true';
  
  if (modoExterno) toggleModoExterno();
  if (altoContraste) toggleContraste();
  
  // Configurar navegação por teclado
  document.body.classList.add('keyboard-nav-ready');
  
  // Adicionar skip link
  addSkipLink();
}

export function toggleModoExterno() {
  modoExternoAtivo = !modoExternoAtivo;
  document.body.setAttribute('data-externo', modoExternoAtivo.toString());
  localStorage.setItem('modo_externo', modoExternoAtivo.toString());
  
  // Atualizar ícone do botão
  const btn = document.getElementById('modoExternoBtn');
  if (btn) {
    btn.innerHTML = modoExternoAtivo ? 
      '<i class="fas fa-sun"></i>' : 
      '<i class="fas fa-sun"></i>';
    btn.title = modoExternoAtivo ? 
      'Desativar modo externo' : 
      'Ativar modo externo (alto contraste para ambiente externo)';
  }
}

export function toggleContraste() {
  altoContrasteAtivo = !altoContrasteAtivo;
  document.body.setAttribute('data-contraste', altoContrasteAtivo.toString());
  localStorage.setItem('alto_contraste', altoContrasteAtivo.toString());
  
  // Atualizar ícone do botão
  const btn = document.getElementById('contrasteToggle');
  if (btn) {
    btn.innerHTML = altoContrasteAtivo ? 
      '<i class="fas fa-adjust"></i>' : 
      '<i class="fas fa-sun"></i>';
    btn.title = altoContrasteAtivo ? 
      'Desativar alto contraste' : 
      'Ativar alto contraste';
  }
}

function addSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Ir para o conteúdo principal';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--primary);
    color: white;
    padding: 8px;
    text-decoration: none;
    z-index: 10000;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  // Adicionar id ao main
  const main = document.querySelector('main');
  if (main) {
    main.id = 'main-content';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
}

export function abrirFormularioInterno(url, titulo) {
  const iframe = document.getElementById('formIframe');
  const formTitulo = document.getElementById('formTitulo');
  
  if (iframe && formTitulo) {
    iframe.src = url;
    formTitulo.textContent = titulo;
    mostrarTela('tela-formulario');
    
    // Anunciar para leitores de tela
    const liveRegion = document.getElementById('liveRegion');
    if (liveRegion) {
      liveRegion.textContent = `Abrindo formulário: ${titulo}`;
    }
  } else {
    // Fallback para abrir em nova aba
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export function fecharFormulario() {
  const iframe = document.getElementById('formIframe');
  if (iframe) {
    iframe.src = '';
  }
  
  // Voltar para a tela anterior baseada no perfil
  const perfil = localStorage.getItem('perfil_ativo');
  if (perfil === 'usuario') {
    mostrarTela('tela-usuario');
  } else if (perfil === 'gestor') {
    mostrarTela('tela-gestor-dashboard');
  }
}

export function abrirSOS() {
  mostrarTela('tela-sos');
  
  // Anunciar emergência
  const liveRegion = document.getElementById('liveRegion');
  if (liveRegion) {
    liveRegion.textContent = 'Tela de emergência SOS aberta. Use com cuidado.';
  }
  
  // Mostrar instruções de voz
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(
      'Tela de emergência aberta. Contatos de emergência disponíveis.'
    );
    utterance.lang = 'pt-BR';
    speechSynthesis.speak(utterance);
  }
}

export function fecharSOS() {
  // Voltar para a tela anterior
  const perfil = localStorage.getItem('perfil_ativo');
  if (perfil === 'usuario') {
    mostrarTela('tela-usuario');
  } else if (perfil === 'gestor') {
    mostrarTela('tela-gestor-dashboard');
  } else {
    mostrarTela('welcome');
  }
}

// Funções para navegação por teclado
export function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Ctrl + Alt + N - Nova funcionalidade
    if (e.ctrlKey && e.altKey && e.key === 'n') {
      e.preventDefault();
      const perfil = localStorage.getItem('perfil_ativo');
      if (perfil === 'gestor') {
        criarNovoAviso();
      }
    }
    
    // Ctrl + Alt + H - Home
    if (e.ctrlKey && e.altKey && e.key === 'h') {
      e.preventDefault();
      mostrarTela('welcome');
    }
    
    // Ctrl + Alt + S - SOS
    if (e.ctrlKey && e.altKey && e.key === 's') {
      e.preventDefault();
      abrirSOS();
    }
  });
}

// Detectar movimento (para modo externo automático)
export function initDetectorAmbiente() {
  if ('AmbientLightSensor' in window) {
    try {
      const sensor = new AmbientLightSensor();
      sensor.addEventListener('reading', () => {
        // Se a luz ambiente for muito forte, sugerir modo externo
        if (sensor.illuminance > 10000 && !modoExternoAtivo) {
          showToast('info', 'Luz intensa detectada', 
            'Recomendamos ativar o modo externo para melhor visibilidade');
        }
      });
      sensor.start();
    } catch (erro) {
      console.log('Sensor de luz não disponível:', erro);
    }
  }
}

// Verificar tamanho da fonte do sistema
export function verificarTamanhoFonte() {
  const prefersLarge = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersLarge) {
    document.documentElement.style.fontSize = '18px';
  }
}
