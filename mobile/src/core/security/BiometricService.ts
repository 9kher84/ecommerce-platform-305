import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

/**
 * Biometric Service
 * Handles hardware interaction for FaceID/TouchID.
 */
export const BiometricService = {
    rnBiometrics: new ReactNativeBiometrics(),

    /**
     * Check if biometrics are available and what type.
     */
    async checkAvailability(): Promise<{ available: boolean; type?: string }> {
        const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
        return { available, type: biometryType };
    },

    /**
     * Create a cryptographic key pair for secure authentication.
     * The private key remains in the Secure Enclave.
     */
    async createKeys(): Promise<string | null> {
        const { publicKey } = await this.rnBiometrics.createKeys();
        return publicKey;
    },

    /**
     * Prompt user for biometric authentication.
     * Returns a signature if successful.
     */
    async prompt(payload: string): Promise<string | null> {
        try {
            const { success, signature } = await this.rnBiometrics.createSignature({
                promptMessage: 'Confirm your identity',
                payload: payload,
            });

            if (success && signature) {
                return signature;
            }
            return null;
        } catch (error) {
            console.error('Biometric Prompt Failed:', error);
            return null;
        }
    }
};
