import { z } from 'zod';

/**
 * Phone number validation (Colombian format)
 */
export const phoneSchema = z
    .string()
    .min(10, 'El número de teléfono debe tener al menos 10 dígitos')
    .max(10, 'El número de teléfono debe tener máximo 10 dígitos')
    .regex(/^[0-9]+$/, 'El número de teléfono solo debe contener números');

/**
 * PIN validation (6 digits)
 */
export const pinSchema = z
    .string()
    .length(6, 'El PIN debe tener exactamente 6 dígitos')
    .regex(/^[0-9]+$/, 'El PIN solo debe contener números');

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
 * ID number validation
 */
export const idNumberSchema = z
    .string()
    .min(5, 'El número de identificación debe tener al menos 5 caracteres')
    .max(20, 'El número de identificación debe tener máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'El número de identificación solo debe contener letras y números');

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

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type PersonalDataFormData = z.infer<typeof personalDataSchema>;
export type PinCreationFormData = z.infer<typeof pinCreationSchema>;
export type PhoneVerificationFormData = z.infer<typeof phoneVerificationSchema>;
