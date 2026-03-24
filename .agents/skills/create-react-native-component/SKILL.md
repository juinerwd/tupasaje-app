---
name: create-react-native-component
description: Guidelines and steps for creating consistent React Native components in the Tu Pasaje App.
---

# Create React Native Component

When the USER requests to create a new UI component for the application, strictly follow these guidelines to ensure consistency with the existing architecture:

1. **Location**: Place reusable components inside the `c:\Dev\tupasaje-project\tupasaje-app\components\ui\` or appropriate subfolder.
2. **Styling Approach**: 
   - ALWAYS use `StyleSheet.create` for standard styling.
   - For colors, import the global `BrandColors` constant if available (usually located in theme or constants folder). Do not use hardcoded hex values for primary branding.
3. **Icons**: Use `@expo/vector-icons/Ionicons` by default, using consistent sizing (e.g., size 24 for main, 16-18 for inline).
4. **Types**: Use TypeScript interfaces (`interface ComponentProps { ... }`) for component props.
5. **Exports**: Export the new component in `components/ui/index.ts` to keep imports clean for dashboards.

## Example Pattern:
```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { BrandColors } from '@/constants/Colors'; // Adjust path accordingly

interface CustomButtonProps {
    title: string;
    onPress: () => void;
    iconName?: keyof typeof Ionicons.glyphMap;
}

export const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress, iconName }) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
            {iconName && <Ionicons name={iconName} size={20} color="#fff" style={styles.icon} />}
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000', // Use BrandColors.primary
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    icon: {
        marginRight: 8,
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
```

6. **Feedback**: After creating the component, briefly explain to the user what parameters it takes and how it integrates with the screens.
