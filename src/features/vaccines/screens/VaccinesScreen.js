import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import VaccineCard from '../components/VaccineCard';
import VaccineForm from '../components/VaccineForm';
import { vaccineStyles } from '../../../shared/styles/vaccine.styles';

const petRepository = require('../../pets/services/petRepository');
const vaccineRepository = require('../services/vaccineRepository');
const {
  criarFormularioVacinaVazio,
  formatarVacinaParaFormulario,
  validarVacina,
} = require('../services/vaccineValidation');

function obterPrimeiraMensagemErro(erros) {
  return Object.values(erros).find(Boolean) || 'Revise os dados da vacina.';
}

export default function VaccinesScreen({ idUsuario }) {
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [editingVaccine, setEditingVaccine] = useState(null);
  const [vaccineForm, setVaccineForm] = useState(() => criarFormularioVacinaVazio());
  const [vaccineFormErrors, setVaccineFormErrors] = useState({});

  const loadVaccinesForPet = useCallback((petId) => {
    if (!idUsuario || !petId) {
      setVaccines([]);
      return;
    }

    setVaccines(vaccineRepository.getVaccinesByPet(idUsuario, petId));
  }, [idUsuario]);

  const refreshData = useCallback(() => {
    if (!idUsuario) {
      setPets([]);
      setVaccines([]);
      setSelectedPetId(null);
      return;
    }

    setLoading(true);

    try {
      const loadedPets = petRepository.listarPetsPorUsuario(idUsuario);
      const selectedStillExists = loadedPets.some(
        (pet) => String(pet.id) === String(selectedPetId)
      );
      const nextSelectedPetId = selectedStillExists
        ? selectedPetId
        : loadedPets[0]?.id ?? null;

      setPets(loadedPets);
      setSelectedPetId(nextSelectedPetId ? String(nextSelectedPetId) : null);

      if (nextSelectedPetId) {
        loadVaccinesForPet(nextSelectedPetId);
      } else {
        setVaccines([]);
      }
    } catch (error) {
      console.log('Erro ao carregar vacinas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as vacinas.');
    } finally {
      setLoading(false);
    }
  }, [idUsuario, loadVaccinesForPet, selectedPetId]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const selectedPet = pets.find((pet) => String(pet.id) === String(selectedPetId));

  const updateVaccineFormField = (field, value) => {
    setVaccineForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    if (vaccineFormErrors[field]) {
      setVaccineFormErrors((currentErrors) => ({
        ...currentErrors,
        [field]: null,
      }));
    }
  };

  const selectPet = (petId) => {
    const nextPetId = String(petId);
    setSelectedPetId(nextPetId);
    loadVaccinesForPet(nextPetId);
  };

  const openCreateForm = () => {
    if (pets.length === 0) {
      Alert.alert('Cadastre um pet', 'Cadastre um pet antes de adicionar vacinas.');
      return;
    }

    const initialPetId = selectedPetId || String(pets[0].id);
    setEditingVaccine(null);
    setVaccineForm(criarFormularioVacinaVazio(initialPetId));
    setVaccineFormErrors({});
    setViewMode('form');
  };

  const openEditForm = (vaccine) => {
    setEditingVaccine(vaccine);
    setVaccineForm(formatarVacinaParaFormulario(vaccine));
    setVaccineFormErrors({});
    setViewMode('form');
  };

  const backToList = () => {
    setViewMode('list');
    setEditingVaccine(null);
    setVaccineForm(criarFormularioVacinaVazio(selectedPetId));
    setVaccineFormErrors({});
  };

  const handleSaveVaccine = () => {
    const validacao = validarVacina(vaccineForm);
    setVaccineFormErrors(validacao.erros);

    if (!validacao.valido) {
      Alert.alert('Revise o cadastro', obterPrimeiraMensagemErro(validacao.erros));
      return;
    }

    try {
      if (editingVaccine) {
        vaccineRepository.updateVaccine(idUsuario, editingVaccine.id, vaccineForm);
        Alert.alert('Sucesso', 'Vacina atualizada com sucesso.');
      } else {
        vaccineRepository.createVaccine(idUsuario, vaccineForm);
        Alert.alert('Sucesso', 'Vacina cadastrada com sucesso.');
      }

      const nextPetId = String(validacao.dados.id_pet);
      setSelectedPetId(nextPetId);
      setViewMode('list');
      setEditingVaccine(null);
      setVaccineForm(criarFormularioVacinaVazio(nextPetId));
      setVaccineFormErrors({});
      loadVaccinesForPet(nextPetId);
    } catch (error) {
      console.log('Erro ao salvar vacina:', error);
      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : 'Não foi possível salvar a vacina.'
      );
    }
  };

  const deleteSelectedVaccine = (vaccine) => {
    try {
      vaccineRepository.deleteVaccine(idUsuario, vaccine.id);
      loadVaccinesForPet(selectedPetId);
      Alert.alert('Vacina excluída', 'A vacina foi removida da listagem.');
    } catch (error) {
      console.log('Erro ao excluir vacina:', error);
      Alert.alert('Erro', 'Não foi possível excluir a vacina.');
    }
  };

  const confirmDeleteVaccine = (vaccine) => {
    Alert.alert(
      'Excluir vacina',
      `Deseja excluir ${vaccine.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteSelectedVaccine(vaccine),
        },
      ]
    );
  };

  const renderPetSelector = () => (
    <View style={vaccineStyles.petSelectorCard}>
      <Text style={vaccineStyles.petSelectorTitle}>Selecione o pet</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={vaccineStyles.petChipRow}
      >
        {pets.map((pet) => {
          const selected = String(pet.id) === String(selectedPetId);

          return (
            <TouchableOpacity
              key={pet.id}
              style={[
                vaccineStyles.petChip,
                selected && vaccineStyles.petChipSelected,
              ]}
              onPress={() => selectPet(pet.id)}
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
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => {
    if (!idUsuario) {
      return (
        <View style={vaccineStyles.emptyBox}>
          <Ionicons name="alert-circle-outline" size={34} color="#0B3C78" />
          <Text style={vaccineStyles.emptyTitle}>Usuário não identificado</Text>
          <Text style={vaccineStyles.emptyText}>
            Entre novamente para vincular vacinas ao seu perfil.
          </Text>
        </View>
      );
    }

    if (pets.length === 0) {
      return (
        <View style={vaccineStyles.emptyBox}>
          <Ionicons name="paw-outline" size={36} color="#0B3C78" />
          <Text style={vaccineStyles.emptyTitle}>Nenhum pet cadastrado</Text>
          <Text style={vaccineStyles.emptyText}>
            Cadastre um pet antes de adicionar vacinas.
          </Text>
        </View>
      );
    }

    return (
      <View style={vaccineStyles.emptyBox}>
        <Ionicons name="medkit-outline" size={36} color="#0B3C78" />
        <Text style={vaccineStyles.emptyTitle}>Nenhuma vacina cadastrada</Text>
        <Text style={vaccineStyles.emptyText}>
          {selectedPet
            ? `Adicione a primeira vacina de ${selectedPet.nome}.`
            : 'Selecione um pet para listar as vacinas.'}
        </Text>
      </View>
    );
  };

  const renderList = () => (
    <>
      {pets.length > 0 ? renderPetSelector() : null}

      <View style={vaccineStyles.sectionHeader}>
        <View>
          <Text style={vaccineStyles.sectionTitle}>Vacinas</Text>
          <Text style={vaccineStyles.sectionSubtitle}>
            {selectedPet
              ? `Controle de ${selectedPet.nome}`
              : 'Controle local por pet'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            vaccineStyles.addButton,
            pets.length === 0 && vaccineStyles.addButtonDisabled,
          ]}
          onPress={openCreateForm}
          activeOpacity={0.85}
          disabled={pets.length === 0}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={vaccineStyles.emptyText}>Carregando vacinas...</Text>
      ) : vaccines.length === 0 ? (
        renderEmptyState()
      ) : (
        vaccines.map((vaccine) => (
          <VaccineCard
            key={vaccine.id}
            vaccine={vaccine}
            onEdit={openEditForm}
            onDelete={confirmDeleteVaccine}
          />
        ))
      )}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={vaccineStyles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={vaccineStyles.container}
        contentContainerStyle={vaccineStyles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={vaccineStyles.headerCard}>
          <View style={vaccineStyles.headerIcon}>
            <Ionicons name="medkit-outline" size={26} color="#FFFFFF" />
          </View>
          <Text style={vaccineStyles.headerTitle}>Controle de Vacinas</Text>
          <Text style={vaccineStyles.headerSubtitle}>
            Cadastre doses, acompanhe prazos e priorize vacinas atrasadas mesmo offline.
          </Text>
        </View>

        {viewMode === 'form' ? (
          <>
            <TouchableOpacity
              style={vaccineStyles.backButton}
              onPress={backToList}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={18} color="#0B3C78" />
              <Text style={vaccineStyles.backButtonText}>Voltar</Text>
            </TouchableOpacity>

            <VaccineForm
              editing={Boolean(editingVaccine)}
              errors={vaccineFormErrors}
              form={vaccineForm}
              onCancel={backToList}
              onChange={updateVaccineFormField}
              onSubmit={handleSaveVaccine}
              pets={pets}
            />
          </>
        ) : (
          renderList()
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
