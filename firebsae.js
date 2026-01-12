// firebase.js - ATUALIZADO COM SEGURANÇA
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
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
    
    // Verificar se o usuário tem permissão de gestor
    const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
    
    if (!userDoc.exists() || userDoc.data().role !== 'gestor') {
      await signOut(auth);
      throw new Error('Acesso restrito aos gestores');
    }
    
    return userCredential.user;
  } catch (error) {
    throw new Error(getErrorMessage(error.code));
  }
}

// ================= COLABORADORES =================
async function getColaborador(matricula) {
  const docRef = doc(db, 'colaboradores', matricula);
  return await getDoc(docRef);
}

async function getTodosColaboradores() {
  const q = query(
    collection(db, 'colaboradores'),
    where('ativo', '==', true),
    orderBy('nome')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ================= AVISOS =================
async function registrarAviso(dados) {
  // Verificar se o usuário é gestor
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  
  const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
  if (!userDoc.exists() || userDoc.data().role !== 'gestor') {
    throw new Error('Acesso negado. Apenas gestores podem criar avisos.');
  }
  
  return await addDoc(collection(db, 'avisos'), {
    ...dados,
    timestamp: serverTimestamp(),
    criadoPor: user.email,
    criadoPorUid: user.uid
  });
}

async function getAvisos() {
  const q = query(
    collection(db, 'avisos'),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function updateAviso(avisoId, dados) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  
  const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
  if (!userDoc.exists() || userDoc.data().role !== 'gestor') {
    throw new Error('Acesso negado. Apenas gestores podem editar avisos.');
  }
  
  const docRef = doc(db, 'avisos', avisoId);
  return await updateDoc(docRef, {
    ...dados,
    atualizadoEm: serverTimestamp(),
    atualizadoPor: user.email
  });
}

async function deleteAviso(avisoId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  
  const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
  if (!userDoc.exists() || userDoc.data().role !== 'gestor') {
    throw new Error('Acesso negado. Apenas gestores podem excluir avisos.');
  }
  
  const docRef = doc(db, 'avisos', avisoId);
  return await deleteDoc(docRef);
}

// ================= MONITORAMENTO =================
function monitorarAvisos(callback) {
  const q = query(
    collection(db, 'avisos'), 
    where('ativo', '==', true),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, snapshot => {
    const dados = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(dados);
  });
}

// ================= ESTATÍSTICAS =================
async function getEstatisticasDashboard() {
  try {
    const [avisosSnapshot, colaboradoresSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'avisos'), where('ativo', '==', true))),
      getDocs(query(collection(db, 'colaboradores'), where('ativo', '==', true)))
    ]);

    // Contar usuários online (simplificado - em produção use presence system)
    const usuariosOnline = auth.currentUser ? 1 : 0;

    return {
      totalAvisosAtivos: avisosSnapshot.docs.length,
      totalColaboradores: colaboradoresSnapshot.docs.length,
      usuariosOnline
    };
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    return {
      totalAvisosAtivos: 0,
      totalColaboradores: 0,
      usuariosOnline: 0
    };
  }
}

// ================= LISTENER DE AUTENTICAÇÃO =================
onAuthStateChanged(auth, (user) => {
  console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
});

// ================= EXPORTAÇÕES =================
export {
  db,
  auth,
  doc,
  getDoc,
  
  // Autenticação
  loginEmailSenha,
  signOut,
  
  // Colaboradores
  getColaborador,
  getTodosColaboradores,
  
  // Avisos
  registrarAviso,
  getAvisos,
  updateAviso,
  deleteAviso,
  
  // Monitoramento
  monitorarAvisos,
  
  // Dashboard
  getEstatisticasDashboard
};
