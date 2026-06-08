const dbModule = require('../../database/db');
const consultasVacinas = require('../../database/consultas/vacinas');

const db = dbModule.default || dbModule;

function createVaccine(idUsuario, vaccineData) {
  return consultasVacinas.criarVacina(db, idUsuario, vaccineData);
}

function getVaccinesByUser(idUsuario) {
  return consultasVacinas.listarVacinasPorUsuario(db, idUsuario);
}

function getVaccinesByPet(idUsuario, idPet) {
  return consultasVacinas.listarVacinasPorPet(db, idUsuario, idPet);
}

function getVaccineById(idUsuario, vaccineId) {
  return consultasVacinas.buscarVacinaPorId(db, idUsuario, vaccineId);
}

function updateVaccine(idUsuario, vaccineId, vaccineData) {
  return consultasVacinas.atualizarVacina(db, idUsuario, vaccineId, vaccineData);
}

function deleteVaccine(idUsuario, vaccineId) {
  return consultasVacinas.excluirVacina(db, idUsuario, vaccineId);
}

function deleteVaccinesByPet(idUsuario, petId) {
  return consultasVacinas.excluirVacinasPorPet(db, idUsuario, petId);
}

module.exports = {
  createVaccine,
  deleteVaccine,
  deleteVaccinesByPet,
  getVaccineById,
  getVaccinesByPet,
  getVaccinesByUser,
  updateVaccine,
};
