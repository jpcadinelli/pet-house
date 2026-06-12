import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
const PLACEHOLDER_PADRAO = 'Selecionar data';

function criarDataUtc(ano, mes, dia) {
  return new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
}

export function obterHojeUtcZerado() {
  const hoje = new Date();
  return criarDataUtc(
    hoje.getUTCFullYear(),
    hoje.getUTCMonth(),
    hoje.getUTCDate()
  );
}

function obterDataCalendario(valor) {
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

  const ano = Number(partes[1]);
  const mes = Number(partes[2]) - 1;
  const dia = Number(partes[3]);
  const data = criarDataUtc(ano, mes, dia);

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes ||
    data.getUTCDate() !== dia
  ) {
    return null;
  }

  return data;
}

export function formatarDataCalendarioParaUsuario(
  valor,
  placeholder = PLACEHOLDER_PADRAO
) {
  const data = obterDataCalendario(valor);

  if (!data) {
    return placeholder;
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

function estaAntesDoMinimo(data, dataMinima) {
  return Boolean(dataMinima && data.getTime() < dataMinima.getTime());
}

function estaDepoisDoMaximo(data, dataMaxima) {
  return Boolean(dataMaxima && data.getTime() > dataMaxima.getTime());
}

function anoEstaForaDosLimites(ano, dataMinima, dataMaxima) {
  const primeiroDiaDoAno = criarDataUtc(ano, 0, 1);
  const ultimoDiaDoAno = criarDataUtc(ano, 11, 31);

  return (
    estaDepoisDoMaximo(primeiroDiaDoAno, dataMaxima) ||
    estaAntesDoMinimo(ultimoDiaDoAno, dataMinima)
  );
}

function ajustarMesAosLimites(data, dataMinima, dataMaxima) {
  if (dataMinima && data.getTime() < criarMesCalendario(dataMinima).getTime()) {
    return criarMesCalendario(dataMinima);
  }

  if (dataMaxima && data.getTime() > criarMesCalendario(dataMaxima).getTime()) {
    return criarMesCalendario(dataMaxima);
  }

  return data;
}

export default function CalendarDateInput({
  allowClear = true,
  error = false,
  maxDate,
  minDate,
  onChange,
  placeholder = PLACEHOLDER_PADRAO,
  value,
}) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('dias');
  const [visibleDateMonth, setVisibleDateMonth] = useState(criarMesCalendario);

  const selectedDate = obterDataCalendario(value);
  const normalizedMinDate = obterDataCalendario(minDate);
  const normalizedMaxDate = obterDataCalendario(maxDate);
  const calendarDays = obterDiasDoMesCalendario(visibleDateMonth);
  const visibleYears = obterAnosVisiveis(visibleDateMonth.getUTCFullYear());
  const selectedYear = selectedDate?.getUTCFullYear();

  const openDatePicker = () => {
    const initialDate =
      selectedDate || normalizedMaxDate || normalizedMinDate || obterHojeUtcZerado();
    setVisibleDateMonth(criarMesCalendario(initialDate));
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
    const nextMonth = criarDataUtc(year, visibleDateMonth.getUTCMonth(), 1);
    setVisibleDateMonth(ajustarMesAosLimites(
      nextMonth,
      normalizedMinDate,
      normalizedMaxDate
    ));
    setDatePickerMode('dias');
  };

  const selectDate = (date) => {
    if (
      !date ||
      estaAntesDoMinimo(date, normalizedMinDate) ||
      estaDepoisDoMaximo(date, normalizedMaxDate)
    ) {
      return;
    }

    onChange?.(formatarDataParaFormulario(date));
    setDatePickerOpen(false);
  };

  const clearDate = () => {
    onChange?.('');
    setDatePickerOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.dateInputButton,
          error ? styles.inputError : null,
        ]}
        onPress={openDatePicker}
        activeOpacity={0.85}
      >
        <View style={styles.dateInputContent}>
          <Ionicons name="calendar-outline" size={20} color="#0B3C78" />
          <Text
            style={[
              styles.dateInputText,
              selectedDate ? null : styles.dateInputPlaceholder,
            ]}
          >
            {formatarDataCalendarioParaUsuario(value, placeholder)}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={datePickerOpen}
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <View style={styles.dateModalBackdrop}>
          <View style={styles.dateModalCard}>
            <View style={styles.dateModalHeader}>
              <TouchableOpacity
                style={styles.dateMonthButton}
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
                <Text style={styles.dateModalTitle}>
                  {visibleYears[0]} - {visibleYears[visibleYears.length - 1]}
                </Text>
              ) : (
                <View style={styles.dateModalTitleRow}>
                  <Text style={styles.dateModalMonthText}>
                    {NOMES_MESES[visibleDateMonth.getUTCMonth()]}
                  </Text>

                  <TouchableOpacity
                    style={styles.dateYearButton}
                    onPress={() => setDatePickerMode('anos')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.dateYearButtonText}>
                      {visibleDateMonth.getUTCFullYear()}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.dateMonthButton}
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
              <View style={styles.yearGrid}>
                {visibleYears.map((year) => {
                  const selected = year === selectedYear;
                  const disabled = anoEstaForaDosLimites(
                    year,
                    normalizedMinDate,
                    normalizedMaxDate
                  );

                  return (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearOption,
                        selected ? styles.yearOptionSelected : null,
                        disabled ? styles.yearOptionDisabled : null,
                      ]}
                      disabled={disabled}
                      onPress={() => selectVisibleYear(year)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.yearOptionText,
                          selected ? styles.yearOptionTextSelected : null,
                          disabled ? styles.yearOptionTextDisabled : null,
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
                <View style={styles.weekDaysRow}>
                  {DIAS_SEMANA.map((weekDay, index) => (
                    <Text key={`${weekDay}-${index}`} style={styles.weekDayText}>
                      {weekDay}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarDays.map((date, index) => {
                    const disabled =
                      !date ||
                      estaAntesDoMinimo(date, normalizedMinDate) ||
                      estaDepoisDoMaximo(date, normalizedMaxDate);
                    const selected = datasSaoIguais(date, selectedDate);

                    return (
                      <TouchableOpacity
                        key={date ? date.toISOString() : `empty-${index}`}
                        style={[
                          styles.calendarDay,
                          selected ? styles.calendarDaySelected : null,
                          disabled ? styles.calendarDayDisabled : null,
                        ]}
                        disabled={disabled}
                        onPress={() => selectDate(date)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            selected ? styles.calendarDayTextSelected : null,
                            disabled ? styles.calendarDayTextDisabled : null,
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

            <View style={styles.dateModalActions}>
              {allowClear ? (
                <TouchableOpacity
                  style={styles.lightActionButton}
                  onPress={clearDate}
                  activeOpacity={0.85}
                >
                  <Text style={styles.lightActionButtonText}>Limpar</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => setDatePickerOpen(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryActionButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dateInputButton: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  inputError: {
    borderColor: '#B42318',
    backgroundColor: '#fff7f7',
  },
  dateInputContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateInputText: {
    flex: 1,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  dateInputPlaceholder: {
    color: '#7d8590',
    fontWeight: '500',
  },
  dateModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  dateModalCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dateMonthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF5FF',
  },
  dateModalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  dateModalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dateModalMonthText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  dateYearButton: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#EEF5FF',
    borderWidth: 1,
    borderColor: '#CBE3FF',
  },
  dateYearButtonText: {
    color: '#0B3C78',
    fontSize: 16,
    fontWeight: '800',
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    width: '14.2857%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  calendarDaySelected: {
    backgroundColor: '#0B3C78',
  },
  calendarDayDisabled: {
    opacity: 0.34,
  },
  calendarDayText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
  },
  calendarDayTextDisabled: {
    color: '#94a3b8',
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearOption: {
    width: '31.7%',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  yearOptionSelected: {
    backgroundColor: '#0B3C78',
    borderColor: '#0B3C78',
  },
  yearOptionDisabled: {
    opacity: 0.34,
  },
  yearOptionText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  yearOptionTextSelected: {
    color: '#FFFFFF',
  },
  yearOptionTextDisabled: {
    color: '#94a3b8',
  },
  dateModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  lightActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  lightActionButtonText: {
    color: '#334155',
    textAlign: 'center',
    fontWeight: '800',
  },
  secondaryActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f6feb',
    backgroundColor: '#eef5ff',
  },
  secondaryActionButtonText: {
    color: '#1f6feb',
    textAlign: 'center',
    fontWeight: '800',
  },
});
