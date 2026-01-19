import { BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';

export interface QRScannerState {
    hasPermission: boolean | null;
    isScanning: boolean;
    scannedData: string | null;
    error: string | null;
}

/**
 * Hook for managing QR code scanner
 */
export function useQRScanner() {
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [scannedData, setScannedData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Request permission on mount if not granted
    useEffect(() => {
        if (permission && !permission.granted && !permission.canAskAgain) {
            setError('Permisos de cámara denegados. Por favor, habilítalos en la configuración.');
        }
    }, [permission]);

    /**
     * Start scanning
     */
    const startScanning = async () => {
        try {
            setError(null);
            setScannedData(null);

            if (!permission) {
                setError('Verificando permisos de cámara...');
                return;
            }

            if (!permission.granted) {
                const { granted } = await requestPermission();
                if (!granted) {
                    setError('Permisos de cámara denegados');
                    return;
                }
            }

            setIsScanning(true);
        } catch (err) {
            setError('Error al iniciar el escáner');
        }
    };

    /**
     * Stop scanning
     */
    const stopScanning = () => {
        setIsScanning(false);
        setScannedData(null);
        setError(null);
    };

    /**
     * Handle barcode scanned
     */
    const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
        if (!isScanning) return;

        try {
            // Validate that it's a valid QR code data
            if (data && data.trim().length > 0) {
                setScannedData(data);
                setIsScanning(false); // Stop scanning after successful scan
            } else {
                setError('Código QR inválido');
            }
        } catch (err) {
            setError('Error al procesar el código QR');
        }
    };

    /**
     * Reset scanner state
     */
    const reset = () => {
        setScannedData(null);
        setError(null);
        setIsScanning(false);
    };

    return {
        // State
        hasPermission: permission?.granted ?? null,
        isScanning,
        scannedData,
        error,
        canAskAgain: permission?.canAskAgain ?? true,

        // Actions
        startScanning,
        stopScanning,
        handleBarCodeScanned,
        reset,
        requestPermission,
    };
}
