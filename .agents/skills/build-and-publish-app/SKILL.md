---
name: build-and-publish-app
description: Reference for building Expo binaries and over-the-air updates for TuPasaje.
---

# Build and Publish Process

This capability helps you assist the USER when they want to compile the Expo project for Android/iOS or push an update.

## Over The Air (OTA) Updates
1. Only recommend OTA updates via `eas update` for logic, JS, and asset fixes.
2. Example script usage:
   `eas update --branch main --message "hotfix: resolve translation issue"`
3. Explain to the user that native code changes (like adding a custom biometric library) REQUIRE a full re-build.

## Building for App Stores
1. Ensure `eas.json` is configured correctly for the `development`, `preview`, or `production` profiles.
2. To build an APK for testing on Android:
   `eas build -p android --profile preview`
3. To build an AAB for the Google Play Store:
   `eas build -p android --profile production`
4. If the build fails via terminal, instruct to check the EAS Dashboard URL provided in the console.

## Troubleshooting Builds
- If there's an issue with React Native Map dependencies (a common issue), check the `app.json` plugins. 
- Suggest running `npx expo prebuild --clean` if iOS/Android bare folders are misconfigured.
