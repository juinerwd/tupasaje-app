import { Card } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import * as passengerService from '@/services/passengerService';
import { FavoriteLocation } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoriteLocationsScreen() {
    const router = useRouter();
    const [locations, setLocations] = useState<FavoriteLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLocations = useCallback(async () => {
        try {
            setLoading(true);
            const profile = await passengerService.getProfile();
            setLocations(profile.favoriteLocations || []);
        } catch (error) {
            console.error('Error fetching favorite locations:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchLocations();
        setRefreshing(false);
    }, [fetchLocations]);

    const handleDeleteLocation = (id: string) => {
        Alert.alert(
            'Eliminar ubicación',
            '¿Estás seguro que deseas eliminar esta ubicación de tus favoritos?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await passengerService.deleteFavoriteLocation(id);
                            setLocations(prev => prev.filter(loc => loc.id !== id));
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar la ubicación.');
                        }
                    },
                },
            ]
        );
    };

    const renderLocation = ({ item, index }: { item: FavoriteLocation; index: number }) => (
        <Animated.View
            entering={FadeInRight.delay(index * 100).duration(400)}
            exiting={FadeOutLeft}
        >
            <Card variant="outlined" style={styles.locationCard}>
                <View style={styles.locationContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="location" size={24} color={BrandColors.primary} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.locationName}>{item.name}</Text>
                        <Text style={styles.locationAddress} numberOfLines={1}>
                            {item.address}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDeleteLocation(item.id)}
                        style={styles.deleteButton}
                    >
                        <Ionicons name="trash-outline" size={20} color={BrandColors.error} />
                    </TouchableOpacity>
                </View>
            </Card>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ubicaciones Favoritas</Text>
                <View style={{ width: 32 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={BrandColors.primary} />
                </View>
            ) : locations.length === 0 ? (
                <View style={styles.centerContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="map-outline" size={64} color={BrandColors.gray[300]} />
                    </View>
                    <Text style={styles.emptyTitle}>No tienes ubicaciones guardadas</Text>
                    <Text style={styles.emptySubtitle}>
                        Guarda tus lugares frecuentes para acceder a ellos más rápido.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={locations}
                    renderItem={renderLocation}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={BrandColors.primary}
                        />
                    }
                />
            )}
        </SafeAreaView>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: BrandColors.white,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[200],
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    locationCard: {
        padding: 16,
        marginBottom: 12,
        backgroundColor: BrandColors.white,
    },
    locationContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: BrandColors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textContainer: {
        flex: 1,
    },
    locationName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 2,
    },
    locationAddress: {
        fontSize: 14,
        color: BrandColors.gray[500],
    },
    deleteButton: {
        padding: 8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[800],
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: BrandColors.gray[500],
        textAlign: 'center',
        lineHeight: 20,
    },
});
