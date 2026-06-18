const React = require('react');
const { describe, expect, jest, test } = require('@jest/globals');
const { fireEvent, render } = require('@testing-library/react-native');

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
  };
}, { virtual: true });

const VaccineForm = require('../src/features/vaccines/components/VaccineForm').default;

const PETS = [
  { id: 1, nome: 'Rex' },
  { id: 2, nome: 'Mel' },
];

function criarProps(overrides = {}) {
  return {
    editing: false,
    errors: {},
    form: {
      id_pet: '1',
      nome: 'Antirrabica',
      data_aplicacao: '',
      proxima_dose: '2099-01-10',
      observacoes: '',
    },
    onCancel: jest.fn(),
    onChange: jest.fn(),
    onSubmit: jest.fn(),
    pets: PETS,
    ...overrides,
  };
}

describe('VaccineForm', () => {
  test('exibe todos os pets ao cadastrar vacina', async () => {
    const { getByText } = await render(
      React.createElement(VaccineForm, criarProps())
    );

    expect(getByText('Rex')).toBeTruthy();
    expect(getByText('Mel')).toBeTruthy();
  });

  test('exibe apenas o pet dono da vacina ao editar', async () => {
    const onChange = jest.fn();
    const { getByText, queryByText } = await render(
      React.createElement(VaccineForm, criarProps({
        editing: true,
        form: {
          id_pet: '2',
          nome: 'V10',
          data_aplicacao: '',
          proxima_dose: '2099-01-10',
          observacoes: '',
        },
        onChange,
      }))
    );

    expect(queryByText('Rex')).toBeNull();
    expect(getByText('Mel')).toBeTruthy();

    fireEvent.press(getByText('Mel'));

    expect(onChange).not.toHaveBeenCalledWith('id_pet', '2');
  });
});
