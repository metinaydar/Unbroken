import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    TextInput,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface ThemedDropdownProps {
    label: string;
    value: string;
    options: string[];
    onValueChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const ThemedDropdown: React.FC<ThemedDropdownProps> = ({
    label,
    value,
    options,
    onValueChange,
    placeholder = 'Select an option',
    disabled = false,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleSelect = (selectedValue: string) => {
        onValueChange(selectedValue);
        setModalVisible(false);
        setSearchText('');
    };

    return (
        <View style={styles.container}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <TouchableOpacity
                style={[styles.dropdownButton, disabled && styles.disabled]}
                onPress={() => !disabled && setModalVisible(true)}
                disabled={disabled}
            >
                <ThemedText style={[styles.dropdownText, !value && styles.placeholder]}>
                    {value || placeholder}
                </ThemedText>
                <ThemedText style={styles.arrow}>▼</ThemedText>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <ThemedView style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>{label}</ThemedText>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalVisible(false);
                                    setSearchText('');
                                }}
                                style={styles.closeButton}
                            >
                                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => handleSelect(item)}
                                >
                                    <ThemedText style={styles.optionText}>{item}</ThemedText>
                                </TouchableOpacity>
                            )}
                            style={styles.optionsList}
                        />
                    </ThemedView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    dropdownButton: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    disabled: {
        backgroundColor: '#f5f5f5',
        opacity: 0.6,
    },
    dropdownText: {
        flex: 1,
        color: '#000',
    },
    placeholder: {
        color: '#999',
    },
    arrow: {
        fontSize: 12,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 18,
        color: '#666',
    },
    searchInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 16,
        backgroundColor: '#fff',
        color: '#000',
    },
    optionsList: {
        maxHeight: 300,
    },
    optionItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    optionText: {
        fontSize: 16,
        color: '#000',
    },
}); 