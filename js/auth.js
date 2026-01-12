// auth.js - Gerenciamento de autenticação
import { loginEmailSenha, getColaborador } from '../firebase.js';
import { getState, setState } from './state.js';
import { showToast } from './notifications.js';
import { loadScreen } from './state.js';
import { initAvisosMonitor } from './avisos.js';
import { showLoading, hideLoading } from './utils.js';

// Verificar sessão existente
export async function checkSession() {
  const state = getState();
  
  // Restaurar do localStorage
  const saved = JSON.parse(localStorage.getItem('qssma_session') || '{}');
  
  if (saved.role === 'user' && saved.matricula) {
    try {
      showLoading('🔍 Restaurando sessão...');
      const snap = await getColaborador(saved.matricula);
      
      if (snap.exists() && snap.data().ativo) {
        const userData = snap.data();
        setState({
          user: {
            matricula: saved.matricula,
            nome: userData.nome,
            funcao: userData.funcao,
            email: userData.email
          },
          role: 'user'
        });
        
        await loadScreen('user-dashboard');
        initAvisosMonitor();
        showToast('✅', `Bem-vindo de volta, ${userData.nome}!`, 'success');
        return true;
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
    } finally {
      hideLoading();
    }
  } else if (saved.role === 'gestor' && saved.email) {
    // Verificar sessão de gestor (simplificado)
    setState({
      user: { email: saved.email, nome: 'Gestor' },
      role: 'gestor'
    });
    
    await loadScreen('gestor-dashboard');
    initAvisosMonitor();
    return true;
  }
  
  return false;
}

// Login de colaborador
export async function loginUser(matricula) {
  if (!matricula) {
    showToast('⚠️', 'Informe sua matrícula', 'warning');
    return false;
  }
  
  const cleanMatricula = matricula.trim().toUpperCase();
  
  try {
    showLoading('🔍 Validando matrícula...');
    
    const snap = await getColaborador(cleanMatricula);
    
    if (!snap.exists()) {
      showToast(
        '❌', 
        'Matrícula não encontrada. Procure o RH ou o Gestor de QSSMA.',
        'error'
      );
      return false;
    }
    
    const dados = snap.data();
    
    if (!dados.ativo) {
      showToast('❌', 'Colaborador inativo. Contate a gestão.', 'error');
      return false;
    }
    
    // Salvar sessão
    setState({
      user: {
        matricula: cleanMatricula,
        nome: dados.nome,
        funcao: dados.funcao,
        email: dados.email
      },
      role: 'user'
    });
    
    // Persistir no localStorage
    localStorage.setItem('qssma_session', JSON.stringify({
      role: 'user',
      matricula: cleanMatricula,
      timestamp: Date.now()
    }));
    
    // Carregar dashboard
    await loadScreen('user-dashboard');
    initAvisosMonitor();
    
    showToast('✅', `Bem-vindo(a), ${dados.nome}!`, 'success');
    return true;
    
  } catch (error) {
    console.error('Erro no login:', error);
    showToast(
      '❌',
      'Erro ao validar matrícula. Verifique sua conexão.',
      'error'
    );
    return false;
  } finally {
    hideLoading();
  }
}

// Login de gestor
export async function loginGestor(email, senha) {
  if (!email || !senha) {
    showToast('⚠️', 'Preencha e-mail e senha', 'warning');
    return false;
  }
  
  try {
    showLoading('🔐 Autenticando gestor...');
    
    const user = await loginEmailSenha(email, senha);
    
    // TODO: Verificar role no Firestore para segurança
    // const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    // if (userDoc.data().role !== 'gestor') {
    //   throw new Error('Acesso negado');
    // }
    
    setState({
      user: {
        email: email,
        nome: 'Gestor QSSMA',
        uid: user.uid
      },
      role: 'gestor'
    });
    
    localStorage.setItem('qssma_session', JSON.stringify({
      role: 'gestor',
      email: email,
      uid: user.uid,
      timestamp: Date.now()
    }));
    
    await loadScreen('gestor-dashboard');
    initAvisosMonitor();
    
    showToast('✅', 'Acesso Gestor autorizado', 'success');
    return true;
    
  } catch (error) {
    console.error('Erro login gestor:', error);
    showToast('❌', `Erro ao fazer login: ${error.message}`, 'error');
    return false;
  } finally {
    hideLoading();
  }
}

// Logout
export async function handleLogout() {
  try {
    // Limpar estado
    setState({
      user: null,
      role: null,
      avisos: [],
      statistics: null
    });
    
    // Limpar localStorage
    localStorage.removeItem('qssma_session');
    
    // Voltar para tela inicial
    await loadScreen('welcome');
    
    showToast('👋', 'Você saiu do sistema', 'info');
    
  } catch (error) {
    console.error('Erro no logout:', error);
  }
}

// Tela de dashboard do usuário
export async function loadUserDashboard() {
  const state = getState();
  
  if (!state.user) {
    await loadScreen('user-login');
    return;
  }
  
  // Retorna o HTML do dashboard do usuário
  return `
    <header class="app-header">
      <button class="icon-btn back-btn" onclick="handleLogout()">
        <i class="fas fa-sign-out-alt"></i>
      </button>
      <h1>Portal do Colaborador</h1>
      <div class="user-status">
        <span>${state.user.nome}</span>
      </div>
    </header>
    
    <main class="container">
      <section class="user-dashboard">
        <div class="user-header">
          <div class="user-avatar-large">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="user-info">
            <h2>Olá, ${state.user.nome}!</h2>
            <div class="user-details">
              <span class="user-badge">
                <i class="fas fa-id-card"></i> ${state.user.matricula}
              </span>
              <span class="user-badge">
                <i class="fas fa-briefcase"></i> ${state.user.funcao || 'Não informada'}
              </span>
            </div>
          </div>
        </div>
        
        <div class="cards-grid">
          <!-- Cards de funcionalidades -->
          <div class="feature-card" data-form="evento">
            <div class="card-icon danger">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Informe de Evento</h3>
            <p>Registro de eventos de segurança</p>
          </div>
          
          <div class="feature-card" data-form="radar">
            <div class="card-icon warning">
              <i class="fas fa-tachometer-alt"></i>
            </div>
            <h3>Radar Móvel</h3>
            <p>Registro de velocidade</p>
          </div>
          
          <div class="feature-card" data-form="flash">
            <div class="card-icon success">
              <i class="fas fa-bolt"></i>
            </div>
            <h3>Flash Report</h3>
            <p>Relatório rápido de incidentes</p>
          </div>
          
          <div class="feature-card" id="avisosBtn">
            <div class="card-icon info">
              <i class="fas fa-bullhorn"></i>
            </div>
            <h3>Avisos & Comunicados</h3>
            <p>Informações importantes</p>
            <span class="badge" id="avisosCount" style="display:none">0</span>
          </div>
          
          <div class="feature-card whatsapp" onclick="window.open('https://wa.me/559392059914', '_blank')">
            <div class="card-icon">
              <i class="fab fa-whatsapp"></i>
            </div>
            <h3>Suporte WhatsApp</h3>
            <p>Contato de suporte técnico</p>
          </div>
        </div>
      </section>
    </main>
  `;
}
