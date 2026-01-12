// avisos.js - Gestão de avisos e comunicados
import { monitorarAvisos, getAvisos, registrarAviso, updateAviso, deleteAviso } from '../firebase.js';
import { getState, setState } from './state.js';
import { showToast } from './notifications.js';
import { showModal, closeModal } from './ui.js';
import { showLoading, hideLoading } from './utils.js';

let unsubscribeAvisos = null;

// Inicializar monitoramento de avisos
export function initAvisosMonitor() {
  const state = getState();
  
  if (!state.user || !state.role) return;
  
  // Se já estiver monitorando, cancelar
  if (unsubscribeAvisos) {
    unsubscribeAvisos();
  }
  
  // Configurar monitoramento
  unsubscribeAvisos = monitorarAvisos((avisos) => {
    const avisosAtivos = avisos.filter(aviso => aviso.ativo);
    setState({ avisos: avisosAtivos });
    updateAvisosUI(avisosAtivos);
  });
}

// Atualizar UI com avisos
function updateAvisosUI(avisos) {
  // Atualizar badge
  const avisosCount = document.getElementById('avisosCount');
  if (avisosCount) {
    avisosCount.textContent = avisos.length;
    avisosCount.style.display = avisos.length > 0 ? 'inline' : 'none';
  }
  
  // Se estiver na tela de gestor, atualizar lista
  if (getState().role === 'gestor') {
    renderAvisosList(avisos);
  }
}

// Mostrar modal de avisos para usuário
export function showAvisosModal() {
  const state = getState();
  const avisos = state.avisos || [];
  
  if (avisos.length === 0) {
    showToast('📭', 'Nenhum aviso no momento', 'info');
    return;
  }
  
  const avisosHTML = avisos.map(aviso => `
    <div class="aviso-item" data-tipo="${aviso.prioridade || 'informativo'}">
      <div class="aviso-header">
        <h4 class="aviso-titulo">${aviso.titulo}</h4>
        <div class="aviso-metadata">
          <span class="aviso-tipo ${aviso.prioridade || 'informativo'}">
            ${aviso.prioridade || 'Informativo'}
          </span>
          <span class="aviso-destino">${aviso.destino || 'Todos'}</span>
        </div>
      </div>
      <div class="aviso-data">
        <i class="fas fa-calendar"></i>
        ${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleDateString('pt-BR') : ''}
      </div>
      <div class="aviso-mensagem">
        ${aviso.mensagem}
      </div>
    </div>
  `).join('');
  
  showModal('Avisos e Comunicados', `
    <div class="avisos-container">
      ${avisosHTML}
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="closeModal()">Fechar</button>
    </div>
  `);
}

// Gestor: Carregar lista de avisos
export async function loadAvisosGestor() {
  try {
    showLoading('Carregando avisos...');
    
    const avisos = await getAvisos();
    setState({ avisos });
    
    renderAvisosList(avisos);
    
  } catch (error) {
    console.error('Erro ao carregar avisos:', error);
    showToast('❌', 'Erro ao carregar avisos', 'error');
  } finally {
    hideLoading();
  }
}

// Renderizar lista de avisos para gestor
function renderAvisosList(avisos) {
  const container = document.getElementById('avisosAdminList');
  if (!container) return;
  
  if (avisos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bullhorn"></i>
        <h4>Nenhum aviso cadastrado</h4>
        <p>Clique em "Novo Aviso" para criar o primeiro.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = avisos.map(aviso => `
    <div class="aviso-admin-item" id="aviso-${aviso.id}">
      <div class="aviso-admin-header">
        <div>
          <h4>${aviso.titulo}</h4>
          <small class="aviso-destino-badge">Para: ${aviso.destino || 'Todos'}</small>
          <small class="aviso-data">
            <i class="fas fa-calendar"></i>
            ${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleString('pt-BR') : ''}
          </small>
        </div>
        <div class="aviso-admin-actions">
          <button class="icon-btn" onclick="editarAviso('${aviso.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="icon-btn danger" onclick="excluirAvisoConfirm('${aviso.id}')" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="aviso-admin-content">
        <p>${aviso.mensagem}</p>
        <div class="aviso-status">
          <span class="status-badge ${aviso.ativo ? 'ativo' : 'inativo'}">
            ${aviso.ativo ? 'Ativo' : 'Inativo'}
          </span>
          <span class="aviso-tipo-badge ${aviso.prioridade || 'informativo'}">
            ${aviso.prioridade || 'Informativo'}
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

// Gestor: Criar novo aviso
export function showCreateAvisoModal() {
  showModal('Criar Novo Aviso', `
    <form id="novoAvisoForm">
      <div class="form-group">
        <label for="avisoTitulo">Título *</label>
        <input type="text" id="avisoTitulo" class="form-input" required>
      </div>
      
      <div class="form-group">
        <label for="avisoMensagem">Mensagem *</label>
        <textarea id="avisoMensagem" class="form-input" rows="4" required></textarea>
      </div>
      
      <div class="form-group">
        <label for="avisoDestino">Destino</label>
        <select id="avisoDestino" class="form-input">
          <option value="todos">Todos</option>
          <option value="colaboradores">Colaboradores</option>
          <option value="gestores">Gestores</option>
          <option value="setor">Meu Setor</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="avisoPrioridade">Prioridade</label>
        <select id="avisoPrioridade" class="form-input">
          <option value="informativo">Informativo</option>
          <option value="importante">Importante</option>
          <option value="urgente">Urgente</option>
          <option value="emergencia">Emergência</option>
        </select>
      </div>
      
      <div class="form-group inline">
        <label>
          <input type="checkbox" id="avisoAtivo" checked> Aviso ativo
        </label>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn btn-primary" onclick="salvarNovoAviso()">
          <i class="fas fa-save"></i> Salvar
        </button>
        <button type="button" class="btn btn-secondary" onclick="closeModal()">
          <i class="fas fa-times"></i> Cancelar
        </button>
      </div>
    </form>
  `);
}

// Salvar novo aviso
window.salvarNovoAviso = async function() {
  try {
    const titulo = document.getElementById('avisoTitulo').value;
    const mensagem = document.getElementById('avisoMensagem').value;
    const destino = document.getElementById('avisoDestino').value;
    const prioridade = document.getElementById('avisoPrioridade').value;
    const ativo = document.getElementById('avisoAtivo').checked;
    
    if (!titulo || !mensagem) {
      showToast('⚠️', 'Preencha título e mensagem', 'warning');
      return;
    }
    
    showLoading('Salvando aviso...');
    
    await registrarAviso({
      titulo,
      mensagem,
      destino,
      prioridade,
      ativo,
      timestamp: new Date(),
      criadoPor: getState().user?.email || 'Sistema'
    });
    
    closeModal();
    showToast('✅', 'Aviso criado com sucesso', 'success');
    await loadAvisosGestor();
    
  } catch (error) {
    console.error('Erro ao salvar aviso:', error);
    showToast('❌', 'Erro ao salvar aviso', 'error');
  } finally {
    hideLoading();
  }
};

// Confirmar exclusão de aviso
window.excluirAvisoConfirm = function(avisoId) {
  showModal('Confirmar Exclusão', `
    <div class="alert-card warning">
      <i class="fas fa-exclamation-triangle"></i>
      <div class="alert-content">
        <h4>Tem certeza que deseja excluir este aviso?</h4>
        <p>Esta ação não pode ser desfeita.</p>
      </div>
    </div>
    
    <div class="form-actions">
      <button class="btn btn-danger" onclick="excluirAviso('${avisoId}')">
        <i class="fas fa-trash"></i> Excluir
      </button>
      <button class="btn btn-secondary" onclick="closeModal()">
        <i class="fas fa-times"></i> Cancelar
      </button>
    </div>
  `);
};

// Excluir aviso
window.excluirAviso = async function(avisoId) {
  try {
    showLoading('Excluindo aviso...');
    
    await deleteAviso(avisoId);
    
    closeModal();
    showToast('✅', 'Aviso excluído com sucesso', 'success');
    
    // Remover da lista
    const item = document.getElementById(`aviso-${avisoId}`);
    if (item) item.remove();
    
  } catch (error) {
    console.error('Erro ao excluir aviso:', error);
    showToast('❌', 'Erro ao excluir aviso', 'error');
  } finally {
    hideLoading();
  }
};
