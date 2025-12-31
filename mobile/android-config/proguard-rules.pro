# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/share/android-sdk/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }

# Realm
-keep class io.realm.react.** { *; }
-keep class io.realm.** { *; }

# React Native Keychain
-keep class com.oblador.keychain.** { *; }

# React Native Jail Monkey
-keep class com.gantix.jailmonkey.** { *; }

# Obfuscation Rules (Aggressive)
-repackageclasses ''
-allowaccessmodification
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep custom security classes (if any native ones added later)
-keep class com.ecommerce.mobile.security.** { *; }
