const UM_DIA_MS = 24 * 60 * 60 * 1000;

const VACCINE_STATUS = {
  EM_DIA: 'em_dia',
  PROXIMA_DA_DATA: 'proxima_da_data',
  ATRASADA: 'atrasada',
};

const STATUS_LABELS = {
  [VACCINE_STATUS.EM_DIA]: 'Em dia',
  [VACCINE_STATUS.PROXIMA_DA_DATA]: 'Próxima da data',
  [VACCINE_STATUS.ATRASADA]: 'Atrasada',
};

const STATUS_COLORS = {
  [VACCINE_STATUS.EM_DIA]: '#15803D',
  [VACCINE_STATUS.PROXIMA_DA_DATA]: '#C2410C',
  [VACCINE_STATUS.ATRASADA]: '#B42318',
};

const STATUS_BACKGROUNDS = {
  [VACCINE_STATUS.EM_DIA]: '#ECFDF3',
  [VACCINE_STATUS.PROXIMA_DA_DATA]: '#FFF7ED',
  [VACCINE_STATUS.ATRASADA]: '#FEF3F2',
};

const STATUS_ORDER = {
  [VACCINE_STATUS.ATRASADA]: 0,
  [VACCINE_STATUS.PROXIMA_DA_DATA]: 1,
  [VACCINE_STATUS.EM_DIA]: 2,
};

function criarDataUtcZerada(ano, mes, dia) {
  return new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0, 0));
}

function criarHojeUtcZerado(hoje = new Date()) {
  return criarDataUtcZerada(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    hoje.getDate()
  );
}

function interpretarDataVacina(valor) {
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

  const normalizado = String(valor).trim();

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

function calcularStatusVacina(proximaDose, hoje = new Date()) {
  const dataProximaDose = interpretarDataVacina(proximaDose);

  if (!dataProximaDose || dataProximaDose.invalida) {
    return null;
  }

  const hojeNormalizado = criarHojeUtcZerado(hoje);
  const diasAteProximaDose = Math.floor(
    (dataProximaDose.getTime() - hojeNormalizado.getTime()) / UM_DIA_MS
  );

  if (diasAteProximaDose <= 0) {
    return VACCINE_STATUS.ATRASADA;
  }

  if (diasAteProximaDose <= 7) {
    return VACCINE_STATUS.PROXIMA_DA_DATA;
  }

  return VACCINE_STATUS.EM_DIA;
}

function formatarDataVacinaParaInput(data) {
  const dataNormalizada = interpretarDataVacina(data);

  if (!dataNormalizada || dataNormalizada.invalida) {
    return '';
  }

  return dataNormalizada.toISOString().slice(0, 10);
}

function formatarDataVacinaParaUsuario(data) {
  const dataNormalizada = interpretarDataVacina(data);

  if (!dataNormalizada || dataNormalizada.invalida) {
    return '';
  }

  const dia = String(dataNormalizada.getUTCDate()).padStart(2, '0');
  const mes = String(dataNormalizada.getUTCMonth() + 1).padStart(2, '0');
  const ano = dataNormalizada.getUTCFullYear();

  return `${dia}/${mes}/${ano}`;
}

function obterDetalhesStatus(status) {
  const statusNormalizado = STATUS_LABELS[status] ? status : VACCINE_STATUS.EM_DIA;

  return {
    value: statusNormalizado,
    label: STATUS_LABELS[statusNormalizado],
    color: STATUS_COLORS[statusNormalizado],
    backgroundColor: STATUS_BACKGROUNDS[statusNormalizado],
  };
}

function ordenarVacinasPorStatus(vacinas = []) {
  return [...vacinas].sort((primeira, segunda) => {
    const ordemStatus =
      (STATUS_ORDER[primeira.status] ?? 99) - (STATUS_ORDER[segunda.status] ?? 99);

    if (ordemStatus !== 0) {
      return ordemStatus;
    }

    const primeiraData = interpretarDataVacina(primeira.proxima_dose)?.getTime?.() ?? 0;
    const segundaData = interpretarDataVacina(segunda.proxima_dose)?.getTime?.() ?? 0;

    if (primeiraData !== segundaData) {
      return primeiraData - segundaData;
    }

    return Number(primeira.id || 0) - Number(segunda.id || 0);
  });
}

module.exports = {
  STATUS_BACKGROUNDS,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_ORDER,
  UM_DIA_MS,
  VACCINE_STATUS,
  calcularStatusVacina,
  criarDataUtcZerada,
  criarHojeUtcZerado,
  formatarDataVacinaParaInput,
  formatarDataVacinaParaUsuario,
  interpretarDataVacina,
  obterDetalhesStatus,
  ordenarVacinasPorStatus,
};
