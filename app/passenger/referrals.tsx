import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors } from '@/constants/theme';
import { useReferralCode, useMyReferrals } from '@/hooks/useReferrals';
import { ReferralStatus } from '@/types';
import { Alert } from 'react-native';

export default function ReferralsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { data: code, isLoading: loadingCode } = useReferralCode();
    const { data: referralsData, isLoading: loadingReferrals } = useMyReferrals();

    const handleShare = async () => {
        if (!code) return;
        try {
            await Share.share({
                message: `¡Únete a Tu Pasaje y viaja más fácil! 🚕\n\nUsa mi código de invitación al registrarte: ${code.toUpperCase()} para recibir un bono de bienvenida.\n\n📲 ¡Pídemela por aquí!`,
            });
        } catch (error) {
            // User cancelled
        }
    };

    const handleCopyCode = async () => {
        if (!code) return;
        Alert.alert('¡Código copiado!', code);
    };

    const getStatusLabel = (status: ReferralStatus) => {
        switch (status) {
            case ReferralStatus.PENDING:
                return { text: 'Pendiente', color: '#FF9800' };
            case ReferralStatus.COMPLETED:
                return { text: 'Completado', color: '#4CAF50' };
            case ReferralStatus.EXPIRED:
                return { text: 'Expirado', color: '#9E9E9E' };
            default:
                return { text: status, color: '#9E9E9E' };
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const isLoading = loadingCode || loadingReferrals;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Referidos</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Referral Code Card */}
                    <View style={styles.codeCard}>
                        <View style={styles.codeCardIcon}>
                            <Ionicons name="gift" size={32} color={BrandColors.primary} />
                        </View>
                        <Text style={styles.codeCardTitle}>Tu código de referido</Text>
                        <Text style={styles.codeCardDescription}>
                            Comparte tu código y ambos reciben saldo promocional cuando tu amigo haga su primer pago.
                        </Text>

                        {code ? (
                            <>
                                <TouchableOpacity style={styles.codeContainer} onPress={handleCopyCode}>
                                    <Text style={styles.codeText}>{code}</Text>
                                    <Ionicons name="copy-outline" size={20} color={BrandColors.primary} />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                                    <Ionicons name="share-social" size={20} color="white" />
                                    <Text style={styles.shareButtonText}>Compartir código</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.noCodeContainer}>
                                <Ionicons name="information-circle-outline" size={24} color={BrandColors.gray[500]} />
                                <Text style={styles.noCodeText}>
                                    Completa tu perfil y establece tu username para obtener tu código de referido.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Monthly Stats */}
                    {referralsData && (
                        <View style={styles.statsCard}>
                            <Text style={styles.statsTitle}>Este mes</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>
                                        {referralsData.completedThisMonth}/{referralsData.maxMonthly}
                                    </Text>
                                    <Text style={styles.statLabel}>Referidos premiados</Text>
                                </View>
                                <View style={[styles.statItem, styles.statItemBorder]}>
                                    <Text style={styles.statValue}>
                                        ${Number(referralsData.rewardAmount).toLocaleString('es-CO')}
                                    </Text>
                                    <Text style={styles.statLabel}>Bono por referido</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* How it works */}
                    <View style={styles.howItWorksCard}>
                        <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.stepText}>Comparte tu código con tus amigos</Text>
                        </View>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepText}>Tu amigo se registra con tu código</Text>
                        </View>
                        <View style={styles.step}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.stepText}>Cuando haga su primer pago, ¡ambos reciben saldo promocional!</Text>
                        </View>
                    </View>

                    {/* Referrals List */}
                    {referralsData && referralsData.referrals.length > 0 && (
                        <View style={styles.listCard}>
                            <Text style={styles.sectionTitle}>Tus referidos</Text>
                            {referralsData.referrals.map((referral) => {
                                const status = getStatusLabel(referral.status);
                                return (
                                    <View key={referral.id} style={styles.referralItem}>
                                        <View style={styles.referralItemLeft}>
                                            <View style={styles.referralAvatar}>
                                                <Ionicons name="person" size={20} color={BrandColors.gray[400]} />
                                            </View>
                                            <View>
                                                <Text style={styles.referralName}>{referral.referredName}</Text>
                                                <Text style={styles.referralDate}>{formatDate(referral.createdAt)}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
                                            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: BrandColors.gray[900],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
        paddingBottom: 32,
    },
    codeCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    codeCardIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${BrandColors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    codeCardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: BrandColors.gray[900],
        marginBottom: 8,
    },
    codeCardDescription: {
        fontSize: 14,
        color: BrandColors.gray[500],
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.gray[50],
        borderWidth: 2,
        borderColor: BrandColors.primary,
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 12,
        marginBottom: 16,
    },
    codeText: {
        fontSize: 18,
        fontWeight: '800',
        color: BrandColors.primary,
        letterSpacing: 1,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BrandColors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        gap: 8,
        width: '100%',
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    noCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BrandColors.gray[50],
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    noCodeText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.gray[500],
        lineHeight: 20,
    },
    statsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statItemBorder: {
        borderLeftWidth: 1,
        borderLeftColor: BrandColors.gray[200],
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
        color: BrandColors.primary,
    },
    statLabel: {
        fontSize: 12,
        color: BrandColors.gray[500],
        marginTop: 4,
    },
    howItWorksCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: BrandColors.gray[900],
        marginBottom: 16,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: BrandColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: BrandColors.gray[700],
        lineHeight: 20,
    },
    listCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    referralItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[100],
    },
    referralItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    referralAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: BrandColors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    referralName: {
        fontSize: 14,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    referralDate: {
        fontSize: 12,
        color: BrandColors.gray[500],
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
