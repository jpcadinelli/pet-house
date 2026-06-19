const { beforeEach, describe, expect, jest, test } = require('@jest/globals');

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('../src/features/database/db', () => ({
  getDB: jest.fn(() => ({ name: 'db-padrao' })),
}));

jest.mock('../src/features/firebase/firebaseConfig', () => ({
  firestoreDb: { name: 'firestore-padrao' },
}));

jest.mock('../src/features/firebase/firebaseAuthService', () => ({
  garantirUsuarioFirebaseAutenticado: jest.fn(),
}));

const { criarSyncService } = require('../src/features/sync/services/syncService');

function criarSnapshot(remotos) {
  return {
    forEach(callback) {
      remotos.forEach((pet) => {
        callback({
          id: pet.uuid,
          data: () => pet,
        });
      });
    },
  };
}

function criarDependencias({
  usuario = {},
  petsPendentes = [],
  petsRemotos = [],
  upsertStatus = 'inserted',
  authenticatedUid = usuario.firebase_uid || 'firebase-uid-1',
} = {}) {
  const database = { name: 'db-fake' };
  const firestore = { name: 'firestore-fake' };
  const refs = [];
  const docsGravados = [];
  const usuarioLocal = {
    id: 7,
    nome: 'Ana',
    email: 'ana@email.com',
    firebase_uid: 'firebase-uid-1',
    atualizado_em: 1700000000000,
    ...usuario,
  };

  const firestoreApi = {
    doc: jest.fn((...path) => {
      const ref = { type: 'doc', path };
      refs.push(ref);
      return ref;
    }),
    collection: jest.fn((...path) => ({ type: 'collection', path })),
    setDoc: jest.fn(async (ref, data, options) => {
      docsGravados.push({ ref, data, options });
    }),
    getDocs: jest.fn(async () => criarSnapshot(petsRemotos)),
  };
  const usuarioConsultas = {
    buscarUsuarioPorId: jest.fn(() => usuarioLocal),
    atualizarFirebaseUidUsuario: jest.fn(() => ({ changes: 1 })),
    marcarUsuarioSincronizado: jest.fn(() => ({ changes: 1 })),
  };
  const petsConsultas = {
    listarPetsPendentesSincronizacao: jest.fn(() => petsPendentes),
    marcarPetComoSincronizado: jest.fn(() => 1),
    upsertPetSincronizado: jest.fn(() => ({ status: upsertStatus })),
  };
  const garantirUsuarioFirebaseAutenticado = jest.fn(() => ({ uid: authenticatedUid }));

  return {
    database,
    docsGravados,
    firestore,
    firestoreApi,
    garantirUsuarioFirebaseAutenticado,
    petsConsultas,
    refs,
    usuarioConsultas,
  };
}

describe('syncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('envia pet pendente e marca como sincronizado', async () => {
    const petPendente = {
      uuid: 'pet-1',
      nome: 'Rex',
      especie: 'Cachorro',
      raca: 'SRD',
      data_nascimento: null,
      sexo: 'Macho',
      observacoes: null,
      foto_uri: null,
      criado_em: new Date(1700000000000),
      atualizado_em: new Date(1700000100000),
      excluido_em: null,
    };
    const deps = criarDependencias({ petsPendentes: [petPendente] });
    const service = criarSyncService(deps);

    const resumo = await service.sincronizarDadosUsuario(7);

    expect(deps.garantirUsuarioFirebaseAutenticado).toHaveBeenCalledTimes(1);
    expect(deps.firestoreApi.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: [deps.firestore, 'usuarios', 'firebase-uid-1', 'pets', 'pet-1'] }),
      expect.objectContaining({ uuid: 'pet-1', nome: 'Rex', excluido_em: null }),
      { merge: true }
    );
    expect(deps.petsConsultas.marcarPetComoSincronizado).toHaveBeenCalledWith(
      deps.database,
      '7',
      'pet-1',
      expect.any(Number),
      expect.any(Number)
    );
    expect(resumo.enviados).toBe(1);
  });

  test('recebe pet remoto e faz upsert local', async () => {
    const petRemoto = {
      uuid: 'pet-remoto',
      nome: 'Mel',
      especie: 'Gato',
      sexo: 'Fêmea',
      atualizado_em: 1700000200000,
      firebase_atualizado_em: 1700000200000,
    };
    const deps = criarDependencias({
      usuario: { firebase_uid: 'firebase-uid-existente' },
      authenticatedUid: 'firebase-uid-existente',
      petsRemotos: [petRemoto],
    });
    const service = criarSyncService(deps);

    const resumo = await service.sincronizarDadosUsuario(7);

    expect(deps.garantirUsuarioFirebaseAutenticado).toHaveBeenCalledTimes(1);
    expect(deps.petsConsultas.upsertPetSincronizado).toHaveBeenCalledWith(
      deps.database,
      '7',
      expect.objectContaining({ uuid: 'pet-remoto', nome: 'Mel' })
    );
    expect(resumo.recebidos).toBe(1);
  });

  test('contabiliza conflito quando upsert preserva local pending contra remoto antigo', async () => {
    const deps = criarDependencias({
      usuario: { firebase_uid: 'firebase-uid-existente' },
      authenticatedUid: 'firebase-uid-existente',
      petsRemotos: [{ uuid: 'pet-antigo', nome: 'Rex antigo', especie: 'Cachorro', sexo: 'Macho' }],
      upsertStatus: 'ignored',
    });
    const service = criarSyncService(deps);

    const resumo = await service.sincronizarDadosUsuario(7);

    expect(resumo.conflitosIgnorados).toBe(1);
    expect(resumo.recebidos).toBe(0);
  });




  test('bloqueia conta local antiga sem firebase_uid', async () => {
    const deps = criarDependencias({
      usuario: { firebase_uid: null },
    });
    const service = criarSyncService(deps);

    await expect(service.sincronizarDadosUsuario(7)).rejects.toThrow('ainda não está vinculada ao Firebase');
    expect(deps.garantirUsuarioFirebaseAutenticado).not.toHaveBeenCalled();
    expect(deps.firestoreApi.setDoc).not.toHaveBeenCalled();
  });

  test('bloqueia sync com currentUser ausente', async () => {
    const deps = criarDependencias({
      usuario: { firebase_uid: 'firebase-uid-1' },
    });
    deps.garantirUsuarioFirebaseAutenticado.mockImplementationOnce(() => {
      throw new Error('sem sessão');
    });
    const service = criarSyncService(deps);

    await expect(service.sincronizarDadosUsuario(7)).rejects.toThrow('Sessão Firebase expirada ou ausente');
    expect(deps.firestoreApi.setDoc).not.toHaveBeenCalled();
  });

  test('bloqueia quando firebase_uid local diverge do uid autenticado', async () => {
    const deps = criarDependencias({
      usuario: { firebase_uid: 'firebase-uid-local' },
      authenticatedUid: 'firebase-uid-diferente',
    });
    const service = criarSyncService(deps);

    await expect(service.sincronizarDadosUsuario(7)).rejects.toThrow('Usuário Firebase diferente');
    expect(deps.firestoreApi.setDoc).not.toHaveBeenCalled();
  });

  test('marca exclusao local no remoto sem hard delete', async () => {
    const petExcluido = {
      uuid: 'pet-excluido',
      nome: 'Rex',
      especie: 'Cachorro',
      raca: null,
      data_nascimento: null,
      sexo: 'Macho',
      observacoes: null,
      foto_uri: null,
      criado_em: new Date(1700000000000),
      atualizado_em: new Date(1700000300000),
      excluido_em: new Date(1700000300000),
    };
    const deps = criarDependencias({ petsPendentes: [petExcluido] });
    const service = criarSyncService(deps);

    const resumo = await service.sincronizarDadosUsuario(7);

    expect(deps.firestoreApi.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: [deps.firestore, 'usuarios', 'firebase-uid-1', 'pets', 'pet-excluido'] }),
      expect.objectContaining({ excluido_em: 1700000300000 }),
      { merge: true }
    );
    expect(resumo.excluidos).toBe(1);
  });
});
