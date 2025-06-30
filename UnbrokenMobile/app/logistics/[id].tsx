import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@rneui/base';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedDropdown } from '@/components/ThemedDropdown';
import DatabaseContext from '@/providers/DatabaseContext';
import LogisticsOptionsContext from '@/providers/LogisticsOptionsProvider';
import { 
    getLogisticsById, 
    updateLogisticsById
} from '@/hooks/getLogistics';
import { useAuth } from '@/providers/AuthContext';

export default function LogisticsDetailScreen() {
    const { id } = useLocalSearchParams();
    const { databaseService } = useContext(DatabaseContext)!;
    const { statuses, handlerRoles, handoffPoints, packageConditions } = useContext(LogisticsOptionsContext);
    const [logistics, setLogistics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string>('');
    const [editableData, setEditableData] = useState<any>({});
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (id) {
            loadLogistics(id as string);
        }
    }, [id]);

    const loadLogistics = async (logisticsId: string) => {
        setIsLoading(true);
        setError('');
        try {
            const result = await getLogisticsById(databaseService, logisticsId);
            if (result) {
                setLogistics(result.logistics);
                setEditableData({
                    rfid: result.logistics.rfid || '',
                    shipment_id: result.logistics.shipment_id || '',
                    status: result.logistics.status || '',
                    origin: result.logistics.origin || '',
                    destination: result.logistics.destination || '',
                    handler_role: result.logistics.handler_role || '',
                    handoff_point: result.logistics.handoff_point || '',
                    item_id: result.logistics.item_id || '',
                    package_condition: result.logistics.package_condition || '',
                    timestamp: result.logistics.timestamp || '',
                });
            } else {
                setError('Logistics record not found');
            }
        } catch (err) {
            console.error('Error loading logistics:', err);
            const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!logistics || !id) return;

        setIsSaving(true);
        try {
            // Filter out empty values and prepare update data
            const updateData: any = {};
            Object.keys(editableData).forEach(key => {
                if (editableData[key] !== undefined && editableData[key] !== '') {
                    updateData[key] = editableData[key];
                }
            });

            // Set handler_role to logged-in user's role if present
            if (user.role) {
                updateData.handler_role = user.role;
            }

            await updateLogisticsById(databaseService, id as string, updateData);
            
            Alert.alert('Success', 'Logistics record updated successfully!');
            
            // Reload the logistics to show updated data
            await loadLogistics(id as string);
        } catch (err) {
            console.error('Error saving logistics:', err);
            const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
            Alert.alert('Error', `Failed to update logistics record: ${errorMsg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackPress = () => {
        router.back();
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <ThemedView style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <ThemedText style={styles.loadingText}>Loading logistics details...</ThemedText>
                </ThemedView>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <ThemedView style={styles.errorContainer}>
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                    <Button
                        onPress={handleBackPress}
                        title="Go Back"
                        containerStyle={styles.backButtonContainer}
                    />
                </ThemedView>
            </SafeAreaView>
        );
    }

    if (!logistics) {
        return (
            <SafeAreaView style={styles.container}>
                <ThemedView style={styles.errorContainer}>
                    <ThemedText style={styles.errorText}>Logistics record not found</ThemedText>
                    <Button
                        onPress={handleBackPress}
                        title="Go Back"
                        containerStyle={styles.backButtonContainer}
                    />
                </ThemedView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ThemedView style={styles.header}>
                <Button
                    onPress={handleBackPress}
                    title="← Back"
                    type="clear"
                    titleStyle={styles.backButtonText}
                />
            </ThemedView>
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <ThemedView style={styles.content}>
                    <ThemedView style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Item ID</ThemedText>
                        <TextInput
                            style={[styles.textInput, styles.disabledInput]}
                            value={editableData.item_id?.toString() || ''}
                            editable={false}
                            placeholder="Item ID (read-only)"
                        />
                    </ThemedView>
                    
                    <ThemedView style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>RFID</ThemedText>
                        <TextInput
                            style={[styles.textInput, styles.disabledInput]}
                            value={editableData.rfid}
                            editable={false}
                            placeholder="RFID (read-only)"
                        />
                    </ThemedView>
                    
                    <ThemedView style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Shipment ID</ThemedText>
                        <TextInput
                            style={[styles.textInput, styles.disabledInput]}
                            value={editableData.shipment_id}
                            editable={false}
                            placeholder="Shipment ID (read-only)"
                        />
                    </ThemedView>
                    
                    <ThemedDropdown
                        label="Status"
                        value={editableData.status}
                        options={statuses}
                        onValueChange={(value) => setEditableData({...editableData, status: value})}
                        placeholder="Select status"
                    />
                    
                    <ThemedView style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Origin</ThemedText>
                        <TextInput
                            style={styles.textInput}
                            value={editableData.origin}
                            onChangeText={(text) => setEditableData({...editableData, origin: text})}
                            placeholder="Enter origin"
                        />
                    </ThemedView>
                    
                    <ThemedView style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Destination</ThemedText>
                        <TextInput
                            style={styles.textInput}
                            value={editableData.destination}
                            onChangeText={(text) => setEditableData({...editableData, destination: text})}
                            placeholder="Enter destination"
                        />
                    </ThemedView>
                    
                    <ThemedDropdown
                        label="Handler Role"
                        value={editableData.handler_role}
                        options={handlerRoles}
                        onValueChange={(value) => setEditableData({...editableData, handler_role: value})}
                        placeholder="Select handler role"
                    />
                    
                    <ThemedDropdown
                        label="Handoff Point"
                        value={editableData.handoff_point}
                        options={handoffPoints}
                        onValueChange={(value) => setEditableData({...editableData, handoff_point: value})}
                        placeholder="Select handoff point"
                    />
                    
                    <ThemedDropdown
                        label="Package Condition"
                        value={editableData.package_condition}
                        options={packageConditions}
                        onValueChange={(value) => setEditableData({...editableData, package_condition: value})}
                        placeholder="Select package condition"
                    />
                    
                    <ThemedView style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Timestamp</ThemedText>
                        <TextInput
                            style={styles.textInput}
                            value={editableData.timestamp}
                            onChangeText={(text) => setEditableData({...editableData, timestamp: text})}
                            placeholder="Enter timestamp"
                        />
                    </ThemedView>
                </ThemedView>
            </ScrollView>
            
            <ThemedView style={styles.footer}>
                <Button
                    onPress={handleSave}
                    title={isSaving ? "Saving..." : "Save Changes"}
                    disabled={isSaving}
                    loading={isSaving}
                    containerStyle={styles.saveButtonContainer}
                />
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    textInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
        padding: 10,
        backgroundColor: '#fff',
        color: '#000',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    saveButtonContainer: {
        marginTop: 16,
    },
    spinnerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButtonContainer: {
        marginTop: 20,
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: '#666',
        opacity: 0.7,
    },
}); 