import { Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConductorDashboard() {
    const { user } = useAuthStore();

    // Mock data
    const todayEarnings = 125000;
    const totalTransactions = 45;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>¡Hola!</Text>
                        <Text style={styles.userName}>{user?.firstName || 'Conductor'}</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Ionicons name="notifications-outline" size={24} color={BrandColors.gray[900]} />
                    </TouchableOpacity>
                </View>

                {/* Earnings Card */}
                <Card variant="elevated" style={styles.earningsCard}>
                    <Text style={styles.earningsLabel}>Ganancias de hoy</Text>
                    <Text style={styles.earningsAmount}>{formatCurrency(todayEarnings)}</Text>
                    <Text style={styles.transactionsCount}>{totalTransactions} transacciones</Text>
                </Card>

                {/* Receive Payment Button */}
                <TouchableOpacity style={styles.receiveButton}>
                    <View style={styles.receiveButtonContent}>
                        <Ionicons name="qr-code" size={32} color={BrandColors.white} />
                        <Text style={styles.receiveButtonText}>Recibir Pago</Text>
                    </View>
                </TouchableOpacity>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <Card variant="outlined" style={styles.statCard}>
                        <Ionicons name="trending-up-outline" size={24} color={BrandColors.primary} />
                        <Text style={styles.statValue}>{formatCurrency(todayEarnings)}</Text>
                        <Text style={styles.statLabel}>Hoy</Text>
                    </Card>

                    <Card variant="outlined" style={styles.statCard}>
                        <Ionicons name="calendar-outline" size={24} color={BrandColors.primary} />
                        <Text style={styles.statValue}>{formatCurrency(todayEarnings * 7)}</Text>
                        <Text style={styles.statLabel}>Esta semana</Text>
                    </Card>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.gray[50],
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: BrandColors.gray[600],
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    notificationButton: {
        padding: 8,
    },
    earningsCard: {
        padding: 24,
        marginBottom: 24,
        backgroundColor: BrandColors.primary,
        alignItems: 'center',
    },
    earningsLabel: {
        fontSize: 14,
        color: BrandColors.white,
        opacity: 0.9,
        marginBottom: 8,
    },
    earningsAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: BrandColors.white,
        marginBottom: 8,
    },
    transactionsCount: {
        fontSize: 14,
        color: BrandColors.white,
        opacity: 0.9,
    },
    receiveButton: {
        backgroundColor: BrandColors.secondary,
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    receiveButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    receiveButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: BrandColors.black,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginTop: 12,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: BrandColors.gray[600],
    },
});
