import { z } from 'zod';

/**
 * Phone number validation (Colombian format: starts with 3, 10 digits)
 */
export const phoneSchema = z
    .string()
    .length(10, 'El número de teléfono debe tener exactamente 10 dígitos')
    .regex(/^3[0-9]{9}$/, 'El número de teléfono debe empezar por 3 y tener 10 dígitos');

/**
 * PIN validation (6 digits)
 */
export const pinSchema = z
    .string()
    .length(6, 'El PIN debe tener exactamente 6 dígitos')
    .regex(/^[0-9]+$/, 'El PIN solo debe contener números')
    .refine((pin) => {
        // No repetir el mismo número 6 veces
        if (/^(\d)\1{5}$/.test(pin)) return false;
        // No permitir secuencias ascendentes o descendentes
        const sequences = [
            '012345', '123456', '234567', '345678', '456789', '567890',
            '098765', '987654', '876543', '765432', '654321', '543210'
        ];
        return !sequences.includes(pin);
    }, { message: 'El PIN es demasiado simple o predecible (evita números repetidos o secuencias)' });


/**
 * Email validation
 */
export const emailSchema = z
    .string()
    .email('Correo electrónico inválido')
    .min(1, 'El correo electrónico es requerido');

/**
 * Name validation
 */
export const nameSchema = z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre debe tener máximo 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo debe contener letras');

/**
 * ID number validation (DNI)
 */
export const idNumberSchema = z
    .string()
    .min(5, 'El número de identificación debe tener al menos 5 dígitos')
    .max(15, 'El número de identificación no puede exceder 15 dígitos')
    .regex(/^[0-9]+$/, 'El número de identificación solo debe contener números');


/**
 * Verification code validation
 */
export const verificationCodeSchema = z
    .string()
    .length(6, 'El código de verificación debe tener 6 dígitos')
    .regex(/^[0-9]+$/, 'El código solo debe contener números');

/**
 * Login form validation
 */
export const loginSchema = z.object({
    phoneNumber: phoneSchema,
    // PIN is handled separately with local state, not by react-hook-form
});

/**
 * Personal data form validation (Step 3 of registration)
 */
export const personalDataSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    idType: z.string().min(1, 'Seleccione un tipo de identificación'),
    idNumber: idNumberSchema,
    email: emailSchema,
});

/**
 * PIN creation form validation (Step 4 of registration)
 */
export const pinCreationSchema = z.object({
    pin: pinSchema,
    confirmPin: pinSchema,
}).refine((data) => data.pin === data.confirmPin, {
    message: 'Los PINs no coinciden',
    path: ['confirmPin'],
});

/**
 * Phone verification form validation (Step 2 of registration)
 */
export const phoneVerificationSchema = z.object({
    phone: phoneSchema,
    verificationCode: verificationCodeSchema.optional(),
});

/**
 * Amount validation
 */
export const amountSchema = z
    .number()
    .positive('El monto debe ser mayor a 0')
    .max(10000000, 'El monto no puede ser mayor a 10,000,000');

/**
 * Vehicle plate validation (Colombian format: ABC123 or ABC12D)
 */
export const vehiclePlateSchema = z
    .string()
    .min(6, 'La placa debe tener al menos 6 caracteres')
    .max(6, 'La placa debe tener máximo 6 caracteres')
    .regex(/^[A-Z]{3}[0-9]{3}$|^[A-Z]{3}[0-9]{2}[A-Z]$/i, 'Formato de placa inválido (ej: ABC123 o ABC12D)');

// Export types

export type LoginFormData = z.infer<typeof loginSchema>;
export type PersonalDataFormData = z.infer<typeof personalDataSchema>;
export type PinCreationFormData = z.infer<typeof pinCreationSchema>;
export type PhoneVerificationFormData = z.infer<typeof phoneVerificationSchema>;
