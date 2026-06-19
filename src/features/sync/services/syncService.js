import {
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

import { getDB } from '../../database/db';
import {
  buscarUsuarioPorId,
  marcarUsuarioSincronizado,
} from '../../database/consultas/usuario';
import { firestoreDb } from '../../firebase/firebaseConfig';
import { garantirUsuarioFirebaseAutenticado } from '../../firebase/firebaseAuthService';

const consultasPets = require('../../database/consultas/pets');
const consultasVacinas = require('../../database/consultas/vacinas');

function normalizarIdUsuario(idUsuario) {
  const idNormalizado = String(idUsuario || '').trim();

  if (!idNormalizado) {
    throw new Error('Usuário autenticado não identificado.');
  }

  return idNormalizado;
}

function timestamp(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null;
  }

  if (valor instanceof Date) {
    const time = valor.getTime();
    return Number.isFinite(time) ? time : null;
  }

  if (typeof valor.toMillis === 'function') {
    return valor.toMillis();
  }

  const parsed = Number(valor);
  return Number.isFinite(parsed) ? parsed : null;
}

function serializarPetLocal(pet, firebaseAtualizadoEm) {
  return {
    uuid: pet.uuid,
    nome: pet.nome,
    especie: pet.especie,
    raca: pet.raca || null,
    data_nascimento: timestamp(pet.data_nascimento),
    sexo: pet.sexo,
    observacoes: pet.observacoes || null,
    foto_uri: pet.foto_uri || null,
    criado_em: timestamp(pet.criado_em) || Date.now(),
    atualizado_em: timestamp(pet.atualizado_em) || Date.now(),
    excluido_em: timestamp(pet.excluido_em),
    firebase_atualizado_em: firebaseAtualizadoEm,
  };
}

function serializarVacinaLocal(vacina, firebaseAtualizadoEm) {
  return {
    uuid: vacina.uuid,
    pet_uuid: vacina.pet_uuid,
    id_pet: vacina.id_pet,
    nome: vacina.nome,
    data_aplicacao: timestamp(vacina.data_aplicacao),
    proxima_dose: timestamp(vacina.proxima_dose),
    observacoes: vacina.observacoes || null,
    status: vacina.status,
    criado_em: timestamp(vacina.criado_em) || Date.now(),
    atualizado_em: timestamp(vacina.atualizado_em) || Date.now(),
    excluido_em: timestamp(vacina.excluido_em),
    firebase_atualizado_em: firebaseAtualizadoEm,
  };
}

function normalizarPetRemoto(snapshot) {
  const data = snapshot.data();

  return {
    ...data,
    uuid: data.uuid || snapshot.id,
    data_nascimento: timestamp(data.data_nascimento),
    criado_em: timestamp(data.criado_em),
    atualizado_em: timestamp(data.atualizado_em),
    excluido_em: timestamp(data.excluido_em),
    firebase_atualizado_em: timestamp(data.firebase_atualizado_em || data.atualizado_em),
    sincronizado_em: Date.now(),
  };
}

function normalizarVacinaRemota(snapshot) {
  const data = snapshot.data();

  return {
    ...data,
    uuid: data.uuid || snapshot.id,
    data_aplicacao: timestamp(data.data_aplicacao),
    proxima_dose: timestamp(data.proxima_dose),
    criado_em: timestamp(data.criado_em),
    atualizado_em: timestamp(data.atualizado_em),
    excluido_em: timestamp(data.excluido_em),
    firebase_atualizado_em: timestamp(data.firebase_atualizado_em || data.atualizado_em),
    sincronizado_em: Date.now(),
  };
}

function criarResumo() {
  return {
    enviados: 0,
    recebidos: 0,
    excluidos: 0,
    conflitosIgnorados: 0,
    mensagem: '',
  };
}

export function criarSyncService(deps = {}) {
  const database = deps.database || getDB();
  const firestore = deps.firestore || firestoreDb;
  const firestoreApi = deps.firestoreApi || { collection, doc, getDocs, setDoc };
  const garantirUsuarioFirebaseAutenticadoFn = deps.garantirUsuarioFirebaseAutenticado || garantirUsuarioFirebaseAutenticado;
  const usuarioConsultas = deps.usuarioConsultas || {
    buscarUsuarioPorId,
    marcarUsuarioSincronizado,
  };
  const petsConsultas = deps.petsConsultas || consultasPets;
  const vacinasConsultas = deps.vacinasConsultas || consultasVacinas;

  async function sincronizarDadosUsuario(idUsuario) {
    const idUsuarioNormalizado = normalizarIdUsuario(idUsuario);
    const usuario = usuarioConsultas.buscarUsuarioPorId(database, idUsuarioNormalizado);

    if (!usuario) {
      throw new Error('Usuário local não encontrado para sincronização.');
    }

    if (!usuario.firebase_uid) {
      throw new Error('Esta conta local ainda não está vinculada ao Firebase. Faça logout e cadastre/entre novamente com internet.');
    }

    let usuarioFirebase;

    try {
      usuarioFirebase = await garantirUsuarioFirebaseAutenticadoFn();
    } catch (error) {
      throw new Error('Sessão Firebase expirada ou ausente. Faça login novamente com internet para sincronizar.');
    }

    const firebaseUid = usuario.firebase_uid;

    if (usuarioFirebase.uid !== firebaseUid) {
      throw new Error('Usuário Firebase diferente do usuário local. Faça logout e login novamente.');
    }

    const resumo = criarResumo();
    const sincronizadoEm = Date.now();
    const perfilRef = firestoreApi.doc(firestore, 'usuarios', firebaseUid, 'perfil', 'dados');

    await firestoreApi.setDoc(perfilRef, {
      id_local: String(usuario.id),
      nome: usuario.nome,
      email: usuario.email,
      atualizado_em: timestamp(usuario.atualizado_em) || sincronizadoEm,
      sincronizado_em: sincronizadoEm,
    }, { merge: true });

    const uuidsEnviados = new Set();
    const petsPendentes = petsConsultas.listarPetsPendentesSincronizacao(
      database,
      idUsuarioNormalizado
    );

    for (const pet of petsPendentes) {
      const firebaseAtualizadoEm = Date.now();
      const petRef = firestoreApi.doc(firestore, 'usuarios', firebaseUid, 'pets', pet.uuid);
      const petRemoto = serializarPetLocal(pet, firebaseAtualizadoEm);

      await firestoreApi.setDoc(petRef, petRemoto, { merge: true });
      petsConsultas.marcarPetComoSincronizado(
        database,
        idUsuarioNormalizado,
        pet.uuid,
        sincronizadoEm,
        firebaseAtualizadoEm
      );

      uuidsEnviados.add(pet.uuid);

      if (pet.excluido_em) {
        resumo.excluidos += 1;
      } else {
        resumo.enviados += 1;
      }
    }

    const uuidsVacinasEnviadas = new Set();
    const vacinasPendentes = vacinasConsultas.listarVacinasPendentesSincronizacao(
      database,
      idUsuarioNormalizado
    );

    for (const vacina of vacinasPendentes) {
      const firebaseAtualizadoEm = Date.now();
      const vacinaRef = firestoreApi.doc(firestore, 'usuarios', firebaseUid, 'vacinas', vacina.uuid);
      const vacinaRemota = serializarVacinaLocal(vacina, firebaseAtualizadoEm);

      await firestoreApi.setDoc(vacinaRef, vacinaRemota, { merge: true });
      vacinasConsultas.marcarVacinaComoSincronizada(
        database,
        idUsuarioNormalizado,
        vacina.uuid,
        sincronizadoEm,
        firebaseAtualizadoEm
      );

      uuidsVacinasEnviadas.add(vacina.uuid);

      if (vacina.excluido_em) {
        resumo.excluidos += 1;
      } else {
        resumo.enviados += 1;
      }
    }

    const petsCollection = firestoreApi.collection(firestore, 'usuarios', firebaseUid, 'pets');
    const remoteSnapshot = await firestoreApi.getDocs(petsCollection);

    remoteSnapshot.forEach((petSnapshot) => {
      const petRemoto = normalizarPetRemoto(petSnapshot);
      const resultado = petsConsultas.upsertPetSincronizado(
        database,
        idUsuarioNormalizado,
        petRemoto
      );

      if (resultado.status === 'ignored') {
        resumo.conflitosIgnorados += 1;
        return;
      }

      if (!uuidsEnviados.has(petRemoto.uuid)) {
        if (resultado.status === 'deleted') {
          resumo.excluidos += 1;
        } else {
          resumo.recebidos += 1;
        }
      }
    });

    const vacinasCollection = firestoreApi.collection(firestore, 'usuarios', firebaseUid, 'vacinas');
    const remoteVaccinesSnapshot = await firestoreApi.getDocs(vacinasCollection);

    remoteVaccinesSnapshot.forEach((vacinaSnapshot) => {
      const vacinaRemota = normalizarVacinaRemota(vacinaSnapshot);
      const resultado = vacinasConsultas.upsertVacinaSincronizada(
        database,
        idUsuarioNormalizado,
        vacinaRemota
      );

      if (resultado.status === 'ignored') {
        resumo.conflitosIgnorados += 1;
        return;
      }

      if (!uuidsVacinasEnviadas.has(vacinaRemota.uuid)) {
        if (resultado.status === 'deleted') {
          resumo.excluidos += 1;
        } else {
          resumo.recebidos += 1;
        }
      }
    });

    usuarioConsultas.marcarUsuarioSincronizado(database, idUsuarioNormalizado, sincronizadoEm);

    resumo.mensagem = `Sincronização concluída: ${resumo.enviados} enviado(s), ${resumo.recebidos} recebido(s), ${resumo.excluidos} excluído(s), ${resumo.conflitosIgnorados} conflito(s) preservado(s).`;

    return resumo;
  }

  return { sincronizarDadosUsuario };
}

export async function sincronizarDadosUsuario(idUsuario) {
  return criarSyncService().sincronizarDadosUsuario(idUsuario);
}
