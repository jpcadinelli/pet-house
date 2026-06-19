import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseAuth, firestoreDb } from './firebaseConfig';

function obterUidCredencial(credential) {
  const uid = credential?.user?.uid;

  if (!uid) {
    throw new Error('Firebase não retornou um usuário autenticado.');
  }

  return uid;
}

export async function cadastrarUsuarioFirebase(email, senha, auth = firebaseAuth) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, senha);
    return obterUidCredencial(credential);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Não foi possível cadastrar a conta no Firebase: ${message}`);
  }
}

export async function loginUsuarioFirebase(email, senha, auth = firebaseAuth) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, senha);
    return obterUidCredencial(credential);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Não foi possível autenticar no Firebase: ${message}`);
  }
}

export function obterUsuarioFirebaseAtual(auth = firebaseAuth) {
  return auth.currentUser || null;
}

export function garantirUsuarioFirebaseAutenticado(auth = firebaseAuth) {
  const usuario = obterUsuarioFirebaseAtual(auth);

  if (!usuario?.uid) {
    throw new Error('Sessão Firebase expirada ou ausente. Faça login novamente com internet para sincronizar.');
  }

  return usuario;
}


export async function salvarPerfilUsuarioFirebase(firebaseUid, perfil, firestore = firestoreDb) {
  if (!firebaseUid) {
    throw new Error('UID Firebase não informado para salvar o perfil remoto.');
  }

  const perfilRef = doc(firestore, 'usuarios', firebaseUid, 'perfil', 'dados');
  const agoraUtc = Date.now();

  await setDoc(perfilRef, {
    nome: perfil.nome,
    email: perfil.email,
    atualizado_em: perfil.atualizado_em || agoraUtc,
    sincronizado_em: agoraUtc,
  }, { merge: true });
}
