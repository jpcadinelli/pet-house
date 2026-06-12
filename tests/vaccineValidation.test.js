const {
  criarFormularioVacinaVazio,
  formatarVacinaParaFormulario,
  validarVacina,
} = require('../src/features/vaccines/services/vaccineValidation');

const VACINA_VALIDA = {
  id_pet: '1',
  nome: 'Antirrábica',
  data_aplicacao: '',
  proxima_dose: '2099-01-10',
  observacoes: '',
};

test('mantém data_aplicacao opcional e normaliza proxima_dose', () => {
  const resultado = validarVacina(VACINA_VALIDA);

  expect(resultado.valido).toBe(true);
  expect(resultado.erros).toEqual({});
  expect(resultado.dados.data_aplicacao).toBeNull();
  expect(resultado.dados.proxima_dose).toBeInstanceOf(Date);
  expect(resultado.dados.proxima_dose.toISOString()).toBe('2099-01-10T00:00:00.000Z');
});

test('mantém proxima_dose obrigatória', () => {
  const resultado = validarVacina({ ...VACINA_VALIDA, proxima_dose: '' });

  expect(resultado.valido).toBe(false);
  expect(resultado.erros.proxima_dose).toBe('Informe a data da próxima dose.');
});

test('cria formulário vazio e formata datas para YYYY-MM-DD', () => {
  const formularioVazio = criarFormularioVacinaVazio(3);
  const formularioEdicao = formatarVacinaParaFormulario({
    id_pet: 3,
    nome: 'V10',
    data_aplicacao: new Date(Date.UTC(2026, 2, 5)),
    proxima_dose: new Date(Date.UTC(2027, 2, 5)),
    observacoes: null,
  });

  expect(formularioVazio).toEqual({
    id_pet: '3',
    nome: '',
    data_aplicacao: '',
    proxima_dose: '',
    observacoes: '',
  });
  expect(formularioEdicao.data_aplicacao).toBe('2026-03-05');
  expect(formularioEdicao.proxima_dose).toBe('2027-03-05');
});
