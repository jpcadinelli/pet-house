const OPCOES_ESPECIE_PET = ['Cachorro', 'Gato', 'Outro'];
const OPCOES_SEXO_PET = ['Macho', 'Fêmea', 'Não informado'];

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarTextoOpcional(valor) {
  const normalizado = normalizarTexto(valor);
  return normalizado.length > 0 ? normalizado : null;
}

function criarDataUtcZerada(ano, mes, dia) {
  return new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0, 0));
}

function interpretarDataNascimento(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      return { invalida: true };
    }

    return criarDataUtcZerada(
      valor.getUTCFullYear(),
      valor.getUTCMonth() + 1,
      valor.getUTCDate()
    );
  }

  if (typeof valor === 'number') {
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return { invalida: true };
    }

    return criarDataUtcZerada(
      data.getUTCFullYear(),
      data.getUTCMonth() + 1,
      data.getUTCDate()
    );
  }

  const normalizado = normalizarTexto(valor);

  if (!normalizado) {
    return null;
  }

  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalizado);

  if (!partes) {
    return { invalida: true };
  }

  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const data = criarDataUtcZerada(ano, mes, dia);

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return { invalida: true };
  }

  return data;
}

function criarHojeUtcZerado(hoje = new Date()) {
  return criarDataUtcZerada(
    hoje.getUTCFullYear(),
    hoje.getUTCMonth() + 1,
    hoje.getUTCDate()
  );
}

function dataEhFutura(data, hoje = new Date()) {
  return data.getTime() > criarHojeUtcZerado(hoje).getTime();
}

function formatarDataNascimentoParaInput(data) {
  const dataNormalizada = interpretarDataNascimento(data);

  if (!dataNormalizada || dataNormalizada.invalida) {
    return '';
  }

  return dataNormalizada.toISOString().slice(0, 10);
}

function normalizarPetEntrada(entrada = {}) {
  return {
    nome: normalizarTexto(entrada.nome),
    especie: normalizarTexto(entrada.especie),
    raca: normalizarTextoOpcional(entrada.raca),
    data_nascimento: interpretarDataNascimento(entrada.data_nascimento),
    sexo: normalizarTexto(entrada.sexo || 'Não informado'),
    observacoes: normalizarTextoOpcional(entrada.observacoes),
    foto_uri: normalizarTextoOpcional(entrada.foto_uri),
  };
}

function validarPet(entrada = {}, opcoes = {}) {
  const dados = normalizarPetEntrada(entrada);
  const erros = {};

  if (!dados.nome) {
    erros.nome = 'Informe o nome do pet.';
  }

  if (!dados.especie) {
    erros.especie = 'Selecione a espécie do pet.';
  } else if (!OPCOES_ESPECIE_PET.includes(dados.especie)) {
    erros.especie = 'Selecione uma espécie válida.';
  }

  if (!dados.sexo) {
    erros.sexo = 'Selecione o sexo do pet.';
  } else if (!OPCOES_SEXO_PET.includes(dados.sexo)) {
    erros.sexo = 'Selecione um sexo válido.';
  }

  if (dados.data_nascimento?.invalida) {
    erros.data_nascimento = 'Use a data no formato AAAA-MM-DD.';
  } else if (dados.data_nascimento && dataEhFutura(dados.data_nascimento, opcoes.hoje)) {
    erros.data_nascimento = 'A data de nascimento não pode ser futura.';
  }

  return {
    dados,
    erros,
    valido: Object.keys(erros).length === 0,
  };
}

module.exports = {
  OPCOES_ESPECIE_PET,
  OPCOES_SEXO_PET,
  criarDataUtcZerada,
  formatarDataNascimentoParaInput,
  interpretarDataNascimento,
  normalizarPetEntrada,
  validarPet,
};
