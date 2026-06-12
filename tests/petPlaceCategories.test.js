const { describe, expect, test } = require('@jest/globals');

const {
  getPetPlaceCategory,
  getPetPlaceCategoryMeta,
} = require('../src/shared/constants/petPlaceCategories');

describe('categorias de empreendimentos pet', () => {
  test('classifica tags conhecidas do OpenStreetMap', () => {
    expect(getPetPlaceCategory({ shop: 'pet' })).toBe('pet_shop');
    expect(getPetPlaceCategory({ amenity: 'veterinary' })).toBe('veterinary');
    expect(getPetPlaceCategory({ amenity: 'animal_boarding' })).toBe('animal_boarding');
  });

  test('usa categoria fallback quando tags não indicam serviço pet conhecido', () => {
    expect(getPetPlaceCategory({ amenity: 'cafe' })).toBe('fallback');
    expect(getPetPlaceCategory()).toBe('fallback');
  });

  test('retorna metadados da categoria ou fallback para categoria desconhecida', () => {
    expect(getPetPlaceCategoryMeta('veterinary')).toEqual(expect.objectContaining({
      label: 'Clínica veterinária',
      fallbackTitle: 'Clínica veterinária',
      iconName: 'medkit',
    }));

    expect(getPetPlaceCategoryMeta('inexistente')).toEqual(expect.objectContaining({
      label: 'Empreendimento pet',
      fallbackTitle: 'Empreendimento pet',
      iconName: 'business',
    }));
  });
});
