import { StyleSheet } from 'react-native';

export const mapStyles = StyleSheet.create({
    mapContainer: {
        flex: 1,
        backgroundColor: '#F4F8FC',
    },
    map: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 18,
        left: 18,
        right: 18,
        padding: 24,
    },
    statusCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 18,
        padding: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
        elevation: 6,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 10,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        marginBottom: 10,
    },
    statusText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
        marginTop: 8,
        
    },
    errorText: {
        fontSize: 14,
        color: '#B42318',
        lineHeight: 20,
        marginTop: 8,
    },
    button: { 
        backgroundColor: '#84BE12',
        paddingVertical: 10,
        borderRadius: 15,
    }, 
    buttonText: {
        fontSize: 14,
        color: '#ffffff',
        textAlign: 'center',
        alignContent: 'center',
    },
});