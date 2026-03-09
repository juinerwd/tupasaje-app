import { BrandColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    date: {
        fontSize: 14,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginBottom: 16,
    },
    h3: {
        fontSize: 16,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
        marginTop: 16,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    p: {
        fontSize: 14,
        color: BrandColors.gray[700],
        lineHeight: 20,
        marginBottom: 12,
    },
    li: {
        fontSize: 14,
        color: BrandColors.gray[700],
        lineHeight: 20,
        marginLeft: 8,
        marginBottom: 4,
    },
});

export const TERMS_AND_CONDITIONS = (
    <View style={styles.container}>
        <Text style={styles.date}>Última actualización: 3 de marzo de 2026</Text>

        <Text style={styles.h3}>1. ACEPTACIÓN</Text>
        <Text style={styles.p}>
            Al registrarse y utilizar la plataforma Tu Pasaje, el usuario acepta de manera expresa e inequívoca los presentes Términos y Condiciones.
        </Text>

        <Text style={styles.h3}>2. NATURALEZA DE LA PLATAFORMA</Text>
        <Text style={styles.p}>Tu Pasaje es una plataforma tecnológica que:</Text>
        <Text style={styles.li}>• Permite la gestión de saldo digital y pagos electrónicos.</Text>
        <Text style={styles.li}>• Facilita la intermediación tecnológica entre pasajeros y conductores.</Text>
        <Text style={styles.li}>• Permite pagos directos incluso sin asignación previa.</Text>
        <Text style={styles.p}>
            Tu Pasaje NO presta directamente el servicio de transporte.
        </Text>

        <Text style={styles.h3}>3. REGISTRO Y SEGURIDAD</Text>
        <Text style={styles.p}>
            El usuario es responsable de mantener la confidencialidad de su PIN y notificar cualquier uso no autorizado.
        </Text>

        <Text style={styles.h3}>4. SALDO DIGITAL</Text>
        <Text style={styles.p}>
            El saldo no genera intereses y se gestiona a través de pasarelas seguras.
        </Text>

        <Text style={styles.h3}>5. RESPONSABILIDAD</Text>
        <Text style={styles.p}>
            Los conductores son responsables del cumplimiento de normas de tránsito y seguros. Tu Pasaje no responde por accidentes o pérdidas de objetos.
        </Text>
    </View>
);

export const PRIVACY_POLICY = (
    <View style={styles.container}>
        <Text style={styles.date}>Última actualización: 3 de marzo de 2026</Text>

        <Text style={styles.h3}>1. DATOS QUE RECOPILAMOS</Text>
        <Text style={styles.p}>
            Recopilamos nombre, documento, teléfono, correo, ubicación y datos de pago.
        </Text>

        <Text style={styles.h3}>2. USO DE DATOS</Text>
        <Text style={styles.p}>
            Los datos se usan para verificación de identidad, gestión de pagos, asignación de servicios y prevención de fraude.
        </Text>

        <Text style={styles.h3}>3. UBICACIÓN</Text>
        <Text style={styles.p}>
            Recopilamos ubicación precisa para el funcionamiento del servicio de transporte.
        </Text>

        <Text style={styles.h3}>4. COMPARTICIÓN</Text>
        <Text style={styles.p}>
            Compartimos datos necesarios con la contraparte del servicio (conductor/pasajero) y proveedores tecnológicos.
        </Text>
    </View>
);
