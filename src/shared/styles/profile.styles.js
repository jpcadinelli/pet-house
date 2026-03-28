import { StyleSheet } from 'react-native';

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0B3C78',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },  
  smallText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    color: '#666',
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  card: {
    marginTop: 30,
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  spacer: {
    height: 16,
  },
  logoutContainer: {
    marginTop: 30,
    marginHorizontal: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  cameraButtons: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(116, 116, 116, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 50,
  },
  captureText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  permissionButton: {
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});