import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';

const ACTION_WIDTH = 96;

function SwipeAction({ iconName, label, onPress, swipeableMethods, variant }) {
  const isDanger = variant === 'danger';

  const handlePress = () => {
    swipeableMethods.close();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.actionButton,
        isDanger ? styles.deleteAction : styles.editAction,
        pressed && styles.actionPressed,
      ]}
    >
      <Ionicons
        name={iconName}
        size={18}
        color={isDanger ? '#B42318' : '#0B3C78'}
      />
      <Text style={[styles.actionText, isDanger && styles.deleteActionText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SwipeableListItem({ children, onEdit, onDelete }) {
  const renderLeftActions = (_progress, _translation, swipeableMethods) => (
    <View style={[styles.actionContainer, styles.leftActionContainer]}>
      <SwipeAction
        iconName="create-outline"
        label="Editar"
        onPress={onEdit}
        swipeableMethods={swipeableMethods}
        variant="edit"
      />
    </View>
  );

  const renderRightActions = (_progress, _translation, swipeableMethods) => (
    <View style={[styles.actionContainer, styles.rightActionContainer]}>
      <SwipeAction
        iconName="trash-outline"
        label="Excluir"
        onPress={onDelete}
        swipeableMethods={swipeableMethods}
        variant="danger"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ReanimatedSwipeable
        friction={2}
        overshootLeft={false}
        overshootRight={false}
        leftThreshold={ACTION_WIDTH / 2}
        rightThreshold={ACTION_WIDTH / 2}
        dragOffsetFromLeftEdge={16}
        dragOffsetFromRightEdge={16}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
      >
        {children}
      </ReanimatedSwipeable>
    </View>
  );
}

export default memo(SwipeableListItem);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  actionContainer: {
    width: ACTION_WIDTH,
  },
  leftActionContainer: {
    alignItems: 'flex-start',
  },
  rightActionContainer: {
    alignItems: 'flex-end',
  },
  actionButton: {
    width: ACTION_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
  },
  editAction: {
    backgroundColor: '#EEF5FF',
  },
  deleteAction: {
    backgroundColor: '#FEF3F2',
  },
  actionPressed: {
    opacity: 0.78,
  },
  actionText: {
    color: '#0B3C78',
    fontSize: 13,
    fontWeight: '800',
  },
  deleteActionText: {
    color: '#B42318',
  },
});
