import { BrandColors } from '@/constants/theme';
import { generateQRCode, GenerateQRResponse } from '@/services/usernameService';
import { Ionicons } from '@expo/vector-icons';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
} from 'react-native-reanimated';

interface QRCodeModalProps {
    visible: boolean;
    onClose: () => void;
    username: string;
    userName?: string;
}

export function QRCodeModal({ visible, onClose, username, userName }: QRCodeModalProps) {
    const [qrData, setQrData] = useState<GenerateQRResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (visible && !qrData) {
            loadQRCode();
        }
    }, [visible]);

    const loadQRCode = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await generateQRCode('300', 'base64');
            setQrData(response);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al generar el código QR');
            console.error('Error generating QR:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        if (!qrData?.qrCode) return;

        setIsSharing(true);
        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
                return;
            }

            // Extract base64 from data URL if needed
            const base64Data = qrData.qrCode.startsWith('data:')
                ? qrData.qrCode.split(',')[1]
                : qrData.qrCode;

            // Save to temporary file using new API
            const cacheDir = new Directory(Paths.cache);
            const file = new File(cacheDir, `qr_${username}.png`);
            await file.write(base64Data, { encoding: 'base64' });

            await Sharing.shareAsync(file.uri, {
                mimeType: 'image/png',
                dialogTitle: `Compartir código QR de @${username}`,
            });
        } catch (err) {
            console.error('Error sharing QR:', err);
            Alert.alert('Error', 'No se pudo compartir el código QR');
        } finally {
            setIsSharing(false);
        }
    };

    const handleDownload = async () => {
        if (!qrData?.qrCode) return;

        setIsSaving(true);
        try {
            // Request permissions
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permiso Requerido',
                    'Necesitamos permiso para guardar imágenes en tu galería'
                );
                setIsSaving(false);
                return;
            }

            // Extract base64 from data URL if needed
            const base64Data = qrData.qrCode.startsWith('data:')
                ? qrData.qrCode.split(',')[1]
                : qrData.qrCode;

            // Save to file system using new API
            const docDir = new Directory(Paths.document);
            const file = new File(docDir, `qr_${username}_${Date.now()}.png`);
            await file.write(base64Data, { encoding: 'base64' });

            // Save to media library
            const asset = await MediaLibrary.createAssetAsync(file.uri);
            await MediaLibrary.createAlbumAsync('TuPasaje', asset, false);

            Alert.alert('¡Éxito!', 'Código QR guardado en tu galería');
        } catch (err) {
            console.error('Error saving QR:', err);
            Alert.alert('Error', 'No se pudo guardar el código QR');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setQrData(null);
        setError(null);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={styles.overlay}
            >
                <TouchableOpacity
                    style={styles.overlayTouchable}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <Animated.View
                    entering={SlideInDown.duration(300).springify()}
                    exiting={SlideOutDown.duration(200)}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <Ionicons name="qr-code" size={24} color={BrandColors.primary} />
                                <Text style={styles.headerTitle}>Mi Código QR</Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.closeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                activeOpacity={0.6}
                            >
                                <Ionicons name="close" size={24} color={BrandColors.gray[600]} />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {isLoading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={BrandColors.primary} />
                                    <Text style={styles.loadingText}>Generando código QR...</Text>
                                </View>
                            )}

                            {error && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={48} color={BrandColors.error} />
                                    <Text style={styles.errorText}>{error}</Text>
                                    <TouchableOpacity
                                        style={styles.retryButton}
                                        onPress={loadQRCode}
                                    >
                                        <Text style={styles.retryButtonText}>Reintentar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {!isLoading && !error && qrData && (
                                <>
                                    {/* QR Code */}
                                    <View style={styles.qrContainer}>
                                        <View style={styles.qrWrapper}>
                                            <Image
                                                source={{
                                                    uri: qrData.qrCode.startsWith('data:')
                                                        ? qrData.qrCode
                                                        : `data:image/png;base64,${qrData.qrCode}`
                                                }}
                                                style={styles.qrImage}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    </View>

                                    {/* User Info */}
                                    <View style={styles.userInfo}>
                                        <Text style={styles.username}>@{username}</Text>
                                        {userName && (
                                            <Text style={styles.userFullName}>{userName}</Text>
                                        )}
                                        <Text style={styles.instruction}>
                                            Comparte este código para que otros usuarios puedan encontrarte
                                        </Text>
                                    </View>

                                    {/* Actions */}
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.shareButton]}
                                            onPress={handleShare}
                                            disabled={isSharing}
                                        >
                                            {isSharing ? (
                                                <ActivityIndicator size="small" color={BrandColors.white} />
                                            ) : (
                                                <>
                                                    <Ionicons name="share-social" size={20} color={BrandColors.white} />
                                                    <Text style={styles.actionButtonText}>Compartir</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.downloadButton]}
                                            onPress={handleDownload}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <ActivityIndicator size="small" color={BrandColors.primary} />
                                            ) : (
                                                <>
                                                    <Ionicons name="download" size={20} color={BrandColors.primary} />
                                                    <Text style={[styles.actionButtonText, styles.downloadButtonText]}>
                                                        Guardar
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    overlayTouchable: {
        flex: 1,
    },
    modalContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        maxHeight: '90%',
        minHeight: 700, // Ensure content is visible on initial render
        backgroundColor: BrandColors.white,
    },
    modalContent: {
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        backgroundColor: BrandColors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: BrandColors.gray[100],
    },
    content: {
        padding: 20,
    },
    scrollView: {
        // Remove maxHeight to allow content to show
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 20,
        flexGrow: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: BrandColors.gray[600],
    },
    errorContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: BrandColors.error,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: BrandColors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.white,
    },
    qrContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    qrWrapper: {
        backgroundColor: BrandColors.white,
        padding: 20,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: BrandColors.gray[200],
    },
    qrImage: {
        width: 250,
        height: 250,
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.primary,
        marginBottom: 4,
    },
    userFullName: {
        fontSize: 16,
        color: BrandColors.gray[700],
        marginBottom: 12,
    },
    instruction: {
        fontSize: 14,
        color: BrandColors.gray[600],
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    shareButton: {
        backgroundColor: BrandColors.primary,
    },
    downloadButton: {
        backgroundColor: BrandColors.white,
        borderWidth: 2,
        borderColor: BrandColors.primary,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.white,
    },
    downloadButtonText: {
        color: BrandColors.primary,
    },
});
