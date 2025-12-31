import JailMonkey from 'jail-monkey';
import { BackHandler, Alert } from 'react-native';

/**
 * Integrity Check Service
 * Detects compromised environments (Root, Jailbreak, Mock Locations).
 */

export const IntegrityCheck = {
    /**
     * Performs a comprehensive integrity check.
     * If compromised, it will terminate the application.
     */
    checkAndEnforce: () => {
        const isJailBroken = JailMonkey.isJailBroken();
        const hookDetected = JailMonkey.hookDetected();
        const canMockLocation = JailMonkey.canMockLocation();
        const isDebugged = JailMonkey.isDebuggedMode();

        if (isJailBroken || hookDetected || isDebugged) {
            console.error('Security Violation: Device is compromised.');

            // Show generic error and exit
            Alert.alert(
                'Security Error',
                'This device does not meet the security requirements to run this application.',
                [
                    {
                        text: 'Exit',
                        onPress: () => BackHandler.exitApp(),
                        style: 'destructive',
                    },
                ],
                { cancelable: false }
            );

            return false;
        }

        return true;
    },

    /**
     * Checks if the environment is safe for sensitive operations (e.g. Payment).
     */
    isSafeEnvironment: (): boolean => {
        return !JailMonkey.isJailBroken() && !JailMonkey.hookDetected();
    }
};
