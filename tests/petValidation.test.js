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

  expect(resultado.valido).toBe(false);
  expect(resultado.erros.nome).toBe('Informe o nome do pet.');
});

test('não aceita pet sem especie', () => {
  const resultado = validarPet({ ...PET_VALIDO, especie: '' });

  expect(resultado.valido).toBe(false);
  expect(resultado.erros.especie).toBe('Selecione a espécie do pet.');
});

test('não aceita pet sem sexo', () => {
  const resultado = validarPet({ ...PET_VALIDO, sexo: '' });

  expect(resultado.valido).toBe(false);
  expect(resultado.erros.sexo).toBe('Selecione o sexo do pet.');
});

test('não aceita espécie fora das opções permitidas', () => {
  const resultado = validarPet({ ...PET_VALIDO, especie: 'Coelho' });

  expect(resultado.valido).toBe(false);
  expect(resultado.erros.especie).toBe('Selecione uma espécie válida.');
});

test('não aceita sexo fora das opções permitidas', () => {
  const resultado = validarPet({ ...PET_VALIDO, sexo: 'Indefinido' });

  expect(resultado.valido).toBe(false);
  expect(resultado.erros.sexo).toBe('Selecione um sexo válido.');
});

test('permite sexo default Não informado', () => {
  const resultado = validarPet({ ...PET_VALIDO, sexo: undefined });

  expect(resultado.valido).toBe(true);
  expect(resultado.dados.sexo).toBe('Não informado');
});

test('não aceita data_nascimento futura', () => {
  const resultado = validarPet(
    { ...PET_VALIDO, data_nascimento: '2026-01-02' },
    { hoje: new Date(Date.UTC(2026, 0, 1, 12, 30, 0, 0)) }
  );

  expect(resultado.valido).toBe(false);
  expect(resultado.erros.data_nascimento).toBe('A data de nascimento não pode ser futura.');
});

test('normaliza data_nascimento para Date com horário zerado em UTC', () => {
  const resultado = validarPet({ ...PET_VALIDO, data_nascimento: '2020-05-10' });

  expect(resultado.valido).toBe(true);
  expect(resultado.dados.data_nascimento).toBeInstanceOf(Date);
  expect(resultado.dados.data_nascimento.toISOString()).toBe('2020-05-10T00:00:00.000Z');
  expect(formatarDataNascimentoParaInput(resultado.dados.data_nascimento)).toBe('2020-05-10');
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

  expect(resultado.valido).toBe(true);
  expect(resultado.erros).toEqual({});
  expect(resultado.dados.nome).toBe('Rex');
  expect(resultado.dados.raca).toBeNull();
  expect(resultado.dados.data_nascimento).toBeNull();
  expect(resultado.dados.observacoes).toBeNull();
  expect(resultado.dados.foto_uri).toBeNull();
});
