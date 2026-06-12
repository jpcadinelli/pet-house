const assert = require('node:assert/strict');
const test = require('node:test');

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

  assert.equal(resultado.valido, true);
  assert.deepEqual(resultado.erros, {});
  assert.equal(resultado.dados.data_aplicacao, null);
  assert.ok(resultado.dados.proxima_dose instanceof Date);
  assert.equal(resultado.dados.proxima_dose.toISOString(), '2099-01-10T00:00:00.000Z');
});

test('mantém proxima_dose obrigatória', () => {
  const resultado = validarVacina({ ...VACINA_VALIDA, proxima_dose: '' });

  assert.equal(resultado.valido, false);
  assert.equal(resultado.erros.proxima_dose, 'Informe a data da próxima dose.');
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

  assert.deepEqual(formularioVazio, {
    id_pet: '3',
    nome: '',
    data_aplicacao: '',
    proxima_dose: '',
    observacoes: '',
  });
  assert.equal(formularioEdicao.data_aplicacao, '2026-03-05');
  assert.equal(formularioEdicao.proxima_dose, '2027-03-05');
});
