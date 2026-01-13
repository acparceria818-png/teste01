// modules/avisos.js - Gerenciamento de avisos
import { 
  getAvisos,
  registrarAviso,
  updateAviso,
  deleteAviso,
  monitorarAvisos as monitorarAvisosFB,
  verificarAcessoGestor
} from './auth.js';

import { showToast, showLoading, hideLoading } from './ui.js';

let estadoAvisos = {
  lista: [],
  unsubscribe: null
};

export function monitorarAvisos(callback) {
  if (estadoAvisos.unsubscribe) {
    estadoAvisos.unsubscribe();
  }
  
  estadoAvisos.unsubscribe = monitorarAvisosFB((avisos) => {
    estadoAvisos.lista = avisos;
    if (callback) callback(avisos);
  });
  
  return estadoAvisos.unsubscribe;
}

export async function carregarAvisosGestor() {
  try {
    showLoading('Carregando avisos...');
    
    const avisos = await getAvisos();
    estadoAvisos.lista = avisos;
    
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
            <small class="aviso-data">${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleString() : ''}</small>
          </div>
          <div class="aviso-admin-actions">
            <button class="icon-btn" onclick="editarAviso('${aviso.id}')" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="icon-btn danger" onclick="excluirAviso('${aviso.id}')" title="Excluir">
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
            <small>Criado por: ${aviso.criadoPor || 'Sistema'}</small>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (erro) {
    console.error('Erro ao carregar avisos:', erro);
    showToast('error', 'Erro ao carregar', 'Não foi possível carregar os avisos');
    
    const container = document.getElementById('avisosAdminList');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h4>Erro ao carregar avisos</h4>
          <p>Tente novamente mais tarde.</p>
        </div>
      `;
    }
  } finally {
    hideLoading();
  }
}

export function criarNovoAviso() {
  const modal = document.createElement('div');
  modal.className = 'modal-back';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'modalTitle');
  modal.setAttribute('aria-modal', 'true');
  
  modal.innerHTML = `
    <div class="modal">
      <button class="close" onclick="this.parentElement.parentElement.remove()" aria-label="Fechar modal">
        <i class="fas fa-times"></i>
      </button>
      <h3 id="modalTitle"><i class="fas fa-plus"></i> Criar Novo Aviso</h3>
      
      <div class="form-group">
        <label for="novoAvisoTitulo">Título *</label>
        <input type="text" id="novoAvisoTitulo" class="form-input" 
               placeholder="Título do aviso" required aria-required="true">
      </div>
      
      <div class="form-group">
        <label for="novoAvisoMensagem">Mensagem *</label>
        <textarea id="novoAvisoMensagem" class="form-input" rows="4" 
                  placeholder="Mensagem do aviso" required aria-required="true"></textarea>
      </div>
      
      <div class="form-group">
        <label for="novoAvisoDestino">Destino</label>
        <select id="novoAvisoDestino" class="form-input">
          <option value="todos">Todos</option>
          <option value="colaboradores">Colaboradores</option>
          <option value="gestores">Gestores</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="novoAvisoAtivo">
          <input type="checkbox" id="novoAvisoAtivo" checked> Aviso ativo
        </label>
      </div>
      
      <div class="form-group">
        <label for="novoAvisoTipo">Tipo</label>
        <select id="novoAvisoTipo" class="form-input">
          <option value="informativo">Informativo</option>
          <option value="importante">Importante</option>
          <option value="urgente">Urgente</option>
          <option value="emergencia">Emergência</option>
        </select>
      </div>
      
      <div class="form-actions">
        <button class="btn btn-primary" onclick="salvarNovoAviso()">
          <i class="fas fa-save"></i> Salvar Aviso
        </button>
        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i> Cancelar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  // Focar no primeiro campo
  setTimeout(() => {
    const tituloInput = document.getElementById('novoAvisoTitulo');
    if (tituloInput) tituloInput.focus();
  }, 100);
}

export async function salvarNovoAviso() {
  // Verificar permissões
  const temAcesso = await verificarAcessoGestor();
  if (!temAcesso) return;
  
  const titulo = document.getElementById('novoAvisoTitulo').value;
  const mensagem = document.getElementById('novoAvisoMensagem').value;
  const destino = document.getElementById('novoAvisoDestino').value;
  const ativo = document.getElementById('novoAvisoAtivo').checked;
  const tipo = document.getElementById('novoAvisoTipo').value;
  
  if (!titulo || !mensagem) {
    showToast('error', 'Campos obrigatórios', 'Preencha título e mensagem');
    return;
  }
  
  try {
    showLoading('Salvando aviso...');
    
    await registrarAviso({
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      destino: destino,
      ativo: ativo,
      tipo: tipo,
      timestamp: new Date()
    });
    
    showToast('success', 'Aviso Criado', 'Aviso criado com sucesso!');
    
    document.querySelector('.modal-back').remove();
    carregarAvisosGestor();
    
  } catch (erro) {
    console.error('Erro ao salvar aviso:', erro);
    showToast('error', 'Erro ao salvar', 'Não foi possível salvar o aviso');
  } finally {
    hideLoading();
  }
}

export async function editarAviso(avisoId) {
  const temAcesso = await verificarAcessoGestor();
  if (!temAcesso) return;
  
  try {
    showLoading('Carregando aviso...');
    
    const aviso = estadoAvisos.lista.find(a => a.id === avisoId);
    if (!aviso) {
      showToast('error', 'Aviso não encontrado', 'O aviso pode ter sido removido');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-back';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'modalEditTitle');
    modal.setAttribute('aria-modal', 'true');
    
    modal.innerHTML = `
      <div class="modal">
        <button class="close" onclick="this.parentElement.parentElement.remove()" aria-label="Fechar modal">
          <i class="fas fa-times"></i>
        </button>
        <h3 id="modalEditTitle"><i class="fas fa-edit"></i> Editar Aviso</h3>
        
        <div class="form-group">
          <label for="editarAvisoTitulo">Título *</label>
          <input type="text" id="editarAvisoTitulo" class="form-input" 
                 value="${aviso.titulo || ''}" required aria-required="true">
        </div>
        
        <div class="form-group">
          <label for="editarAvisoMensagem">Mensagem *</label>
          <textarea id="editarAvisoMensagem" class="form-input" rows="4" 
                    required aria-required="true">${aviso.mensagem || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="editarAvisoDestino">Destino</label>
          <select id="editarAvisoDestino" class="form-input">
            <option value="todos" ${aviso.destino === 'todos' ? 'selected' : ''}>Todos</option>
            <option value="colaboradores" ${aviso.destino === 'colaboradores' ? 'selected' : ''}>Colaboradores</option>
            <option value="gestores" ${aviso.destino === 'gestores' ? 'selected' : ''}>Gestores</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="editarAvisoAtivo">
            <input type="checkbox" id="editarAvisoAtivo" ${aviso.ativo ? 'checked' : ''}> Aviso ativo
          </label>
        </div>
        
        <div class="form-group">
          <label for="editarAvisoTipo">Tipo</label>
          <select id="editarAvisoTipo" class="form-input">
            <option value="informativo" ${aviso.tipo === 'informativo' ? 'selected' : ''}>Informativo</option>
            <option value="importante" ${aviso.tipo === 'importante' ? 'selected' : ''}>Importante</option>
            <option value="urgente" ${aviso.tipo === 'urgente' ? 'selected' : ''}>Urgente</option>
            <option value="emergencia" ${aviso.tipo === 'emergencia' ? 'selected' : ''}>Emergência</option>
          </select>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary" onclick="salvarEdicaoAviso('${avisoId}')">
            <i class="fas fa-save"></i> Salvar Alterações
          </button>
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
  } catch (erro) {
    console.error('Erro ao carregar aviso:', erro);
    showToast('error', 'Erro ao carregar', 'Não foi possível carregar o aviso');
  } finally {
    hideLoading();
  }
}

export async function salvarEdicaoAviso(avisoId) {
  const temAcesso = await verificarAcessoGestor();
  if (!temAcesso) return;
  
  const titulo = document.getElementById('editarAvisoTitulo').value;
  const mensagem = document.getElementById('editarAvisoMensagem').value;
  const destino = document.getElementById('editarAvisoDestino').value;
  const ativo = document.getElementById('editarAvisoAtivo').checked;
  const tipo = document.getElementById('editarAvisoTipo').value;
  
  if (!titulo || !mensagem) {
    showToast('error', 'Campos obrigatórios', 'Preencha título e mensagem');
    return;
  }
  
  try {
    showLoading('Salvando alterações...');
    
    await updateAviso(avisoId, {
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      destino: destino,
      ativo: ativo,
      tipo: tipo,
      timestamp: new Date()
    });
    
    showToast('success', 'Aviso Atualizado', 'Aviso atualizado com sucesso!');
    
    document.querySelector('.modal-back').remove();
    carregarAvisosGestor();
    
  } catch (erro) {
    console.error('Erro ao atualizar aviso:', erro);
    showToast('error', 'Erro ao atualizar', 'Não foi possível atualizar o aviso');
  } finally {
    hideLoading();
  }
}

export async function excluirAviso(avisoId) {
  const temAcesso = await verificarAcessoGestor();
  if (!temAcesso) return;
  
  // Modal de confirmação
  const confirmar = await new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'modal-back';
    modal.innerHTML = `
      <div class="modal modal-small">
        <h3><i class="fas fa-trash"></i> Confirmar exclusão</h3>
        <p>Tem certeza que deseja excluir este aviso?</p>
        <p class="text-muted">Esta ação não pode ser desfeita.</p>
        <div class="form-actions">
          <button class="btn btn-danger" id="confirmDelete">Excluir</button>
          <button class="btn btn-secondary" id="cancelDelete">Cancelar</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    document.getElementById('confirmDelete').onclick = () => {
      modal.remove();
      resolve(true);
    };
    
    document.getElementById('cancelDelete').onclick = () => {
      modal.remove();
      resolve(false);
    };
    
    // Fechar ao clicar fora
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
        resolve(false);
      }
    };
  });
  
  if (!confirmar) return;
  
  try {
    showLoading('Excluindo aviso...');
    
    await deleteAviso(avisoId);
    
    showToast('success', 'Aviso Excluído', 'Aviso excluído com sucesso!');
    
    // Atualizar lista
    const avisoElement = document.getElementById(`aviso-${avisoId}`);
    if (avisoElement) {
      avisoElement.remove();
    }
    
    // Verificar se ainda há avisos
    if (document.querySelectorAll('.aviso-admin-item').length === 0) {
      const container = document.getElementById('avisosAdminList');
      if (container) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-bullhorn"></i>
            <h4>Nenhum aviso cadastrado</h4>
            <p>Clique em "Novo Aviso" para criar o primeiro.</p>
          </div>
        `;
      }
    }
    
  } catch (erro) {
    console.error('Erro ao excluir aviso:', erro);
    showToast('error', 'Erro ao excluir', 'Não foi possível excluir o aviso');
  } finally {
    hideLoading();
  }
}

export function mostrarAvisosUsuario() {
  const avisos = estadoAvisos.lista.filter(aviso => aviso.ativo);
  
  if (avisos.length === 0) {
    showToast('info', 'Nenhum aviso', 'Não há avisos no momento');
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal-back';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'avisosTitle');
  modal.setAttribute('aria-modal', 'true');
  
  const avisosHTML = avisos.map(aviso => `
    <div class="aviso-item" data-tipo="${aviso.tipo || 'informativo'}">
      <div class="aviso-header">
        <strong class="aviso-titulo">${aviso.titulo}</strong>
        <div class="aviso-metadata">
          <span class="aviso-tipo ${aviso.tipo || 'informativo'}">
            ${aviso.tipo || 'Informativo'}
          </span>
          <span class="aviso-data">
            <i class="fas fa-calendar"></i>
            ${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleDateString() : ''}
          </span>
        </div>
      </div>
      <div class="aviso-mensagem">${aviso.mensagem}</div>
      <div class="aviso-footer">
        <small class="aviso-destino">Para: ${aviso.destino || 'Todos'}</small>
      </div>
    </div>
  `).join('');
  
  modal.innerHTML = `
    <div class="modal">
      <button class="close" onclick="this.parentElement.parentElement.remove()" aria-label="Fechar avisos">
        <i class="fas fa-times"></i>
      </button>
      <h3 id="avisosTitle"><i class="fas fa-bullhorn"></i> Avisos e Comunicados</h3>
      <div class="avisos-list">
        ${avisosHTML}
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
          Fechar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  // Focar no botão fechar
  setTimeout(() => {
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) closeBtn.focus();
  }, 100);
}
