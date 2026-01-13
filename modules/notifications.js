// modules/notifications.js - Sistema de notificações
export function initNotifications() {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações desktop');
    return;
  }
  
  // Pedir permissão se ainda não tiver
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function mostrarNotificacao(titulo, mensagem, options = {}) {
  const defaultOptions = {
    body: mensagem,
    icon: 'assets/logo.jpg',
    badge: 'assets/logo.jpg',
    tag: 'portal-qssma',
    vibrate: [100, 50, 100],
    requireInteraction: options.importante || false,
    data: {
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  // Notificação desktop
  if (Notification.permission === 'granted') {
    const notification = new Notification(titulo, finalOptions);
    
    notification.onclick = function() {
      window.focus();
      this.close();
      
      // Ação específica se houver
      if (options.onClick) {
        options.onClick();
      }
    };
    
    // Fechar automaticamente após 10 segundos (exceto se for importante)
    if (!options.importante) {
      setTimeout(() => notification.close(), 10000);
    }
    
    return notification;
  }
  
  // Fallback para notificação na tela
  criarNotificacaoTela(titulo, mensagem, options);
}

function criarNotificacaoTela(titulo, mensagem, options = {}) {
  const notificacao = document.createElement('div');
  notificacao.className = 'notificacao-tela';
  notificacao.setAttribute('role', 'alert');
  notificacao.setAttribute('aria-live', 'assertive');
  
  if (options.tipo) {
    notificacao.classList.add(`notificacao-${options.tipo}`);
  }
  
  notificacao.innerHTML = `
    <div class="notificacao-conteudo">
      <div class="notificacao-titulo">
        ${options.icone ? `<i class="${options.icone}"></i>` : ''}
        <strong>${titulo}</strong>
      </div>
      <p>${mensagem}</p>
    </div>
    <button class="notificacao-fechar" onclick="this.parentElement.remove()" aria-label="Fechar notificação">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(notificacao);
  
  // Animação de entrada
  setTimeout(() => {
    notificacao.classList.add('visible');
  }, 10);
  
  // Remover automaticamente
  if (!options.permanente) {
    setTimeout(() => {
      if (notificacao.parentElement) {
        notificacao.classList.remove('visible');
        setTimeout(() => {
          if (notificacao.parentElement) {
            notificacao.remove();
          }
        }, 300);
      }
    }, options.duracao || 5000);
  }
  
  // Suporte a ações
  if (options.acoes) {
    const acoesContainer = document.createElement('div');
    acoesContainer.className = 'notificacao-acoes';
    
    options.acoes.forEach(acao => {
      const btn = document.createElement('button');
      btn.className = `btn btn-small ${acao.classe || ''}`;
      btn.textContent = acao.texto;
      btn.onclick = acao.acao;
      acoesContainer.appendChild(btn);
    });
    
    notificacao.querySelector('.notificacao-conteudo').appendChild(acoesContainer);
  }
}

// Notificações push (para PWA)
export function setupPushNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      // Aqui você configuraria as notificações push
      // Precisa de backend (Firebase Cloud Messaging)
      console.log('Service Worker pronto para notificações push');
    });
  }
}

// Notificação de aviso importante
export function notificarAvisoImportante(aviso) {
  const options = {
    importante: true,
    tipo: aviso.tipo || 'informativo',
    icone: getIconePorTipo(aviso.tipo),
    acoes: [
      {
        texto: 'Ver',
        classe: 'btn-primary',
        acao: () => {
          // Abrir modal de avisos
          window.mostrarAvisos();
        }
      }
    ]
  };
  
  mostrarNotificacao(
    `📢 ${aviso.titulo}`,
    aviso.mensagem.substring(0, 100) + '...',
    options
  );
}

function getIconePorTipo(tipo) {
  const icones = {
    'emergencia': 'fas fa-exclamation-triangle',
    'urgente': 'fas fa-exclamation-circle',
    'importante': 'fas fa-info-circle',
    'informativo': 'fas fa-bullhorn'
  };
  return icones[tipo] || 'fas fa-bullhorn';
}

// Notificação de sistema offline
export function notificarModoOffline() {
  mostrarNotificacao(
    '📶 Modo Offline',
    'Algumas funcionalidades podem não estar disponíveis. Sua conexão será restaurada automaticamente.',
    {
      tipo: 'warning',
      icone: 'fas fa-wifi-slash',
      duracao: 8000
    }
  );
}

// Notificação de atualização disponível
export function notificarAtualizacao() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.update();
      
      mostrarNotificacao(
        '🔄 Atualização Disponível',
        'Uma nova versão do Portal QSSMA está disponível. Atualize para obter as melhorias mais recentes.',
        {
          tipo: 'info',
          icone: 'fas fa-sync-alt',
          acoes: [
            {
              texto: 'Atualizar',
              classe: 'btn-primary',
              acao: () => window.location.reload()
            }
          ]
        }
      );
    });
  }
}
