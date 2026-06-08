const {
  formatarDataVacinaParaInput,
  interpretarDataVacina,
} = require('./vaccineStatus');

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarTextoOpcional(valor) {
  const normalizado = normalizarTexto(valor);
  return normalizado.length > 0 ? normalizado : null;
}

function normalizarIdPet(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function normalizarVacinaEntrada(entrada = {}) {
  return {
    id_pet: normalizarIdPet(entrada.id_pet ?? entrada.idPet),
    nome: normalizarTexto(entrada.nome),
    data_aplicacao: interpretarDataVacina(entrada.data_aplicacao),
    proxima_dose: interpretarDataVacina(entrada.proxima_dose),
    observacoes: normalizarTextoOpcional(entrada.observacoes),
  };
}

function validarVacina(entrada = {}) {
  const dados = normalizarVacinaEntrada(entrada);
  const erros = {};

  if (!dados.id_pet) {
    erros.id_pet = 'Selecione um pet para vincular a vacina.';
  }

  if (!dados.nome) {
    erros.nome = 'Informe o nome da vacina.';
  }

  if (dados.data_aplicacao?.invalida) {
    erros.data_aplicacao = 'Use a data de aplicação no formato AAAA-MM-DD.';
  }

  if (dados.proxima_dose?.invalida) {
    erros.proxima_dose = 'Use a data da próxima dose no formato AAAA-MM-DD.';
  } else if (!dados.proxima_dose) {
    erros.proxima_dose = 'Informe a data da próxima dose.';
  }

  return {
    dados,
    erros,
    valido: Object.keys(erros).length === 0,
  };
}

function formatarVacinaParaFormulario(vacina = {}) {
  return {
    id_pet: vacina.id_pet ? String(vacina.id_pet) : '',
    nome: vacina.nome || '',
    data_aplicacao: formatarDataVacinaParaInput(vacina.data_aplicacao),
    proxima_dose: formatarDataVacinaParaInput(vacina.proxima_dose),
    observacoes: vacina.observacoes || '',
  };
}

function criarFormularioVacinaVazio(idPet = '') {
  return {
    id_pet: idPet ? String(idPet) : '',
    nome: '',
    data_aplicacao: '',
    proxima_dose: '',
    observacoes: '',
  };
}

module.exports = {
  criarFormularioVacinaVazio,
  formatarVacinaParaFormulario,
  normalizarVacinaEntrada,
  validarVacina,
};
