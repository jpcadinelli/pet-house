export const PET_PLACE_CATEGORY_META = {
  pet_shop: {
    label: 'Pet shop',
    description: 'Loja de produtos e serviços pet.',
    fallbackTitle: 'Pet shop',
    iconName: 'paw',
    accentColor: '#0B3C78',
    backgroundColor: '#DBEAFE',
  },
  veterinary: {
    label: 'Clínica veterinária',
    description: 'Atendimento veterinário para pets.',
    fallbackTitle: 'Clínica veterinária',
    iconName: 'medkit',
    accentColor: '#C2410C',
    backgroundColor: '#FFEDD5',
  },
  animal_boarding: {
    label: 'Hotel pet',
    description: 'Hospedagem e cuidados temporários para pets.',
    fallbackTitle: 'Hotel pet',
    iconName: 'home',
    accentColor: '#0F766E',
    backgroundColor: '#CCFBF1',
  },
  fallback: {
    label: 'Empreendimento pet',
    description: 'Serviço pet próximo a você.',
    fallbackTitle: 'Empreendimento pet',
    iconName: 'business',
    accentColor: '#475569',
    backgroundColor: '#E2E8F0',
  },
};

export function getPetPlaceCategory(tags = {}) {
  if (tags?.amenity === 'veterinary') {
    return 'veterinary';
  }

  if (tags?.amenity === 'animal_boarding') {
    return 'animal_boarding';
  }

  if (tags?.shop === 'pet') {
    return 'pet_shop';
  }

  return 'fallback';
}

export function getPetPlaceCategoryMeta(category) {
  return PET_PLACE_CATEGORY_META[category] || PET_PLACE_CATEGORY_META.fallback;
}
