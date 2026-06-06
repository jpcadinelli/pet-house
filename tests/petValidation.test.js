const assert = require('node:assert/strict');
const test = require('node:test');

const {
  formatarDataNascimentoParaInput,
  validarPet,
} = require('../src/features/pets/services/petValidation');

const PET_VALIDO = {
  nome: 'Luna',
  especie: 'Gato',
  raca: 'SRD',
  data_nascimento: '2020-05-10',
  sexo: 'Fêmea',
  observacoes: 'Calma e carinhosa.',
};

test('não aceita pet sem nome', () => {
  const resultado = validarPet({ ...PET_VALIDO, nome: '   ' });

  assert.equal(resultado.valido, false);
  assert.equal(resultado.erros.nome, 'Informe o nome do pet.');
});

test('não aceita pet sem especie', () => {
  const resultado = validarPet({ ...PET_VALIDO, especie: '' });

  assert.equal(resultado.valido, false);
  assert.equal(resultado.erros.especie, 'Selecione a espécie do pet.');
});

test('não aceita pet sem sexo', () => {
  const resultado = validarPet({ ...PET_VALIDO, sexo: '' });

  assert.equal(resultado.valido, false);
  assert.equal(resultado.erros.sexo, 'Selecione o sexo do pet.');
});

test('não aceita espécie fora das opções permitidas', () => {
  const resultado = validarPet({ ...PET_VALIDO, especie: 'Coelho' });

  assert.equal(resultado.valido, false);
  assert.equal(resultado.erros.especie, 'Selecione uma espécie válida.');
});

test('não aceita sexo fora das opções permitidas', () => {
  const resultado = validarPet({ ...PET_VALIDO, sexo: 'Indefinido' });

  assert.equal(resultado.valido, false);
  assert.equal(resultado.erros.sexo, 'Selecione um sexo válido.');
});

test('permite sexo default Não informado', () => {
  const resultado = validarPet({ ...PET_VALIDO, sexo: undefined });

  assert.equal(resultado.valido, true);
  assert.equal(resultado.dados.sexo, 'Não informado');
});

test('não aceita data_nascimento futura', () => {
  const resultado = validarPet(
    { ...PET_VALIDO, data_nascimento: '2026-01-02' },
    { hoje: new Date(Date.UTC(2026, 0, 1, 12, 30, 0, 0)) }
  );

  assert.equal(resultado.valido, false);
  assert.equal(resultado.erros.data_nascimento, 'A data de nascimento não pode ser futura.');
});

test('normaliza data_nascimento para Date com horário zerado em UTC', () => {
  const resultado = validarPet({ ...PET_VALIDO, data_nascimento: '2020-05-10' });

  assert.equal(resultado.valido, true);
  assert.ok(resultado.dados.data_nascimento instanceof Date);
  assert.equal(resultado.dados.data_nascimento.toISOString(), '2020-05-10T00:00:00.000Z');
  assert.equal(formatarDataNascimentoParaInput(resultado.dados.data_nascimento), '2020-05-10');
});

test('aceita pet válido e normaliza campos opcionais vazios', () => {
  const resultado = validarPet({
    nome: '  Rex  ',
    especie: 'Cachorro',
    raca: '   ',
    data_nascimento: '',
    sexo: 'Não informado',
    observacoes: '',
    foto_uri: '',
  });

  assert.equal(resultado.valido, true);
  assert.deepEqual(resultado.erros, {});
  assert.equal(resultado.dados.nome, 'Rex');
  assert.equal(resultado.dados.raca, null);
  assert.equal(resultado.dados.data_nascimento, null);
  assert.equal(resultado.dados.observacoes, null);
  assert.equal(resultado.dados.foto_uri, null);
});
