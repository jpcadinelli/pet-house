import { StyleSheet } from 'react-native';

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: 50,
  },
  searchInput: {
    backgroundColor: '#FFF',
    margin: 12,
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    elevation: 2,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    padding: 12,
    elevation: 3,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitleRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  distance: {
    fontSize: 13,
    color: '#666',
  },
  status: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  open: {
    color: '#2ECC71',
  },
  closed: {
    color: '#E74C3C',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
});