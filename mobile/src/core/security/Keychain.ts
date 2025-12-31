import * as Keychain from 'react-native-keychain';

/**
 * Secure Storage Service
 * Wraps react-native-keychain to enforce strict security policies.
 * NEVER use AsyncStorage for sensitive data.
 */

const SERVICE_NAME = 'com.ecommerce.mobile.secure';

export const SecureStorage = {
    /**
     * Save a value securely with biometric access control if available.
     * @param key Identifier for the value
     * @param value The sensitive string to store
     */
    async save(key: string, value: string): Promise<boolean> {
        try {
            const options: Keychain.Options = {
                service: `${SERVICE_NAME}.${key}`,
                accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
            };

            // Check if biometrics are supported, otherwise fallback to secure software
            const supported = await Keychain.getSupportedBiometryType();
            if (!supported) {
                options.accessControl = undefined; // Fallback to password/pin protection implicitly via OS
            }

            await Keychain.setGenericPassword(key, value, options);
            return true;
        } catch (error) {
            console.error(`SecureStorage Save Error for ${key}:`, error);
            return false;
        }
    },

    /**
     * Retrieve a value securely.
     * May prompt user for FaceID/TouchID.
     * @param key Identifier
     */
    async get(key: string): Promise<string | null> {
        try {
            const credentials = await Keychain.getGenericPassword({
                service: `${SERVICE_NAME}.${key}`,
            });

            if (credentials) {
                return credentials.password;
            }
            return null;
        } catch (error) {
            console.error(`SecureStorage Get Error for ${key}:`, error);
            return null;
        }
    },

    /**
     * Delete a secure value.
     * @param key Identifier
     */
    async delete(key: string): Promise<boolean> {
        try {
            await Keychain.resetGenericPassword({
                service: `${SERVICE_NAME}.${key}`,
            });
            return true;
        } catch (error) {
            console.error(`SecureStorage Delete Error for ${key}:`, error);
            return false;
        }
    },
};
