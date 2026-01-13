// firebase.js - VERSÃO COM SEGURANÇA
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBdBJz8vNjr5LU2aP7aMymP2lf5rsosbwo",
  authDomain: "portal-qssma.firebaseapp.com",
  projectId: "portal-qssma",
  storageBucket: "portal-qssma.firebasestorage.app",
  messagingSenderId: "267009799858",
  appId: "1:267009799858:web:5c2155d34acd6cb0f13bab",
  measurementId: "G-EWK5550FTQ"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ================= AUTENTICAÇÃO =================
async function loginEmailSenha(email, senha) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    return userCredential.user;
  } catch (error) {
    throw new Error(getErrorMessage(error.code));
  }
}

async function criarUsuario(email, senha, nome) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(userCredential.user, {
      displayName: nome
    });
    return userCredential.user;
  } catch (error) {
    throw new Error(getErrorMessage(error.code));
  }
}

function getErrorMessage(errorCode) {
  const messages = {
    'auth/invalid-email': 'E-mail inválido',
    'auth/user-disabled': 'Usuário desativado',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/email-already-in-use': 'E-mail já está em uso',
    'auth/weak-password': 'Senha muito fraca',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/operation-not-allowed': 'Operação não permitida',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
    'auth/internal-error': 'Erro interno do servidor'
  };
  return messages[errorCode] || 'Erro ao fazer login';
}

// ================= COLABORADORES =================
async function getColaborador(matricula) {
  const docRef = doc(db, 'colaboradores', matricula);
  return await getDoc(docRef);
}

async function getTodosColaboradores() {
  try {
    const snapshot = await getDocs(query(
      collection(db, 'colaboradores'),
      where("ativo", "==", true),
      orderBy("nome")
    ));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error);
    throw error;
  }
}

async function criarColaborador(matricula, dados) {
  // Verificar permissões (apenas gestores)
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  const docRef = doc(db, 'colaboradores', matricula);
  return await setDoc(docRef, {
    ...dados,
    matricula: matricula,
    criadoEm: serverTimestamp(),
    criadoPor: auth.currentUser.email,
    ativo: true,
    atualizadoEm: serverTimestamp()
  });
}

async function atualizarColaborador(matricula, dados) {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  const docRef = doc(db, 'colaboradores', matricula);
  return await updateDoc(docRef, {
    ...dados,
    atualizadoEm: serverTimestamp(),
    atualizadoPor: auth.currentUser.email
  });
}

// ================= AVISOS =================
async function registrarAviso(dados) {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  return await addDoc(collection(db, 'avisos'), {
    ...dados,
    timestamp: serverTimestamp(),
    criadoPor: auth.currentUser.email,
    criadoPorUid: auth.currentUser.uid
  });
}

async function getAvisos() {
  try {
    const q = query(
      collection(db, 'avisos'), 
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erro ao buscar avisos:', error);
    throw error;
  }
}

async function updateAviso(avisoId, dados) {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  const docRef = doc(db, 'avisos', avisoId);
  return await updateDoc(docRef, {
    ...dados,
    atualizadoEm: serverTimestamp(),
    atualizadoPor: auth.currentUser.email,
    atualizadoPorUid: auth.currentUser.uid
  });
}

async function deleteAviso(avisoId) {
  if (!auth.currentUser) {
    throw new Error('Usuário não autenticado');
  }
  
  const docRef = doc(db, 'avisos', avisoId);
  return await deleteDoc(docRef);
}

// ================= MONITORAMENTO =================
function monitorarAvisos(callback) {
  try {
    const q = query(
      collection(db, 'avisos'), 
      where("ativo", "==", true),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, 
      snapshot => {
        const dados = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(dados);
      },
      error => {
        console.error('Erro ao monitorar avisos:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Erro na query de avisos:', error);
    // Retornar função vazia para unsubscribe
    return () => {};
  }
}

function monitorarColaboradores(callback) {
  try {
    const q = query(
      collection(db, 'colaboradores'),
      where("ativo", "==", true)
    );
    return onSnapshot(q, 
      snapshot => {
        const dados = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(dados);
      },
      error => {
        console.error('Erro ao monitorar colaboradores:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Erro na query de colaboradores:', error);
    return () => {};
  }
}

// ================= ESTATÍSTICAS =================
async function getEstatisticasDashboard() {
  try {
    const [avisosSnapshot, colaboradoresSnapshot] = await Promise.all([
      getDocs(query(
        collection(db, 'avisos'), 
        where('ativo', '==', true)
      )),
      getDocs(query(
        collection(db, 'colaboradores'), 
        where('ativo', '==', true)
      ))
    ]);

    // Contar usuários online (simplificado)
    // Em produção, implementar sistema de presença
    const usuariosOnline = 0;

    return {
      totalAvisosAtivos: avisosSnapshot.docs.length,
      totalColaboradores: colaboradoresSnapshot.docs.length,
      usuariosOnline: usuariosOnline,
      atualizadoEm: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    return {
      totalAvisosAtivos: 0,
      totalColaboradores: 0,
      usuariosOnline: 0,
      atualizadoEm: new Date().toISOString(),
      erro: error.message
    };
  }
}

// ================= GERENCIAMENTO DE USUÁRIOS =================
async function getUsuario(uid) {
  try {
    const docRef = doc(db, 'usuarios', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

async function criarUsuarioFirestore(uid, dados) {
  try {
    const docRef = doc(db, 'usuarios', uid);
    await setDoc(docRef, {
      ...dados,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

// ================= EXPORTAÇÕES =================
export {
  // Firebase instances
  db,
  auth,
  
  // Firestore functions
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  
  // Auth functions
  loginEmailSenha,
  criarUsuario,
  signOut,
  onAuthStateChanged,
  
  // Colaboradores
  getColaborador,
  getTodosColaboradores,
  criarColaborador,
  atualizarColaborador,
  
  // Avisos
  registrarAviso,
  getAvisos,
  updateAviso,
  deleteAviso,
  
  // Monitoramento
  monitorarAvisos,
  monitorarColaboradores,
  
  // Dashboard
  getEstatisticasDashboard,
  
  // Usuários
  getUsuario,
  criarUsuarioFirestore
};

// Configuração de segurança (para ser usada nas regras do Firebase)
/*
Regras do Firebase Firestore sugeridas:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Colaboradores: leitura pública, escrita apenas para autenticados
    match /colaboradores/{matricula} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Avisos: leitura pública, escrita apenas para gestores
    match /avisos/{avisoId} {
      allow read: if true;
      allow write: if request.auth != null 
                   && exists(/databases/$(database)/documents/usuarios/$(request.auth.uid))
                   && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role in ['gestor', 'admin'];
    }
    
    // Usuários: leitura apenas do próprio usuário, escrita apenas para admin
    match /usuarios/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null 
                   && exists(/databases/$(database)/documents/usuarios/$(request.auth.uid))
                   && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
*/
