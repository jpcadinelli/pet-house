import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { appStyles } from '../../../shared/styles/app.styles';

export function SecureScreen({ onLogout }) {
  return (
    <View style={appStyles.container}>
      <Text>Usuário logado com sucesso!</Text>
      <TouchableOpacity style={appStyles.button} onPress={onLogout} activeOpacity={0.85}>
        <Text style={appStyles.buttonText}>Logout</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}
