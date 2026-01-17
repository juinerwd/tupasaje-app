import { Promotion } from '@/types';

/**
 * Fetch active promotions for the user
 */
export const getPromotions = async (): Promise<Promotion[]> => {
    // Mocking API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return [
        {
            id: '1',
            title: '¡Viaja Gratis!',
            description: 'Refiere a un amigo y obtén 2 pasajes',
            icon: 'gift-outline',
            backgroundColor: '#E8F5E9',
            actionLabel: 'Referir',
            actionType: 'REFERRAL',
        },
        {
            id: '2',
            title: 'Cashback 10%',
            description: 'En tu primera recarga del mes',
            icon: 'wallet-outline',
            backgroundColor: '#E3F2FD',
            actionLabel: 'Recargar',
            actionType: 'RECHARGE',
        },
        {
            id: '3',
            title: 'Descuento Estudiantil',
            description: 'Ahorra 20% en todos tus viajes',
            icon: 'school-outline',
            backgroundColor: '#FFF3E0',
            actionLabel: 'Ver más',
            actionType: 'INTERNAL',
            actionValue: '/(passenger)/help',
        }
    ];
};

/**
 * Claim a promotion
 */
export const claimPromotion = async (promotionId: string): Promise<{ success: boolean; message: string }> => {
    // Mocking API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
        success: true,
        message: '¡Promoción reclamada con éxito!'
    };
};
