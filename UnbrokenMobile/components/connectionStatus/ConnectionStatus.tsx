import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import DatabaseContext from '@/providers/DatabaseContext';
import { getReplicatorStatus } from '@/hooks/getReplicatorStatus';
import { ReplicatorActivityLevel } from 'cbl-reactnative';

export function ConnectionStatus() {
    const { databaseService } = useContext(DatabaseContext)!;
    const [status, setStatus] = useState<string>('Unknown');
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                setIsLoading(true);
                const replicatorStatus = await getReplicatorStatus(databaseService);
                
                if (replicatorStatus) {
                    console.log('ReplicatorStatus object:', JSON.stringify(replicatorStatus, null, 2));
                    console.log('ReplicatorStatus type:', typeof replicatorStatus);
                    console.log('ReplicatorStatus keys:', Object.keys(replicatorStatus));
                    
                    // The native module might return a plain object, so let's treat it as such
                    let statusString = 'Unknown';
                    let isConnected = false;
                    
                    try {
                        // Treat as plain object since native module might not return proper ReplicatorStatus instance
                        const statusObj = replicatorStatus as any;
                        const activityLevel = statusObj.activityLevel;
                        
                        if (activityLevel !== undefined) {
                            statusString = ReplicatorActivityLevel[activityLevel] || 'Unknown';
                            isConnected = activityLevel === ReplicatorActivityLevel.IDLE || activityLevel === ReplicatorActivityLevel.BUSY;
                        } else {
                            statusString = 'Unknown';
                            isConnected = false;
                        }
                    } catch (error) {
                        console.error('Error parsing replicator status:', error);
                        statusString = 'Error';
                        isConnected = false;
                    }
                    
                    setStatus(statusString);
                    setIsConnected(isConnected);
                } else {
                    setStatus('Not Initialized');
                    setIsConnected(false);
                }
            } catch (error) {
                console.error('Error checking replicator status:', error);
                setStatus('Error');
                setIsConnected(false);
            } finally {
                setIsLoading(false);
            }
        };

        // Check status immediately
        checkStatus();

        // Set up interval to check status every 5 seconds
        const interval = setInterval(checkStatus, 5000);

        return () => clearInterval(interval);
    }, [databaseService]);

    if (isLoading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.statusText}>Checking connection...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, isConnected ? styles.connected : styles.disconnected]}>
            <View style={[styles.indicator, isConnected ? styles.connectedIndicator : styles.disconnectedIndicator]} />
            <ThemedText style={[styles.statusText, isConnected ? styles.connectedText : styles.disconnectedText]}>
                {isConnected ? 'Connected' : 'Disconnected'} - {status}
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    connected: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: '#4CAF50',
    },
    disconnected: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderColor: '#F44336',
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    connectedIndicator: {
        backgroundColor: '#4CAF50',
    },
    disconnectedIndicator: {
        backgroundColor: '#F44336',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    connectedText: {
        color: '#4CAF50',
    },
    disconnectedText: {
        color: '#F44336',
    },
}); 