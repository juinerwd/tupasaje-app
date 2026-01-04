import { BrandColors } from '@/constants/theme';
import { useQRScanner } from '@/hooks/useQRScanner';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React from 'react';
import {
    ActivityIndicator,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

interface QRScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onScan: (data: string) => void;
}

export function QRScannerModal({ visible, onClose, onScan }: QRScannerModalProps) {
    const {
        hasPermission,
        isScanning,
        scannedData,
        error,
        canAskAgain,
        startScanning,
        stopScanning,
        handleBarCodeScanned,
        reset,
        requestPermission,
    } = useQRScanner();

    React.useEffect(() => {
        if (visible && hasPermission) {
            startScanning();
        }
    }, [visible, hasPermission]);

    React.useEffect(() => {
        if (scannedData) {
            onScan(scannedData);
            handleClose();
        }
    }, [scannedData]);

    const handleClose = () => {
        stopScanning();
        reset();
        onClose();
    };

    const handleOpenSettings = () => {
        Linking.openSettings();
    };

    // Permission denied
    if (hasPermission === false) {
        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.overlay}>
                    <Animated.View
                        entering={FadeInDown.duration(300).springify()}
                        style={styles.permissionContainer}
                    >
                        <Ionicons name="videocam-off" size={64} color={BrandColors.error} />
                        <Text style={styles.permissionTitle}>Permisos de Cámara Requeridos</Text>
                        <Text style={styles.permissionText}>
                            Necesitamos acceso a tu cámara para escanear códigos QR
                        </Text>

                        {canAskAgain ? (
                            <TouchableOpacity
                                style={styles.permissionButton}
                                onPress={requestPermission}
                            >
                                <Text style={styles.permissionButtonText}>Permitir Acceso</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.permissionButton}
                                onPress={handleOpenSettings}
                            >
                                <Text style={styles.permissionButtonText}>Abrir Configuración</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        );
    }

    // Loading permission
    if (hasPermission === null) {
        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.overlay}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={BrandColors.white} />
                        <Text style={styles.loadingText}>Verificando permisos...</Text>
                    </View>
                </View>
            </Modal>
        );
    }

    // Camera view
    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Camera */}
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                />

                {/* Overlay - positioned absolutely on top of camera */}
                <View style={styles.cameraOverlay}>
                    {/* Header */}
                    <View style={styles.cameraHeader}>
                        <TouchableOpacity
                            style={styles.closeButtonCamera}
                            onPress={handleClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={28} color={BrandColors.white} />
                        </TouchableOpacity>
                    </View>

                    {/* Scanning Frame */}
                    <View style={styles.scanningArea}>
                        <Animated.View
                            entering={FadeIn.duration(500)}
                            style={styles.scanFrame}
                        >
                            {/* Corners */}
                            <View style={[styles.corner, styles.cornerTopLeft]} />
                            <View style={[styles.corner, styles.cornerTopRight]} />
                            <View style={[styles.corner, styles.cornerBottomLeft]} />
                            <View style={[styles.corner, styles.cornerBottomRight]} />
                        </Animated.View>
                    </View>

                    {/* Instructions */}
                    <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsText}>
                            Apunta la cámara al código QR
                        </Text>
                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    permissionContainer: {
        backgroundColor: BrandColors.white,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        gap: 16,
        maxWidth: 400,
        width: '100%',
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 16,
        color: BrandColors.gray[600],
        textAlign: 'center',
        lineHeight: 24,
    },
    permissionButton: {
        backgroundColor: BrandColors.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
        width: '100%',
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.white,
        textAlign: 'center',
    },
    cancelButton: {
        paddingVertical: 12,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[600],
    },
    loadingContainer: {
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: BrandColors.white,
    },
    container: {
        flex: 1,
        backgroundColor: BrandColors.black,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    cameraHeader: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    closeButtonCamera: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanningArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: BrandColors.white,
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 8,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 8,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 8,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 8,
    },
    instructionsContainer: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 60 : 40,
        alignItems: 'center',
        gap: 12,
    },
    instructionsText: {
        fontSize: 18,
        fontWeight: '600',
        color: BrandColors.white,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    errorText: {
        fontSize: 14,
        color: BrandColors.error,
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
});
