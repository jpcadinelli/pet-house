const consultasPets = require('../../database/consultas/pets');

function criarRepositorioPets(database) {
  return {
    atualizarPet: (id, idUsuario, entrada) => consultasPets.atualizarPet(database, id, idUsuario, entrada),
    buscarPetPorId: (id, idUsuario) => consultasPets.buscarPetPorId(database, id, idUsuario),
    criarPet: (idUsuario, entrada) => consultasPets.criarPet(database, idUsuario, entrada),
    excluirPet: (id, idUsuario) => consultasPets.excluirPet(database, id, idUsuario),
    listarPetsPorUsuario: (idUsuario) => consultasPets.listarPetsPorUsuario(database, idUsuario),
    listarPetsPendentesSincronizacao: (idUsuario) => consultasPets.listarPetsPendentesSincronizacao(database, idUsuario),
    marcarPetComoSincronizado: (idUsuario, uuid, sincronizadoEm, firebaseAtualizadoEm) =>
      consultasPets.marcarPetComoSincronizado(database, idUsuario, uuid, sincronizadoEm, firebaseAtualizadoEm),
    removerPetSincronizadoSeExcluido: (idUsuario, uuid) =>
      consultasPets.removerPetSincronizadoSeExcluido(database, idUsuario, uuid),
    buscarPetPorUuid: (idUsuario, uuid) => consultasPets.buscarPetPorUuid(database, idUsuario, uuid),
    upsertPetSincronizado: (idUsuario, petRemoto) => consultasPets.upsertPetSincronizado(database, idUsuario, petRemoto),
  };
}

module.exports = {
  criarRepositorioPets,
  converterDataParaTimestamp: consultasPets.converterDataParaTimestamp,
  converterTimestampParaData: consultasPets.converterTimestampParaData,
  gerarUuidLocal: consultasPets.gerarUuidLocal,
  mapearLinhaPet: consultasPets.mapearLinhaPet,
  SYNC_STATUS_PENDING: consultasPets.SYNC_STATUS_PENDING,
  SYNC_STATUS_SYNCED: consultasPets.SYNC_STATUS_SYNCED,
};
