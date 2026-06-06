import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { appStyles } from '../../../shared/styles/app.styles';
import { profileStyles } from '../../../shared/styles/profile.styles';

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const QUANTIDADE_ANOS_VISIVEIS = 12;

const petRepository = require('../../pets/services/petRepository');
const {
  OPCOES_ESPECIE_PET,
  OPCOES_SEXO_PET,
  formatarDataNascimentoParaInput,
  validarPet,
} = require('../../pets/services/petValidation');

function criarFormularioPetVazio() {
  return {
    nome: '',
    especie: 'Cachorro',
    raca: '',
    data_nascimento: '',
    sexo: 'Não informado',
    observacoes: '',
    foto_uri: null,
  };
}

function obterFormularioAPartirDoPet(pet) {
  return {
    nome: pet.nome || '',
    especie: pet.especie || 'Cachorro',
    raca: pet.raca || '',
    data_nascimento: formatarDataNascimentoParaInput(pet.data_nascimento),
    sexo: pet.sexo || 'Não informado',
    observacoes: pet.observacoes || '',
    foto_uri: pet.foto_uri || null,
  };
}

function obterPrimeiraMensagemErro(erros) {
  return Object.values(erros).find(Boolean) || 'Revise os dados do pet.';
}

function getProfilePhotoKey(userEmail) {
  return userEmail ? `userPhoto:${userEmail}` : 'userPhoto';
}

function criarDataUtc(ano, mes, dia) {
  return new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
}

function obterHojeUtcZerado() {
  const hoje = new Date();
  return criarDataUtc(
    hoje.getUTCFullYear(),
    hoje.getUTCMonth(),
    hoje.getUTCDate()
  );
}

function obterDataFormulario(valor) {
  if (!valor) {
    return null;
  }

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return criarDataUtc(
      valor.getUTCFullYear(),
      valor.getUTCMonth(),
      valor.getUTCDate()
    );
  }

  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor));

  if (!partes) {
    return null;
  }

  return criarDataUtc(
    Number(partes[1]),
    Number(partes[2]) - 1,
    Number(partes[3])
  );
}

function formatarDataParaUsuario(valor) {
  const data = obterDataFormulario(valor);

  if (!data) {
    return 'Selecionar data';
  }

  const dia = String(data.getUTCDate()).padStart(2, '0');
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
  const ano = data.getUTCFullYear();

  return `${dia}/${mes}/${ano}`;
}

function formatarDataParaFormulario(data) {
  return data.toISOString().slice(0, 10);
}

function criarMesCalendario(data = obterHojeUtcZerado()) {
  return criarDataUtc(data.getUTCFullYear(), data.getUTCMonth(), 1);
}

function obterDiasDoMesCalendario(mesVisivel) {
  const ano = mesVisivel.getUTCFullYear();
  const mes = mesVisivel.getUTCMonth();
  const primeiroDia = criarDataUtc(ano, mes, 1);
  const diasNoMes = criarDataUtc(ano, mes + 1, 0).getUTCDate();
  const dias = [];

  for (let index = 0; index < primeiroDia.getUTCDay(); index += 1) {
    dias.push(null);
  }

  for (let dia = 1; dia <= diasNoMes; dia += 1) {
    dias.push(criarDataUtc(ano, mes, dia));
  }

  while (dias.length % 7 !== 0) {
    dias.push(null);
  }

  return dias;
}

function datasSaoIguais(primeiraData, segundaData) {
  if (!primeiraData || !segundaData) {
    return false;
  }

  return primeiraData.getTime() === segundaData.getTime();
}

function obterAnosVisiveis(anoCentral) {
  const inicio = anoCentral - (anoCentral % QUANTIDADE_ANOS_VISIVEIS);

  return Array.from(
    { length: QUANTIDADE_ANOS_VISIVEIS },
    (_, index) => inicio + index
  );
}

export default function Profile({
  authMethod,
  onLogout,
  onCameraVisibilityChange,
  userEmail,
  idUsuario,
  userNome,
}) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [petCameraOpen, setPetCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('back');
  const [petCameraFacing, setPetCameraFacing] = useState('back');
  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsView, setPetsView] = useState('list');
  const [selectedPet, setSelectedPet] = useState(null);
  const [editingPet, setEditingPet] = useState(null);
  const [petForm, setPetForm] = useState(criarFormularioPetVazio);
  const [petFormErrors, setPetFormErrors] = useState({});
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('dias');
  const [visibleDateMonth, setVisibleDateMonth] = useState(criarMesCalendario);

  const cameraRef = useRef(null);
  const petCameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [petCameraPermission, requestPetCameraPermission] = useCameraPermissions();

  const loadPets = useCallback(() => {
    if (!idUsuario) {
      setPets([]);
      return;
    }

    setPetsLoading(true);

    try {
      petRepository.inicializarTabelaPets();
      setPets(petRepository.listarPetsPorUsuario(idUsuario));
    } catch (error) {
      console.log('Erro ao carregar pets:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus pets.');
    } finally {
      setPetsLoading(false);
    }
  }, [idUsuario]);

  useEffect(() => {
    async function loadPhoto() {
      try {
        const savedPhoto = await AsyncStorage.getItem(getProfilePhotoKey(userEmail));
        setPhotoUri(savedPhoto || null);
      } catch (error) {
        console.log('Erro ao carregar foto:', error);
      }
    }

    loadPhoto();
  }, [userEmail]);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  useEffect(() => {
    onCameraVisibilityChange?.(cameraOpen || petCameraOpen);

    return () => {
      onCameraVisibilityChange?.(false);
    };
  }, [cameraOpen, onCameraVisibilityChange, petCameraOpen]);

  if (!permission || !petCameraPermission) {
    return (
      <View style={profileStyles.center}>
        <Text>Carregando permissões...</Text>
      </View>
    );
  }

  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        setPhotoUri(photo.uri);

        await AsyncStorage.setItem(getProfilePhotoKey(userEmail), photo.uri);

        setCameraOpen(false);
      }
    } catch (error) {
      console.log('Erro ao tirar foto:', error);
    }
  };

  const takePetPicture = async () => {
    try {
      if (petCameraRef.current) {
        const photo = await petCameraRef.current.takePictureAsync({ quality: 0.8 });
        setPetForm((currentForm) => ({
          ...currentForm,
          foto_uri: photo.uri,
        }));
        setPetCameraOpen(false);
      }
    } catch (error) {
      console.log('Erro ao tirar foto do pet:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto do pet.');
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const togglePetCameraFacing = () => {
    setPetCameraFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const openCreatePetForm = () => {
    setEditingPet(null);
    setSelectedPet(null);
    setPetForm(criarFormularioPetVazio());
    setPetFormErrors({});
    setPetsView('form');
  };

  const openEditPetForm = (pet) => {
    setEditingPet(pet);
    setSelectedPet(null);
    setPetForm(obterFormularioAPartirDoPet(pet));
    setPetFormErrors({});
    setPetsView('form');
  };

  const openPetDetails = (pet) => {
    setSelectedPet(pet);
    setEditingPet(null);
    setPetFormErrors({});
    setPetsView('details');
  };

  const backToPetsList = () => {
    setPetsView('list');
    setSelectedPet(null);
    setEditingPet(null);
    setPetForm(criarFormularioPetVazio());
    setPetFormErrors({});
  };

  const updatePetFormField = (field, value) => {
    setPetForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    if (petFormErrors[field]) {
      setPetFormErrors((currentErrors) => ({
        ...currentErrors,
        [field]: null,
      }));
    }
  };

  const openDatePicker = () => {
    const dataSelecionada = obterDataFormulario(petForm.data_nascimento);
    setVisibleDateMonth(criarMesCalendario(dataSelecionada || obterHojeUtcZerado()));
    setDatePickerMode('dias');
    setDatePickerOpen(true);
  };

  const changeVisibleDateMonth = (offset) => {
    setVisibleDateMonth((currentMonth) => criarDataUtc(
      currentMonth.getUTCFullYear(),
      currentMonth.getUTCMonth() + offset,
      1
    ));
  };

  const changeVisibleYearRange = (offset) => {
    setVisibleDateMonth((currentMonth) => criarDataUtc(
      currentMonth.getUTCFullYear() + (offset * QUANTIDADE_ANOS_VISIVEIS),
      currentMonth.getUTCMonth(),
      1
    ));
  };

  const selectVisibleYear = (year) => {
    setVisibleDateMonth((currentMonth) => criarDataUtc(
      year,
      currentMonth.getUTCMonth(),
      1
    ));
    setDatePickerMode('dias');
  };

  const selectBirthDate = (date) => {
    if (!date || date.getTime() > obterHojeUtcZerado().getTime()) {
      return;
    }

    updatePetFormField('data_nascimento', formatarDataParaFormulario(date));
    setDatePickerOpen(false);
  };

  const clearBirthDate = () => {
    updatePetFormField('data_nascimento', '');
    setDatePickerOpen(false);
  };

  const handleSavePet = () => {
    const validacao = validarPet(petForm);
    setPetFormErrors(validacao.erros);

    if (!validacao.valido) {
      Alert.alert('Revise o cadastro', obterPrimeiraMensagemErro(validacao.erros));
      return;
    }

    try {
      if (editingPet) {
        petRepository.atualizarPet(editingPet.id, idUsuario, petForm);
        Alert.alert('Sucesso', 'Pet atualizado com sucesso.');
      } else {
        petRepository.criarPet(idUsuario, petForm);
        Alert.alert('Sucesso', 'Pet cadastrado com sucesso.');
      }

      loadPets();
      backToPetsList();
    } catch (error) {
      console.log('Erro ao salvar pet:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível salvar o pet.');
    }
  };

  const deleteSelectedPet = (pet) => {
    try {
      petRepository.excluirPet(pet.id, idUsuario);
      loadPets();
      backToPetsList();
      Alert.alert('Pet excluído', 'O pet foi removido definitivamente.');
    } catch (error) {
      console.log('Erro ao excluir pet:', error);
      Alert.alert('Erro', 'Não foi possível excluir o pet.');
    }
  };

  const confirmDeletePet = (pet) => {
    Alert.alert(
      'Excluir pet',
      `Deseja excluir ${pet.nome} definitivamente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteSelectedPet(pet),
        },
      ]
    );
  };

  const openPetCamera = async () => {
    if (!petCameraPermission.granted) {
      const result = await requestPetCameraPermission();
      if (!result.granted) return;
    }

    setPetCameraOpen(true);
  };

  const renderPetPhoto = (pet, size = 'small') => {
    const imageStyle = size === 'large' ? profileStyles.petPhotoLarge : profileStyles.petPhoto;
    const placeholderStyle = size === 'large'
      ? profileStyles.petPhotoPlaceholderLarge
      : profileStyles.petPhotoPlaceholder;
    const iconSize = size === 'large' ? 40 : 24;

    if (pet?.foto_uri) {
      return <Image source={{ uri: pet.foto_uri }} style={imageStyle} />;
    }

    return (
      <View style={placeholderStyle}>
        <Ionicons name="paw" size={iconSize} color="#0B3C78" />
      </View>
    );
  };

  const renderOptionButtons = (field, options) => (
    <View style={profileStyles.optionRow}>
      {options.map((option) => {
        const selected = petForm[field] === option;

        return (
          <TouchableOpacity
            key={option}
            style={[
              profileStyles.optionButton,
              selected && profileStyles.optionButtonSelected,
            ]}
            onPress={() => updatePetFormField(field, option)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                profileStyles.optionButtonText,
                selected && profileStyles.optionButtonTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderFieldError = (field) => (
    petFormErrors[field] ? (
      <Text style={profileStyles.errorText}>{petFormErrors[field]}</Text>
    ) : null
  );

  const renderPetsList = () => (
    <View style={profileStyles.petsContent}>
      <View style={profileStyles.sectionHeader}>
        <View>
          <Text style={profileStyles.sectionTitle}>Meus Pets</Text>
          <Text style={profileStyles.sectionSubtitle}>Pets cadastrados neste perfil</Text>
        </View>

        <TouchableOpacity
          style={profileStyles.addPetButton}
          onPress={openCreatePetForm}
          activeOpacity={0.85}
          disabled={!idUsuario}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {!idUsuario ? (
        <View style={profileStyles.emptyPetsBox}>
          <Ionicons name="alert-circle-outline" size={32} color="#0B3C78" />
          <Text style={profileStyles.emptyPetsTitle}>Usuário não identificado</Text>
          <Text style={profileStyles.emptyPetsText}>
            Entre novamente para vincular os pets ao seu perfil.
          </Text>
        </View>
      ) : petsLoading ? (
        <Text style={profileStyles.emptyPetsText}>Carregando pets...</Text>
      ) : pets.length === 0 ? (
        <View style={profileStyles.emptyPetsBox}>
          <Ionicons name="paw-outline" size={36} color="#0B3C78" />
          <Text style={profileStyles.emptyPetsTitle}>Nenhum pet cadastrado</Text>
          <Text style={profileStyles.emptyPetsText}>
            Cadastre seu primeiro pet para acompanhar os dados dele por aqui.
          </Text>
          <TouchableOpacity
            style={profileStyles.primaryInlineButton}
            onPress={openCreatePetForm}
            activeOpacity={0.85}
          >
            <Text style={profileStyles.primaryInlineButtonText}>Cadastrar pet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        pets.map((pet) => (
          <View key={pet.id} style={profileStyles.petCard}>
            {renderPetPhoto(pet)}

            <View style={profileStyles.petCardBody}>
              <Text style={profileStyles.petName}>{pet.nome}</Text>
              <Text style={profileStyles.petMeta}>
                {pet.especie}{pet.raca ? ` • ${pet.raca}` : ''}
              </Text>

              <View style={profileStyles.petActions}>
                <TouchableOpacity onPress={() => openPetDetails(pet)} style={profileStyles.petActionButton}>
                  <Ionicons name="eye-outline" size={16} color="#0B3C78" />
                  <Text style={profileStyles.petActionText}>Ver</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => openEditPetForm(pet)} style={profileStyles.petActionButton}>
                  <Ionicons name="create-outline" size={16} color="#0B3C78" />
                  <Text style={profileStyles.petActionText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => confirmDeletePet(pet)} style={profileStyles.petActionButtonDanger}>
                  <Ionicons name="trash-outline" size={16} color="#B42318" />
                  <Text style={profileStyles.petActionTextDanger}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderPetDetails = () => {
    if (!selectedPet) {
      return null;
    }

    return (
      <View style={profileStyles.petsContent}>
        <TouchableOpacity style={profileStyles.backButton} onPress={backToPetsList} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={18} color="#0B3C78" />
          <Text style={profileStyles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <View style={profileStyles.petDetailsCard}>
          <View style={profileStyles.petDetailsHeader}>
            {renderPetPhoto(selectedPet, 'large')}
            <Text style={profileStyles.petDetailsName}>{selectedPet.nome}</Text>
            <Text style={profileStyles.petDetailsMeta}>{selectedPet.especie}</Text>
          </View>

          <View style={profileStyles.detailRow}>
            <Text style={profileStyles.detailLabel}>Raça</Text>
            <Text style={profileStyles.detailValue}>{selectedPet.raca || 'Não informada'}</Text>
          </View>

          <View style={profileStyles.detailRow}>
            <Text style={profileStyles.detailLabel}>Data de nascimento</Text>
            <Text style={profileStyles.detailValue}>
              {selectedPet.data_nascimento
                ? formatarDataParaUsuario(selectedPet.data_nascimento)
                : 'Não informada'}
            </Text>
          </View>

          <View style={profileStyles.detailRow}>
            <Text style={profileStyles.detailLabel}>Sexo</Text>
            <Text style={profileStyles.detailValue}>{selectedPet.sexo}</Text>
          </View>

          <View style={profileStyles.detailRow}>
            <Text style={profileStyles.detailLabel}>Observações</Text>
            <Text style={profileStyles.detailValue}>{selectedPet.observacoes || 'Sem observações'}</Text>
          </View>

          <View style={profileStyles.formActions}>
            <TouchableOpacity
              style={profileStyles.secondaryActionButton}
              onPress={() => openEditPetForm(selectedPet)}
              activeOpacity={0.85}
            >
              <Text style={profileStyles.secondaryActionButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={profileStyles.dangerActionButton}
              onPress={() => confirmDeletePet(selectedPet)}
              activeOpacity={0.85}
            >
              <Text style={profileStyles.dangerActionButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderPetForm = () => (
    <View style={profileStyles.petsContent}>
      <TouchableOpacity style={profileStyles.backButton} onPress={backToPetsList} activeOpacity={0.85}>
        <Ionicons name="chevron-back" size={18} color="#0B3C78" />
        <Text style={profileStyles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={profileStyles.petFormCard}>
        <Text style={profileStyles.sectionTitle}>{editingPet ? 'Editar pet' : 'Novo pet'}</Text>

        <View style={profileStyles.photoFormRow}>
          {renderPetPhoto({ foto_uri: petForm.foto_uri }, 'large')}

          <View style={profileStyles.photoButtonsColumn}>
            <TouchableOpacity style={profileStyles.secondaryActionButton} onPress={openPetCamera} activeOpacity={0.85}>
              <Text style={profileStyles.secondaryActionButtonText}>Tirar foto</Text>
            </TouchableOpacity>

            {petForm.foto_uri ? (
              <TouchableOpacity
                style={profileStyles.lightActionButton}
                onPress={() => updatePetFormField('foto_uri', null)}
                activeOpacity={0.85}
              >
                <Text style={profileStyles.lightActionButtonText}>Remover foto</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <Text style={profileStyles.inputLabel}>Nome *</Text>
        <TextInput
          placeholder="Ex: Luna"
          placeholderTextColor="#7d8590"
          style={[profileStyles.input, petFormErrors.nome && profileStyles.inputError]}
          value={petForm.nome}
          onChangeText={(value) => updatePetFormField('nome', value)}
        />
        {renderFieldError('nome')}

        <Text style={profileStyles.inputLabel}>Espécie *</Text>
        {renderOptionButtons('especie', OPCOES_ESPECIE_PET)}
        {renderFieldError('especie')}

        <Text style={profileStyles.inputLabel}>Sexo *</Text>
        {renderOptionButtons('sexo', OPCOES_SEXO_PET)}
        {renderFieldError('sexo')}

        <Text style={profileStyles.inputLabel}>Raça</Text>
        <TextInput
          placeholder="Opcional"
          placeholderTextColor="#7d8590"
          style={profileStyles.input}
          value={petForm.raca}
          onChangeText={(value) => updatePetFormField('raca', value)}
        />

        <Text style={profileStyles.inputLabel}>Data de nascimento</Text>
        <TouchableOpacity
          style={[
            profileStyles.dateInputButton,
            petFormErrors.data_nascimento && profileStyles.inputError,
          ]}
          onPress={openDatePicker}
          activeOpacity={0.85}
        >
          <View style={profileStyles.dateInputContent}>
            <Ionicons name="calendar-outline" size={20} color="#0B3C78" />
            <Text
              style={[
                profileStyles.dateInputText,
                !petForm.data_nascimento && profileStyles.dateInputPlaceholder,
              ]}
            >
              {formatarDataParaUsuario(petForm.data_nascimento)}
            </Text>
          </View>
        </TouchableOpacity>
        {renderFieldError('data_nascimento')}

        <Text style={profileStyles.inputLabel}>Observações</Text>
        <TextInput
          placeholder="Peso, porte, cor, alergias ou outros detalhes"
          placeholderTextColor="#7d8590"
          multiline
          textAlignVertical="top"
          style={[profileStyles.input, profileStyles.observacoesInput]}
          value={petForm.observacoes}
          onChangeText={(value) => updatePetFormField('observacoes', value)}
        />

        <View style={profileStyles.formActions}>
          <TouchableOpacity style={profileStyles.secondaryActionButton} onPress={backToPetsList} activeOpacity={0.85}>
            <Text style={profileStyles.secondaryActionButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={profileStyles.saveActionButton} onPress={handleSavePet} activeOpacity={0.85}>
            <Text style={profileStyles.saveActionButtonText}>Salvar pet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (cameraOpen) {
    if (!permission.granted) {
      return (
        <View style={profileStyles.center}>
          <StatusBar style="dark" />
          <Text>O app precisa de acesso à câmera.</Text>

          <TouchableOpacity style={profileStyles.permissionButton} onPress={requestPermission}>
            <Text style={profileStyles.permissionButtonText}>Permitir acesso</Text>
          </TouchableOpacity>

          <Text style={profileStyles.smallText}>
            Se você já negou antes, talvez precise liberar manualmente nas
            configurações do celular.
          </Text>
        </View>
      );
    }

    return (
      <View style={profileStyles.cameraContainer}>
        <CameraView style={{ flex: 1 }} ref={cameraRef} facing={cameraFacing} />

        <View style={profileStyles.cameraButtons}>
          <TouchableOpacity style={profileStyles.iconButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={takePicture} style={profileStyles.captureButton}>
            <Text style={profileStyles.captureText}>Tirar Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={profileStyles.iconButton} onPress={() => setCameraOpen(false)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (petCameraOpen) {
    if (!petCameraPermission.granted) {
      return (
        <View style={profileStyles.center}>
          <StatusBar style="dark" />
          <Text>O app precisa de acesso à câmera para fotografar o pet.</Text>

          <TouchableOpacity style={profileStyles.permissionButton} onPress={requestPetCameraPermission}>
            <Text style={profileStyles.permissionButtonText}>Permitir acesso</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={profileStyles.cameraContainer}>
        <CameraView style={{ flex: 1 }} ref={petCameraRef} facing={petCameraFacing} />

        <View style={profileStyles.cameraButtons}>
          <TouchableOpacity style={profileStyles.iconButton} onPress={togglePetCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={takePetPicture} style={profileStyles.captureButton}>
            <Text style={profileStyles.captureText}>Foto do Pet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={profileStyles.iconButton} onPress={() => setPetCameraOpen(false)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const selectedBirthDate = obterDataFormulario(petForm.data_nascimento);
  const today = obterHojeUtcZerado();
  const calendarDays = obterDiasDoMesCalendario(visibleDateMonth);
  const visibleYears = obterAnosVisiveis(visibleDateMonth.getUTCFullYear());
  const selectedYear = selectedBirthDate?.getUTCFullYear();
  const currentYear = today.getUTCFullYear();

  return (
    <>
      <Modal
        animationType="fade"
        transparent
        visible={datePickerOpen}
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <View style={profileStyles.dateModalBackdrop}>
          <View style={profileStyles.dateModalCard}>
            <View style={profileStyles.dateModalHeader}>
              <TouchableOpacity
                style={profileStyles.dateMonthButton}
                onPress={() => (
                  datePickerMode === 'anos'
                    ? changeVisibleYearRange(-1)
                    : changeVisibleDateMonth(-1)
                )}
                activeOpacity={0.85}
              >
                <Ionicons name="chevron-back" size={20} color="#0B3C78" />
              </TouchableOpacity>

              {datePickerMode === 'anos' ? (
                <Text style={profileStyles.dateModalTitle}>
                  {visibleYears[0]} - {visibleYears[visibleYears.length - 1]}
                </Text>
              ) : (
                <View style={profileStyles.dateModalTitleRow}>
                  <Text style={profileStyles.dateModalMonthText}>
                    {NOMES_MESES[visibleDateMonth.getUTCMonth()]}
                  </Text>

                  <TouchableOpacity
                    style={profileStyles.dateYearButton}
                    onPress={() => setDatePickerMode('anos')}
                    activeOpacity={0.85}
                  >
                    <Text style={profileStyles.dateYearButtonText}>
                      {visibleDateMonth.getUTCFullYear()}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={profileStyles.dateMonthButton}
                onPress={() => (
                  datePickerMode === 'anos'
                    ? changeVisibleYearRange(1)
                    : changeVisibleDateMonth(1)
                )}
                activeOpacity={0.85}
              >
                <Ionicons name="chevron-forward" size={20} color="#0B3C78" />
              </TouchableOpacity>
            </View>

            {datePickerMode === 'anos' ? (
              <View style={profileStyles.yearGrid}>
                {visibleYears.map((year) => {
                  const selected = year === selectedYear;
                  const disabled = year > currentYear;

                  return (
                    <TouchableOpacity
                      key={year}
                      style={[
                        profileStyles.yearOption,
                        selected && profileStyles.yearOptionSelected,
                        disabled && profileStyles.yearOptionDisabled,
                      ]}
                      disabled={disabled}
                      onPress={() => selectVisibleYear(year)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          profileStyles.yearOptionText,
                          selected && profileStyles.yearOptionTextSelected,
                          disabled && profileStyles.yearOptionTextDisabled,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <>
                <View style={profileStyles.weekDaysRow}>
                  {DIAS_SEMANA.map((weekDay, index) => (
                    <Text key={`${weekDay}-${index}`} style={profileStyles.weekDayText}>
                      {weekDay}
                    </Text>
                  ))}
                </View>

                <View style={profileStyles.calendarGrid}>
                  {calendarDays.map((date, index) => {
                    const disabled = !date || date.getTime() > today.getTime();
                    const selected = datasSaoIguais(date, selectedBirthDate);

                    return (
                      <TouchableOpacity
                        key={date ? date.toISOString() : `empty-${index}`}
                        style={[
                          profileStyles.calendarDay,
                          selected && profileStyles.calendarDaySelected,
                          disabled && profileStyles.calendarDayDisabled,
                        ]}
                        disabled={disabled}
                        onPress={() => selectBirthDate(date)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            profileStyles.calendarDayText,
                            selected && profileStyles.calendarDayTextSelected,
                            disabled && profileStyles.calendarDayTextDisabled,
                          ]}
                        >
                          {date ? date.getUTCDate() : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <View style={profileStyles.dateModalActions}>
              <TouchableOpacity
                style={profileStyles.lightActionButton}
                onPress={clearBirthDate}
                activeOpacity={0.85}
              >
                <Text style={profileStyles.lightActionButtonText}>Limpar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={profileStyles.secondaryActionButton}
                onPress={() => setDatePickerOpen(false)}
                activeOpacity={0.85}
              >
                <Text style={profileStyles.secondaryActionButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={profileStyles.container}
        contentContainerStyle={profileStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={profileStyles.header}>
        <TouchableOpacity
          onPress={async () => {
            if (!permission.granted) {
              const result = await requestPermission();
              if (!result.granted) return;
            }

            setCameraOpen(true);
          }}
        >
          <Image
            source={{ uri: photoUri || 'https://i.pravatar.cc/150' }}
            style={profileStyles.avatar}
          />
          <View style={profileStyles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

        <View style={profileStyles.card}>
        <Text style={appStyles.helperText}>Nome</Text>
        <Text style={appStyles.bodyText}>{userNome}</Text>

        <View style={profileStyles.spacer} />

        <Text style={appStyles.helperText}>Email</Text>
        <Text style={appStyles.bodyText}>{userEmail}</Text>

        <View style={profileStyles.spacer} />

        <Text style={appStyles.helperText}>Método de acesso</Text>
        <Text style={appStyles.bodyText}>
          {authMethod === 'biometria' ? 'Biometria' : 'Email e senha'}
        </Text>
      </View>

        {petsView === 'details' ? renderPetDetails() : null}
        {petsView === 'form' ? renderPetForm() : null}
        {petsView === 'list' ? renderPetsList() : null}

        <View style={profileStyles.logoutContainer}>
        <TouchableOpacity
          style={appStyles.button}
          onPress={onLogout}
          activeOpacity={0.85}
        >
          <Text style={appStyles.buttonText}>Sair da conta</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}
