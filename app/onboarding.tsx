import { Button } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { setFirstTimeLaunch } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        title: 'Recarga tu saldo',
        description: 'Recarga saldo de forma rápida y segura desde tu dispositivo móvil',
        icon: 'wallet-outline',
    },
    {
        id: '2',
        title: 'Paga tu transporte',
        description: 'Paga tu pasaje de transporte público o privado sin efectivo',
        icon: 'bus-outline',
    },
    {
        id: '3',
        title: 'Historial completo',
        description: 'Consulta todas tus transacciones y mantén control de tus gastos',
        icon: 'list-outline',
    },
    {
        id: '4',
        title: 'Seguro y confiable',
        description: 'Tu información está protegida con la mejor tecnología de seguridad',
        icon: 'shield-checkmark-outline',
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0) {
                setCurrentIndex(viewableItems[0].index || 0);
            }
        }
    ).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            handleGetStarted();
        }
    };

    const handleSkip = () => {
        handleGetStarted();
    };

    const handleGetStarted = async () => {
        try {
            await setFirstTimeLaunch(false);
            router.replace('/auth/login');
        } catch (error) {
            router.replace('/auth/login');
        }
    };

    const renderSlide = ({ item }: { item: OnboardingSlide }) => (
        <View style={styles.slide}>
            <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={120} color={BrandColors.primary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );

    const renderPagination = () => (
        <View style={styles.pagination}>
            {slides.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        index === currentIndex && styles.activeDot,
                    ]}
                />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Skip button */}
            {currentIndex < slides.length - 1 && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Saltar</Text>
                </TouchableOpacity>
            )}

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                bounces={false}
            />

            {/* Pagination */}
            {renderPagination()}

            {/* Action button */}
            <View style={styles.buttonContainer}>
                <Button
                    title={currentIndex === slides.length - 1 ? 'Comenzar' : 'Siguiente'}
                    onPress={handleNext}
                    fullWidth
                    size="large"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.white,
    },
    skipButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    skipText: {
        fontSize: 16,
        color: BrandColors.gray[600],
        fontWeight: '600',
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 100,
    },
    iconContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: BrandColors.gray[600],
        textAlign: 'center',
        lineHeight: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: BrandColors.gray[300],
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
        backgroundColor: BrandColors.primary,
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
});
