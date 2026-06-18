import { FontAwesome5 } from '@expo/vector-icons';
import { Text, View } from 'react-native';

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

export default function VaccineCard({ vaccine }) {
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

    </View>
  );
}
