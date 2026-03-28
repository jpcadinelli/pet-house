import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { appStyles } from '../../../shared/styles/app.styles';
import { profileStyles } from '../../../shared/styles/profile.styles'

export default function Profile({ authMethod, onLogout, userEmail }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    async function loadPhoto() {
      try {
        const savedPhoto = await AsyncStorage.getItem('userPhoto');

        if (savedPhoto) {
          setPhotoUri(savedPhoto);
        }
      } catch (error) {
        console.log('Erro ao carregar foto:', error);
      }
    }

    loadPhoto();
  }, []);

  if (!permission) {
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

        await AsyncStorage.setItem('userPhoto', photo.uri);

        setCameraOpen(false);
      }
    } catch (error) {
      console.log('Erro ao tirar foto:', error);
    }
  };

  if (cameraOpen) {
    if (!permission.granted) {
      return (
        <View style={profileStyles.center}>
          <StatusBar style="dark" />
          <Text>O app precisa de acesso à câmera.</Text>
          

          <TouchableOpacity style={profileStyles.permissionButton} onPress={requestPermission}>
            <Text style={profileStyles.permissionButtonText}>
              Permitir acesso
            </Text>
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
        <CameraView style={{ flex: 1 }} ref={cameraRef} facing="back" />

        <View style={profileStyles.cameraButtons}>
          <TouchableOpacity
            onPress={takePicture}
            style={profileStyles.captureButton}
          >
            <Text>Tirar foto</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setCameraOpen(false)}>
            <Text style={profileStyles.cancelText}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={profileStyles.container}>
      
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
            source={{
              uri: photoUri || 'https://i.pravatar.cc/150',
            }}
            style={profileStyles.avatar}
          />
          <View style={profileStyles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={appStyles.title}>Meu Perfil</Text>
      </View>

      <View style={profileStyles.card}>
            <Text style={appStyles.helperText}>Email</Text>
            <Text style={appStyles.bodyText}>{userEmail}</Text>

            <View style={profileStyles.spacer} />

            <Text style={appStyles.helperText}>Método de acesso</Text>
            <Text style={appStyles.bodyText}>
              {authMethod === 'biometria' ? 'Biometria' : 'Email e senha'}
            </Text>

      </View>

      <View style={profileStyles.logoutContainer}>
        <TouchableOpacity
          style={appStyles.button}
          onPress={onLogout}
          activeOpacity={0.85}
        >
          <Text style={appStyles.buttonText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}