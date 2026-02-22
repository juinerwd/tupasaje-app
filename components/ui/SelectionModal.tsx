import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Option {
    label: string;
    value: string | number;
}

interface SelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (value: any) => void;
    options: Option[];
    title: string;
    selectedValue?: any;
}

export function SelectionModal({
    visible,
    onClose,
    onSelect,
    options,
    title,
    selectedValue
}: SelectionModalProps) {
    const renderItem = ({ item }: { item: Option }) => {
        const isSelected = item.value === selectedValue;

        return (
            <TouchableOpacity
                style={[
                    styles.option,
                    isSelected && styles.optionSelected
                ]}
                onPress={() => {
                    onSelect(item.value);
                    onClose();
                }}
            >
                <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                ]}>
                    {item.label}
                </Text>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={BrandColors.primary} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.dismissArea}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <Animated.View
                    entering={FadeInUp}
                    style={styles.content}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={BrandColors.gray[600]} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={options}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.value.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    content: {
        backgroundColor: BrandColors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.7,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: BrandColors.gray[100],
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: BrandColors.gray[900],
    },
    closeButton: {
        padding: 4,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    optionSelected: {
        backgroundColor: BrandColors.primary + '10', // 10% opacity primary
    },
    optionText: {
        fontSize: 16,
        color: BrandColors.gray[700],
    },
    optionTextSelected: {
        color: BrandColors.primary,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: BrandColors.gray[50],
    },
});
