# 🔧 Mobile App Maintenance Guide

## 1. Build & Deployment
### Android
```bash
# Generate Release APK
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### iOS
```bash
# Install Pods
cd ios
pod install
# Open Workspace
open EcommerceMobile.xcworkspace
# Archive via Xcode
```

## 2. Key Rotation (Security)
### SSL Pinning
If the backend certificate changes:
1. Get the new Public Key Hash (SPKI).
2. Update `PINNING_CONFIG` in `src/core/security/NetworkSecurity.ts`.
3. Release a mandatory update immediately.

### Encryption Keys
1. The app will fail to decrypt existing data (Data Loss is expected security behavior).
2. `WipeService` will trigger on failure, forcing a fresh login and DB creation.

## 3. Troubleshooting
### "Network Security Error"
- **Cause**: SSL Pinning mismatch or MITM attack.
- **Fix**: Check if backend cert rotated. Update `NetworkSecurity.ts`.

### "Device Not Supported"
- **Cause**: Root/Jailbreak detected.
- **Fix**: App is working as intended. Do not bypass.

### "Database Encryption Failed"
- **Cause**: Keychain access failed or key corrupted.
- **Fix**: Re-install app to trigger `WipeService` and fresh setup.
