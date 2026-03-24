---
name: generate-expo-screen
description: Rules for scaffolding new screens manually using Expo Router in the TuPasaje project.
---

# Code an Expo Router Screen

When the USER asks you to add a new screen or route, adhere to the following routing rules:

1. **File System Routing**: 
   - Ensure the screen file is placed correctly inside the `app/` directory (e.g., `app/passenger/profile.tsx` becomes the `/passenger/profile` route).
   - If it is part of a flow, consider grouping them or creating an `_layout.tsx` file to manage headers.

2. **Safe Areas**:
   - Always wrap your outermost container with a handling of device notches. Use `import { useSafeAreaInsets } from 'react-native-safe-area-context';` and apply `paddingTop: insets.top` to the root view.

3. **Responsive Keyboard**:
   - If the screen contains TextInputs or forms, wrap the content in `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`.
   - Use `ScrollView` or `FlatList` with `contentContainerStyle` to allow proper scrolling when the keyboard overlaps content.

4. **Headers & Navigation**:
   - Expo Router usually provides its own header. If you are using a custom header, disable the default one dynamically where needed using `<Stack.Screen options={{ headerShown: false }} />`.
   - Use `const router = useRouter();` from `expo-router` for navigating between screens (e.g., `router.push(...)` or `router.back()`).

## Required Imports Checklist
Make sure your template relies on these common tools for this project:
- `useRouter` from `expo-router`
- `useSafeAreaInsets` from `react-native-safe-area-context`
- `Alert`, `Dimensions`, `StyleSheet`, `Text`, `TouchableOpacity`, `View` from `react-native`
