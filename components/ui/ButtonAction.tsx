import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from './Card';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonActionProps {
    action: {
        id: string;
        title: string;
        icon: string;
        color: string;
        action: () => void;
    };
    index: number;
}

const ButtonAction = ({ action, index }: ButtonActionProps) => {
    return (
        <AnimatedTouchable
            key={action.id}
            entering={FadeInDown.delay(500 + index * 50).duration(500)}
            style={styles.actionItem}
            onPress={action.action}
        >
            <Card variant="elevated" style={styles.actionCard}>
                <View style={[styles.actionIconContainer, { backgroundColor: action.color + '15' }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
            </Card>
        </AnimatedTouchable>
    )
}

export default ButtonAction

const styles = StyleSheet.create({
    actionItem: {
        width: '33.33%',
        padding: 6,
    },
    actionCard: {
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 110,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: BrandColors.gray[700],
        textAlign: 'center',
    },
})