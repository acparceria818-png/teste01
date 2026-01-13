// modules/auth.js - CORRIGIDO
import { 
  auth as firebaseAuth,  // Renomear para evitar conflito
  getColaborador,
  loginEmailSenha,
  getDoc,
  doc,
  db,
  deleteAviso as deleteAvisoFirebase
} from '../firebase.js';

import { showToast, showLoading, hideLoading } from './ui.js';

// Cache de validações
const cacheValidacoes = {
  matricula: new Map(),
  gestor: new Map()
};

export async function validarMatricula(matricula) {
  // Verificar cache
  if (cacheValidacoes.matricula.has(matricula)) {
    return cacheValidacoes.matricula.get(matricula);
  }

  try {
    const snap = await getColaborador(matricula);
    
    if (!snap.exists()) {
      throw new Error('Matrícula não encontrada. Procure o RH ou o Gestor de QSSMA.');
    }
    
    const dados = snap.data();
    
    if (!dados.ativo) {
      throw new Error('Colaborador inativo. Contate a gestão.');
    }
    
    // Armazenar no cache por 5 minutos
    cacheValidacoes.matricula.set(matricula, dados);
    setTimeout(() => {
      cacheValidacoes.matricula.delete(matricula);
    }, 5 * 60 * 1000);
    
    return dados;
    
  } catch (erro) {
    throw erro;
  }
}

export async function loginUsuario(matricula, callbacks = {}) {
  const { onSuccess, onError } = callbacks;
  
  try {
    showLoading('🔍 Validando matrícula...');
    
    const dados = await validarMatricula(matricula);
    
    // Armazenar dados no localStorage
    localStorage.setItem('usuario_matricula', matricula);
    localStorage.setItem('usuario_nome', dados.nome);
    localStorage.setItem('usuario_funcao', dados.funcao || 'Não informada');
    localStorage.setItem('usuario_email', dados.email || '');
    localStorage.setItem('perfil_ativo', 'usuario');
    
    if (onSuccess) onSuccess(dados);
    
  } catch (erro) {
    console.error('Erro no login:', erro);
    if (onError) onError(erro);
  } finally {
    hideLoading();
  }
}

export async function loginGestor(email, senha, callbacks = {}) {
  const { onSuccess, onError } = callbacks;
  
  try {
    showLoading('🔐 Autenticando gestor...');
    
    // Verificar permissão antes de autenticar
    const temPermissao = await verificarPermissaoGestor(email);
    if (!temPermissao) {
      throw new Error('Acesso não autorizado. Contate o administrador.');
    }
    
    // Autenticar com Firebase
    const user = await loginEmailSenha(email, senha);
    
    localStorage.setItem('gestor_logado', 'true');
    localStorage.setItem('gestor_email', email);
    localStorage.setItem('gestor_uid', user.uid);
    localStorage.setItem('perfil_ativo', 'gestor');
    
    if (onSuccess) onSuccess(user);
    
  } catch (erro) {
    console.error('Erro no login gestor:', erro);
    if (onError) onError(erro);
  } finally {
    hideLoading();
  }
}

export async function verificarPermissaoGestor(email) {
  try {
    // Verificar na coleção de gestores
    // Por enquanto, permitir qualquer email (em produção, implementar lógica real)
    console.log('Verificando permissão para:', email);
    return true;
    
  } catch (erro) {
    console.error('Erro ao verificar permissão:', erro);
    return false;
  }
}

export function logout() {
  try {
    // Limpar cache
    cacheValidacoes.matricula.clear();
    cacheValidacoes.gestor.clear();
    
    // Limpar localStorage
    const keys = [
      'perfil_ativo',
      'usuario_matricula',
      'usuario_nome',
      'usuario_funcao',
      'usuario_email',
      'gestor_logado',
      'gestor_email',
      'gestor_uid'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    
    // Se estiver logado como gestor, fazer logout do Firebase
    if (firebaseAuth.currentUser) {
      firebaseAuth.signOut().catch(console.error);
    }
    
    console.log('👋 Logout realizado');
    
  } catch (erro) {
    console.error('Erro no logout:', erro);
  }
}

// Verificar se usuário atual é gestor
export async function isGestor() {
  try {
    const user = firebaseAuth.currentUser;
    if (!user) return false;
    
    // Verificar na coleção de permissões
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.role === 'gestor' || data.role === 'admin';
    }
    
    return false;
    
  } catch (erro) {
    console.error('Erro ao verificar perfil:', erro);
    return false;
  }
}

// Middleware de segurança para ações de gestor
export async function verificarAcessoGestor(acao) {
  try {
    const isGestor = await isGestor();
    
    if (!isGestor) {
      showToast('error', 'Acesso negado', 'Apenas gestores podem realizar esta ação');
      return false;
    }
    
    return true;
    
  } catch (erro) {
    console.error('Erro ao verificar acesso:', erro);
    showToast('error', 'Erro de segurança', 'Não foi possível verificar suas permissões');
    return false;
  }
}

// Exportar a função deleteAviso do Firebase
export { deleteAvisoFirebase as deleteAviso };
