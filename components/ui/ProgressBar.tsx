import { BrandColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface ProgressBarProps {
    progress?: number; // 0 to 1
    steps?: number;
    currentStep?: number;
    color?: string;
    height?: number;
    style?: ViewStyle;
}

export function ProgressBar({
    progress,
    steps,
    currentStep,
    color = BrandColors.primary,
    height = 6,
    style
}: ProgressBarProps) {
    const finalProgress = steps && currentStep !== undefined
        ? (currentStep / steps) * 100
        : (progress || 0) * 100;

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.track, { height }]}>
                <View style={[styles.fill, { width: `${finalProgress}%`, backgroundColor: color }]} />
            </View>

            {steps && currentStep !== undefined && (
                <View style={styles.stepsContainer}>
                    {Array.from({ length: steps }).map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.step,
                                index + 1 <= currentStep && styles.stepActive,
                                index + 1 === currentStep && styles.stepCurrent,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 16,
    },
    track: {
        height: 6,
        backgroundColor: BrandColors.gray[200],
        borderRadius: 3,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: BrandColors.primary,
        borderRadius: 3,
    },
    stepsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    step: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: BrandColors.gray[300],
    },
    stepActive: {
        backgroundColor: BrandColors.primary,
    },
    stepCurrent: {
        backgroundColor: BrandColors.primary,
        transform: [{ scale: 1.3 }],
    },
});
