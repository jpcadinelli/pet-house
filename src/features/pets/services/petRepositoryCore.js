const consultasPets = require('../../database/consultas/pets');

function criarRepositorioPets(database) {
  return {
    atualizarPet: (id, idUsuario, entrada) => consultasPets.atualizarPet(database, id, idUsuario, entrada),
    buscarPetPorId: (id, idUsuario) => consultasPets.buscarPetPorId(database, id, idUsuario),
    criarPet: (idUsuario, entrada) => consultasPets.criarPet(database, idUsuario, entrada),
    excluirPet: (id, idUsuario) => consultasPets.excluirPet(database, id, idUsuario),
    listarPetsPorUsuario: (idUsuario) => consultasPets.listarPetsPorUsuario(database, idUsuario),
  };
}

module.exports = {
  criarRepositorioPets,
  converterDataParaTimestamp: consultasPets.converterDataParaTimestamp,
  converterTimestampParaData: consultasPets.converterTimestampParaData,
  mapearLinhaPet: consultasPets.mapearLinhaPet,
};
