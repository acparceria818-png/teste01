// modules/forms.js - Gerenciamento de formulários
import { showToast, showLoading, hideLoading } from './ui.js';

export async function carregarFormularios() {
  try {
    // Em uma versão futura, poderia carregar dinamicamente do Firebase
    return [
      {
        id: 'evento-seguranca',
        titulo: 'Informe de Evento',
        descricao: 'Registro de eventos de segurança',
        url: 'https://forms.gle/4kxcxyYX8wzdDyDt5',
        cor: 'danger',
        icone: 'fas fa-exclamation-triangle',
        categoria: 'emergencia'
      },
      {
        id: 'radar-movel',
        titulo: 'Radar Móvel',
        descricao: 'Registro de velocidade',
        url: 'https://forms.gle/BZahsh5ZAAVyixjx5',
        cor: 'warning',
        icone: 'fas fa-tachometer-alt',
        categoria: 'atencao'
      },
      {
        id: 'flash-report',
        titulo: 'Flash Report',
        descricao: 'Relatório rápido de incidentes',
        url: 'https://forms.gle/9d6f4w7hcpyDSCCs5',
        cor: 'danger',
        icone: 'fas fa-bolt',
        categoria: 'emergencia'
      }
    ];
  } catch (erro) {
    console.error('Erro ao carregar formulários:', erro);
    return [];
  }
}

export function validarFormulario(dados) {
  const erros = [];
  
  // Validações genéricas
  if (!dados.titulo || dados.titulo.trim().length < 3) {
    erros.push('Título muito curto (mínimo 3 caracteres)');
  }
  
  if (!dados.descricao || dados.descricao.trim().length < 10) {
    erros.push('Descrição muito curta (mínimo 10 caracteres)');
  }
  
  if (dados.url && !isValidURL(dados.url)) {
    erros.push('URL inválida');
  }
  
  return erros;
}

function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function salvarFormularioLocalmente(dados) {
  try {
    // Salvar no sessionStorage para cache
    const formularios = JSON.parse(sessionStorage.getItem('formularios_cache') || '[]');
    
    // Adicionar timestamp
    dados.carregadoEm = new Date().toISOString();
    
    // Verificar se já existe
    const index = formularios.findIndex(f => f.id === dados.id);
    if (index >= 0) {
      formularios[index] = dados;
    } else {
      formularios.push(dados);
    }
    
    sessionStorage.setItem('formularios_cache', JSON.stringify(formularios));
    
    // Limitar cache a 24 horas
    setTimeout(() => {
      sessionStorage.removeItem('formularios_cache');
    }, 24 * 60 * 60 * 1000);
    
    return true;
  } catch (erro) {
    console.error('Erro ao salvar formulário localmente:', erro);
    return false;
  }
}

export function obterFormulariosCache() {
  try {
    const cache = sessionStorage.getItem('formularios_cache');
    if (!cache) return null;
    
    const formularios = JSON.parse(cache);
    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
    
    // Verificar se o cache ainda é válido (menos de 1 hora)
    const primeiro = formularios[0];
    if (primeiro && new Date(primeiro.carregadoEm) < umaHoraAtras) {
      sessionStorage.removeItem('formularios_cache');
      return null;
    }
    
    return formularios;
  } catch (erro) {
    console.error('Erro ao obter cache:', erro);
    return null;
  }
}

// Monitorar envio de formulários
export function monitorarFormularios() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const iframes = document.querySelectorAll('iframe[src*="forms.gle"]');
        iframes.forEach(iframe => {
          if (!iframe.dataset.monitorado) {
            setupIframeMonitor(iframe);
            iframe.dataset.monitorado = 'true';
          }
        });
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

function setupIframeMonitor(iframe) {
  // Esta é uma solução simplificada
  // Em produção, precisaria de comunicação entre frames
  
  // Verificar periodicamente se o formulário foi enviado
  const interval = setInterval(() => {
    try {
      // Tentar detectar mudanças no iframe
      // Esta é uma abordagem básica
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      if (iframeDoc) {
        const submitted = iframeDoc.querySelector('[class*="freebirdFormviewerViewResponseConfirmationMessage"]');
        
        if (submitted) {
          clearInterval(interval);
          
          // Notificar sucesso
          showToast('success', 'Formulário enviado!', 
            'Obrigado pelo seu registro. Os dados foram enviados com sucesso.');
          
          // Voltar automaticamente após 3 segundos
          setTimeout(() => {
            if (window.fecharFormulario) {
              window.fecharFormulario();
            }
          }, 3000);
        }
      }
    } catch (erro) {
      // Cross-origin error, ignorar
    }
  }, 2000);
  
  // Limpar intervalo se o iframe for removido
  const observer = new MutationObserver(() => {
    if (!document.body.contains(iframe)) {
      clearInterval(interval);
      observer.disconnect();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}
