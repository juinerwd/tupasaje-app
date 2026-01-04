import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export interface AutoLogoutMessageProps {
    visible: boolean
    onClose: () => void
}

export const AutoLogoutMessage: React.FC<AutoLogoutMessageProps> = ({
    visible,
    onClose
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name="shield-checkmark"
                            size={50}
                            color="#FF6B35"
                        />
                    </View>

                    <Text style={styles.title}>
                        Sesión cerrada por seguridad
                    </Text>

                    <Text style={styles.message}>
                        Tu sesión se ha cerrado automáticamente debido a inactividad.
                        Esto protege tu información financiera.
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>Entendido</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 25,
        maxWidth: 350,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 20,
        backgroundColor: '#FFF0ED',
        padding: 15,
        borderRadius: 50,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        textAlign: 'center',
        marginBottom: 15,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    button: {
        backgroundColor: '#FF6B35',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
        minWidth: 120,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
})
