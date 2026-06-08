import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { vaccineStyles } from '../../../shared/styles/vaccine.styles';

const {
  VACCINE_STATUS,
  formatarDataVacinaParaUsuario,
  obterDetalhesStatus,
} = require('../services/vaccineStatus');

function renderInfo(label, value) {
  if (!value) {
    return null;
  }

  return (
    <View style={vaccineStyles.infoRow}>
      <Text style={vaccineStyles.infoLabel}>{label}</Text>
      <Text style={vaccineStyles.infoValue}>{value}</Text>
    </View>
  );
}

export default function VaccineCard({ vaccine, onEdit, onDelete }) {
  const status = obterDetalhesStatus(vaccine.status);
  const isLate = vaccine.status === VACCINE_STATUS.ATRASADA;

  return (
    <View style={[vaccineStyles.vaccineCard, isLate && vaccineStyles.vaccineCardLate]}>
      <View style={vaccineStyles.vaccineCardHeader}>
        <View style={vaccineStyles.vaccineIconTile}>
          <FontAwesome5 name="syringe" size={20} color="#0B3C78" />
        </View>

        <View style={vaccineStyles.vaccineCardBody}>
          <Text style={vaccineStyles.vaccineName}>{vaccine.nome}</Text>
          {vaccine.nome_pet ? (
            <Text style={vaccineStyles.vaccinePetName}>{vaccine.nome_pet}</Text>
          ) : null}
        </View>

        <View
          style={[
            vaccineStyles.statusBadge,
            { backgroundColor: status.backgroundColor },
          ]}
        >
          <Text style={[vaccineStyles.statusBadgeText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={vaccineStyles.infoGrid}>
        {renderInfo(
          'Aplicação',
          vaccine.data_aplicacao
            ? formatarDataVacinaParaUsuario(vaccine.data_aplicacao)
            : 'Não informada'
        )}
        {renderInfo('Próxima dose', formatarDataVacinaParaUsuario(vaccine.proxima_dose))}
        {renderInfo('Observações', vaccine.observacoes)}
      </View>

      <View style={vaccineStyles.actionRow}>
        <TouchableOpacity
          style={vaccineStyles.actionButton}
          onPress={() => onEdit(vaccine)}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={16} color="#0B3C78" />
          <Text style={vaccineStyles.actionButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={vaccineStyles.actionButtonDanger}
          onPress={() => onDelete(vaccine)}
          activeOpacity={0.85}
        >
          <Ionicons name="trash-outline" size={16} color="#B42318" />
          <Text style={vaccineStyles.actionButtonTextDanger}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
