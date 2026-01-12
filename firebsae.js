// firebase.js - Configuração para Portal QSSMA
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
  getAuth, 
  signInWithEmailAndPassword 
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
    console.error('Erro login:', error.code);
    throw new Error(getErrorMessage(error.code));
  }
}

function getErrorMessage(errorCode) {
  const messages = {
    'auth/invalid-email': 'E-mail inválido',
    'auth/user-disabled': 'Usuário desativado',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde'
  };
  return messages[errorCode] || 'Erro ao fazer login';
}

// ================= COLABORADORES =================
async function getColaborador(matricula) {
  const docRef = doc(db, 'colaboradores', matricula);
  return await getDoc(docRef);
}

// ================= AVISOS =================
async function registrarAviso(dados) {
  return await addDoc(collection(db, 'avisos'), {
    ...dados,
    timestamp: serverTimestamp()
  });
}

async function getAvisos() {
  try {
    const q = query(collection(db, 'avisos'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Erro ao buscar avisos:', error);
    return [];
  }
}

async function updateAviso(avisoId, dados) {
  const docRef = doc(db, 'avisos', avisoId);
  return await updateDoc(docRef, {
    ...dados,
    timestamp: serverTimestamp()
  });
}

async function deleteAviso(avisoId) {
  const docRef = doc(db, 'avisos', avisoId);
  return await deleteDoc(docRef);
}

// ================= MONITORAMENTO =================
function monitorarAvisos(callback) {
  try {
    const q = query(collection(db, 'avisos'), where("ativo", "==", true));
    return onSnapshot(q, snapshot => {
      const dados = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(dados);
    }, error => {
      console.error('Erro monitoramento avisos:', error);
    });
  } catch (error) {
    console.error('Erro ao configurar monitoramento:', error);
  }
}

// ================= ESTATÍSTICAS =================
async function getEstatisticasDashboard() {
  try {
    const [avisosSnapshot, eventosSnapshot, colaboradoresSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'avisos'), where("ativo", "==", true))),
      getDocs(collection(db, 'eventos')),
      getDocs(collection(db, 'colaboradores'))
    ]);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const eventosHoje = eventosSnapshot.docs.filter(doc => {
      const data = doc.data().timestamp?.toDate();
      return data && data >= hoje;
    }).length;

    return {
      totalAvisos: avisosSnapshot.size,
      eventosHoje: eventosHoje,
      totalColaboradores: colaboradoresSnapshot.size
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { totalAvisos: 0, eventosHoje: 0, totalColaboradores: 0 };
  }
}

// ================= EXPORTAÇÕES =================
export {
  db,
  auth,
  getColaborador,
  loginEmailSenha,
  registrarAviso,
  getAvisos,
  updateAviso,
  deleteAviso,
  monitorarAvisos,
  getEstatisticasDashboard
};
