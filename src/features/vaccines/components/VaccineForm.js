import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import CalendarDateInput from '../../../shared/components/CalendarDateInput';
import { vaccineStyles } from '../../../shared/styles/vaccine.styles';

function renderFieldError(errors, field) {
  return errors[field] ? (
    <Text style={vaccineStyles.errorText}>{errors[field]}</Text>
  ) : null;
}

export default function VaccineForm({
  editing,
  errors,
  form,
  onCancel,
  onChange,
  onSubmit,
  pets,
}) {
  const selectedPetId = String(form.id_pet || '');

  return (
    <View style={vaccineStyles.formCard}>
      <Text style={vaccineStyles.formTitle}>
        {editing ? 'Editar vacina' : 'Nova vacina'}
      </Text>

      <Text style={vaccineStyles.inputLabel}>Pet *</Text>
      <View style={vaccineStyles.petChipWrap}>
        {pets.map((pet) => {
          const selected = String(pet.id) === selectedPetId;

          return (
            <TouchableOpacity
              key={pet.id}
              style={[
                vaccineStyles.petChip,
                selected && vaccineStyles.petChipSelected,
              ]}
              onPress={() => onChange('id_pet', String(pet.id))}
              activeOpacity={0.85}
            >
              <Ionicons
                name="paw-outline"
                size={16}
                color={selected ? '#0B3C78' : '#475569'}
              />
              <Text
                style={[
                  vaccineStyles.petChipText,
                  selected && vaccineStyles.petChipTextSelected,
                ]}
              >
                {pet.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {renderFieldError(errors, 'id_pet')}

      <Text style={vaccineStyles.inputLabel}>Nome da vacina *</Text>
      <TextInput
        placeholder="Ex: Antirrábica"
        placeholderTextColor="#7d8590"
        style={[vaccineStyles.input, errors.nome && vaccineStyles.inputError]}
        value={form.nome}
        onChangeText={(value) => onChange('nome', value)}
      />
      {renderFieldError(errors, 'nome')}

      <Text style={vaccineStyles.inputLabel}>Data de aplicação</Text>
      <CalendarDateInput
        value={form.data_aplicacao}
        onChange={(value) => onChange('data_aplicacao', value)}
        error={Boolean(errors.data_aplicacao)}
      />
      <Text style={vaccineStyles.helperText}>Campo opcional.</Text>
      {renderFieldError(errors, 'data_aplicacao')}

      <Text style={vaccineStyles.inputLabel}>Próxima dose *</Text>
      <CalendarDateInput
        value={form.proxima_dose}
        onChange={(value) => onChange('proxima_dose', value)}
        error={Boolean(errors.proxima_dose)}
      />
      <Text style={vaccineStyles.helperText}>
        O status é calculado automaticamente a partir desta data.
      </Text>
      {renderFieldError(errors, 'proxima_dose')}

      <Text style={vaccineStyles.inputLabel}>Observações</Text>
      <TextInput
        placeholder="Lote, clínica, reação ou detalhes importantes"
        placeholderTextColor="#7d8590"
        multiline
        textAlignVertical="top"
        style={[vaccineStyles.input, vaccineStyles.observacoesInput]}
        value={form.observacoes}
        onChangeText={(value) => onChange('observacoes', value)}
      />

      <View style={vaccineStyles.formActions}>
        <TouchableOpacity
          style={vaccineStyles.secondaryActionButton}
          onPress={onCancel}
          activeOpacity={0.85}
        >
          <Text style={vaccineStyles.secondaryActionButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={vaccineStyles.saveActionButton}
          onPress={onSubmit}
          activeOpacity={0.85}
        >
          <Text style={vaccineStyles.saveActionButtonText}>Salvar vacina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
