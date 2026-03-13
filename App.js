import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { SecureScreen } from './src/features/auth/screens/SecureScreen';
import { HomeScreen } from './src/features/home/screens/HomeScreen';

export default function App() {
  const [biometria, setBiometria] = useState(false);
  const [render, setRender] = useState(false);

  const changeRender = () => setRender(true)

  useEffect(() => {
    (async () => {
      const compativel = await LocalAuthentication.hasHardwareAsync();
      setBiometria(compativel);
    })();
  }, []);

  if (render) {
    return (
      <SecureScreen />
    )
  } else {
    return (
      <HomeScreen biometria={biometria} onLogin={changeRender} />
    );
  }
}
