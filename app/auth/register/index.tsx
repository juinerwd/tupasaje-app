import { ProgressBar } from '@/components/ui';
import { BrandColors } from '@/constants/theme';
import { useRegistrationStore } from '@/store/registrationStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import step components
import Step1UserType from './step1-user-type';
import Step2PhoneVerification from './step2-phone-verification';
import Step3PersonalData from './step3-personal-data';
import Step4PinCreation from './step4-pin-creation';
import Step5Summary from './step5-summary';

export default function RegisterScreen() {
    const router = useRouter();
    const { currentStep, previousStep, canProceedToStep } = useRegistrationStore();

    const handleBack = () => {
        if (currentStep === 1) {
            router.back();
        } else {
            previousStep();
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1UserType />;
            case 2:
                return <Step2PhoneVerification />;
            case 3:
                return <Step3PersonalData />;
            case 4:
                return <Step4PinCreation />;
            case 5:
                return <Step5Summary />;
            default:
                return <Step1UserType />;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.leftHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={BrandColors.primary} // Blue in the image, close to primary brand color
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tu Pasaje</Text>
                </View>

                <View style={styles.rightHeader}>
                    <View style={styles.stepDot} />
                    <Text style={styles.stepText}>PASO {currentStep} DE 5</Text>
                </View>
            </View>

            {/* Step Content */}
            <View style={styles.content}>
                {renderStep()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    leftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900], // or a specific blue if BrandColors has it
    },
    rightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#9A6324', // brownish orange from the image
        marginRight: 6,
    },
    stepText: {
        fontSize: 12,
        fontWeight: '600',
        color: BrandColors.gray[500],
        letterSpacing: 1,
    },
    content: {
        flex: 1,
    },
});
