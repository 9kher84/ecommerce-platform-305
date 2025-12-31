import RNScreenshotPrevent from 'react-native-screenshot-prevent';
import { Platform } from 'react-native';

/**
 * Screen Protection Service
 * Prevents data leakage via screenshots or screen recording.
 * Uses 'react-native-screenshot-prevent' for better compatibility.
 */

export const ScreenProtection = {
    /**
     * Enable screen protection globally.
     * - Android: Sets FLAG_SECURE
     * - iOS: Blurs screen on background / prevents screenshot if supported
     */
    enable: () => {
        if (Platform.OS === 'ios') {
            RNScreenshotPrevent.enabled(true);
        } else {
            RNScreenshotPrevent.enabled(true);
        }
        console.log('Screen Protection Enabled (Secure Mode)');
    },

    /**
     * Disable screen protection (e.g., for non-sensitive screens if needed).
     * NOT RECOMMENDED for this high-security app.
     */
    disable: () => {
        RNScreenshotPrevent.enabled(false);
        console.warn('Screen Protection Disabled - Security Risk!');
    }
};
