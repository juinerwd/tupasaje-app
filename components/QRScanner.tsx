import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface QRScannerProps {
    onScan: (data: string) => void;
    onError?: (error: Error) => void;
    validationPattern?: RegExp;
    active?: boolean;
}

export function QRScanner({
    onScan,
    onError,
    validationPattern,
    active = true,
}: QRScannerProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [torch, setTorch] = useState(false);

    const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
        if (scanned || !active) return;

        // Validate QR code format if pattern provided
        if (validationPattern && !validationPattern.test(data)) {
            onError?.(new Error('Código QR inválido'));
            return;
        }

        setScanned(true);
        onScan(data);

        // Reset after 2 seconds to allow re-scanning
        setTimeout(() => setScanned(false), 2000);
    };

    const handleOpenSettings = () => {
        Linking.openSettings();
    };

    // Loading state
    if (!permission) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={BrandColors.primary} />
                <Text style={styles.loadingText}>Cargando cámara...</Text>
            </View>
        );
    }

    // Permission denied
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color={BrandColors.gray[400]} />
                    <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
                    <Text style={styles.permissionText}>
                        Necesitamos acceso a tu cámara para escanear códigos QR y procesar pagos.
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permissionButtonText}>Permitir Acceso</Text>
                    </TouchableOpacity>
                    {permission.canAskAgain === false && (
                        <TouchableOpacity
                            style={[styles.permissionButton, styles.settingsButton]}
                            onPress={handleOpenSettings}
                        >
                            <Text style={styles.permissionButtonText}>Ir a Configuración</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    // Camera view
    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={active ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                enableTorch={torch}
            >
                {/* Overlay with scanning frame */}
                <View style={styles.overlay}>
                    <View style={styles.overlayTop} />
                    <View style={styles.overlayMiddle}>
                        <View style={styles.overlaySide} />
                        <View style={styles.scanFrame}>
                            {/* Corner decorations */}
                            <View style={[styles.corner, styles.cornerTopLeft]} />
                            <View style={[styles.corner, styles.cornerTopRight]} />
                            <View style={[styles.corner, styles.cornerBottomLeft]} />
                            <View style={[styles.corner, styles.cornerBottomRight]} />

                            {scanned && (
                                <View style={styles.scannedIndicator}>
                                    <Ionicons name="checkmark-circle" size={48} color={BrandColors.success} />
                                </View>
                            )}
                        </View>
                        <View style={styles.overlaySide} />
                    </View>
                    <View style={styles.overlayBottom}>
                        <Text style={styles.instructionText}>
                            Apunta al código QR del conductor
                        </Text>

                        {/* Torch toggle */}
                        <TouchableOpacity
                            style={styles.torchButton}
                            onPress={() => setTorch(!torch)}
                        >
                            <Ionicons
                                name={torch ? 'flash' : 'flash-off'}
                                size={32}
                                color={BrandColors.white}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.black,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: BrandColors.gray[600],
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
    },
    overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    overlayMiddle: {
        flexDirection: 'row',
    },
    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: BrandColors.primary,
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    scannedIndicator: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    instructionText: {
        fontSize: 16,
        color: BrandColors.white,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    torchButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: BrandColors.gray[100],
        marginTop: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 16,
        color: BrandColors.gray[600],
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    permissionButton: {
        backgroundColor: BrandColors.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    settingsButton: {
        backgroundColor: BrandColors.gray[600],
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.white,
    },
});
