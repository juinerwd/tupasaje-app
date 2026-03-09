import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LegalContentModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    content: string | React.ReactNode;
}

export function LegalContentModal({
    visible,
    onClose,
    title,
    content
}: LegalContentModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <SafeAreaView style={styles.safeArea}>
                    <Animated.View
                        entering={FadeInDown}
                        style={styles.container}
                    >
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={BrandColors.gray[600]} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={true}
                        >
                            {typeof content === 'string' ? (
                                <Text style={styles.text}>{content}</Text>
                            ) : (
                                content
                            )}
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={onClose}
                            >
                                <Text style={styles.acceptButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: BrandColors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[100],
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    closeButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    text: {
        fontSize: 14,
        color: BrandColors.gray[700],
        lineHeight: 22,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: BrandColors.gray[100],
    },
    acceptButton: {
        backgroundColor: BrandColors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: BrandColors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
