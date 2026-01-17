import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    LayoutAnimation,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const FAQS: FAQItem[] = [
    {
        category: 'Pagos y Recargas',
        question: '¿Cómo recargo mi saldo?',
        answer: 'Puedes recargar tu saldo desde la pantalla principal tocando el botón "Recargar". Aceptamos tarjetas de crédito, PSE, Nequi y Bancolombia a través de Wompi.',
    },
    {
        category: 'Pagos y Recargas',
        question: '¿Mi dinero está seguro?',
        answer: 'Sí, utilizamos Wompi (una pasarela de Bancolombia) para procesar todos los pagos de forma segura. No almacenamos los datos completos de tus tarjetas en nuestros servidores.',
    },
    {
        category: 'Viajes',
        question: '¿Cómo pago mi pasaje?',
        answer: 'Simplemente escanea el código QR que se encuentra en el vehículo del conductor. El monto se descontará automáticamente de tu saldo.',
    },
    {
        category: 'Viajes',
        question: '¿Qué hago si el código QR no funciona?',
        answer: 'Asegúrate de tener buena iluminación y que la cámara esté limpia. Si persiste el problema, puedes ingresar el número de placa del vehículo manualmente.',
    },
    {
        category: 'Cuenta',
        question: '¿Cómo cambio mi PIN de seguridad?',
        answer: 'Ve a Perfil > Seguridad > Cambiar PIN. Necesitarás tu PIN actual para realizar el cambio.',
    },
    {
        category: 'Cuenta',
        question: 'Olvidé mi PIN, ¿qué hago?',
        answer: 'En la pantalla de ingreso de PIN, toca en "¿Olvidaste tu PIN?". Te enviaremos un código de recuperación a tu correo electrónico o SMS registrado.',
    },
];

const CONTACT_OPTIONS = [
    {
        id: 'whatsapp',
        icon: 'logo-whatsapp',
        title: 'WhatsApp',
        subtitle: 'Respuesta inmediata',
        color: '#25D366',
        onPress: () => Linking.openURL('whatsapp://send?phone=+573000000000&text=Hola, necesito ayuda con TuPasaje'),
    },
    {
        id: 'email',
        icon: 'mail-outline',
        title: 'Correo electrónico',
        subtitle: 'soporte@tupasaje.com',
        color: BrandColors.primary,
        onPress: () => Linking.openURL('mailto:soporte@tupasaje.com?subject=Soporte TuPasaje'),
    },
    {
        id: 'phone',
        icon: 'call-outline',
        title: 'Línea de atención',
        subtitle: 'Lunes a Viernes, 8am - 6pm',
        color: BrandColors.secondary,
        onPress: () => Linking.openURL('tel:+573000000000'),
    },
];

export default function HelpScreen() {
    const router = useRouter();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleExpand = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={BrandColors.gray[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.duration(600)}>
                    <Text style={styles.sectionTitle}>Canales de contacto</Text>
                    <View style={styles.contactGrid}>
                        {CONTACT_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={styles.contactCard}
                                onPress={option.onPress}
                            >
                                <View style={[styles.contactIcon, { backgroundColor: option.color + '15' }]}>
                                    <Ionicons name={option.icon as any} size={24} color={option.color} />
                                </View>
                                <Text style={styles.contactTitle}>{option.title}</Text>
                                <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Preguntas Frecuentes</Text>
                    {FAQS.map((faq, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.faqItem}
                            onPress={() => toggleExpand(index)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.faqHeader}>
                                <View style={styles.faqQuestionContainer}>
                                    <Text style={styles.faqCategory}>{faq.category}</Text>
                                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                                </View>
                                <Ionicons
                                    name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={BrandColors.gray[400]}
                                />
                            </View>
                            {expandedIndex === index && (
                                <View style={styles.faqAnswerContainer}>
                                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Versión 1.0.0</Text>
                    <Text style={styles.footerText}>© 2024 TuPasaje. Todos los derechos reservados.</Text>
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
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 16,
    },
    contactGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    contactCard: {
        backgroundColor: BrandColors.white,
        borderRadius: 16,
        padding: 16,
        width: '48%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    contactIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 4,
    },
    contactSubtitle: {
        fontSize: 12,
        color: BrandColors.gray[500],
    },
    faqItem: {
        backgroundColor: BrandColors.white,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderBottomColor: BrandColors.gray[100],
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    faqQuestionContainer: {
        flex: 1,
        marginRight: 12,
    },
    faqCategory: {
        fontSize: 11,
        fontWeight: 'bold',
        color: BrandColors.primary,
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        color: BrandColors.gray[900],
    },
    faqAnswerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: BrandColors.gray[50],
    },
    faqAnswer: {
        fontSize: 14,
        color: BrandColors.gray[600],
        lineHeight: 20,
        marginTop: 12,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: BrandColors.gray[400],
        marginBottom: 4,
    },
});
