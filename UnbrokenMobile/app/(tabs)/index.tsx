import React, { useContext, useRef, useState, useEffect } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import {
    Button,
    ButtonGroup
} from "@rneui/base";
import {ThemedText} from '@/components/ThemedText';
import {ThemedSearchBar} from "@/components/searchBar/ThemedSearchBar";
import {ConnectionStatus} from "@/components/connectionStatus/ConnectionStatus";
import DatabaseContext from "@/providers/DatabaseContext";
import {useNavigation} from "@react-navigation/native";
import {getLogisticsBySearchTerm, getDistinctStatuses} from "@/hooks/getLogistics";
import {ThemedView} from "@/components/ThemedView";
import {NoLogistics} from "@/components/noLogistics/NoLogistics";
import {NoResults} from "@/components/noResults/NoResults";
import {router} from "expo-router";
import { useAuth } from '@/providers/AuthContext';

export default function LogisticsScreen() {
    const {databaseService} = useContext(DatabaseContext)!;
    const { user } = useAuth();
    const [searchRfid, setSearchRfid] = useState('');
    const [searchShipmentId, setSearchShipmentId] = useState('');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [filteredLogistics, setFilteredLogistics] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [statuses, setStatuses] = useState<string[]>([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            title: 'Logistics',
        });
    }, [navigation]);

    useEffect(() => {
        loadStatuses();
    }, []);

    const loadStatuses = async () => {
        setIsLoadingStatuses(true);
        try {
            // Add a small delay to ensure database is fully initialized
            await new Promise(resolve => setTimeout(resolve, 1000));
            const distinctStatuses = await getDistinctStatuses(databaseService);
            setStatuses(distinctStatuses);
            setSelectedIndex(null);
        } catch (error) {
            console.error('Error loading statuses:', error);
            setErrorMessage('Failed to load statuses');
        } finally {
            setIsLoadingStatuses(false);
        }
    };

    const fadeIn = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    async function search() {
        if (!searchRfid && !searchShipmentId && selectedIndex === null) {
            setErrorMessage('Please enter a search value or select a status.');
            return;
        }
        setIsLoading(true);
        try {
            setErrorMessage('');
            const status = selectedIndex !== null ? statuses[selectedIndex] : '';
            const logistics = await getLogisticsBySearchTerm(
                databaseService,
                searchRfid,
                searchShipmentId,
                status
            );
            if (logistics !== undefined && logistics.length > 0) {
                setFilteredLogistics(logistics);
            } else {
                setFilteredLogistics([]);
            }
        } catch (e){
            const errorMsg = e instanceof Error ? e.message : 'An unexpected error occurred';
            setErrorMessage(errorMsg);
        }
        finally {
            setIsLoading(false);
        }
    }

    async function reset() {
        setIsLoading(true);
        setFilteredLogistics([]);
        setIsLoading(false);
        fadeIn();
    }

    // @ts-ignore
    const renderLogisticsCard = ({item}) => (
        <TouchableOpacity
            onPress={() => {
                const logisticsId = item.logistics.item_id?.toString() || item.logistics._id?.toString() || '';
                if (logisticsId) {
                    router.push(`/logistics/${logisticsId}` as any);
                }
            }}
        >
            <ThemedView style={styles.card}>
                <ThemedText style={styles.cardTitle}>{item.logistics.rfid}</ThemedText>
                <ThemedText style={styles.cardSubtitle}>{item.logistics.shipment_id}</ThemedText>
                <ThemedText style={styles.description}>{item.logistics.description}</ThemedText>
                <ThemedText style={styles.status}>Status: {item.logistics.status}</ThemedText>
                <ThemedText style={styles.address}>{item.logistics.origin}</ThemedText>
                <ThemedText style={styles.address}>{item.logistics.destination}</ThemedText>
            </ThemedView>
        </TouchableOpacity>
    );

    if (isLoadingStatuses) {
        return (
            <SafeAreaView style={styles.container}>
                <ConnectionStatus />
                <ThemedView style={styles.header}>
                    <ThemedText style={styles.title}>{user.username ? user.username : 'Logistics'}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color="#0000ff"/>
                    <ThemedText style={styles.loadingText}>Loading statuses...</ThemedText>
                </ThemedView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ConnectionStatus />
            <ThemedView style={styles.header}>
                <ThemedText style={styles.title}>{user.username ? user.username : 'Logistics'}</ThemedText>
            </ThemedView>
            <ThemedSearchBar
                placeholder="Search RFID"
                onChangeText={(text) => {
                    setSearchRfid(text);
                    if (text) {
                        setSelectedIndex(null);
                    }
                }}
                onFocus={() => {
                    setSelectedIndex(null);
                }}
                value={searchRfid}>
            </ThemedSearchBar>
            <ThemedSearchBar
                placeholder="Search Shipment ID"
                onChangeText={(text) => {
                    setSearchShipmentId(text);
                    if (text) {
                        setSelectedIndex(null);
                    }
                }}
                onFocus={() => {
                    setSelectedIndex(null);
                }}
                value={searchShipmentId}>
            </ThemedSearchBar>
            {statuses.length > 0 ? (
                <ButtonGroup
                    buttons={[...statuses]}
                    selectedIndex={selectedIndex === null ? -1 : selectedIndex}
                    onPress={(value) => {
                        setSelectedIndex(value);
                        setSearchRfid('');
                        setSearchShipmentId('');
                    }}
                    containerStyle={{marginBottom: 20}}
                />
            ) : (
                <ThemedView style={styles.noStatusesContainer}>
                    <ThemedText style={styles.errorText}>No statuses available</ThemedText>
                </ThemedView>
            )}
            <Button
                onPress={search}
                title={'Search'}
                disabled={!searchRfid && !searchShipmentId && selectedIndex === null}
                containerStyle={{
                    marginHorizontal: 50,
                    marginBottom: 10,
                }}
            />
            {isLoading ? (
                <ThemedView style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color="#0000ff"/>
                </ThemedView>
            ) : (errorMessage.length > 0 ? (
                            <ThemedText>{errorMessage}</ThemedText>
                        ) : filteredLogistics === undefined || filteredLogistics.length === 0 ? (
                        <NoLogistics />
                    ) : (
                        <FlatList
                            data={filteredLogistics}
                            renderItem={renderLogisticsCard}
                            keyExtractor={(item) => item.logistics.item_id?.toString() || item.logistics._id?.toString() || 'unknown'}
                        />
                    )
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    spinnerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        fontSize: 16,
        marginBottom: 8,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 10,
    },
    address: {
        fontSize: 14,
        color: 'gray',
    },
    status: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'blue',
        marginBottom: 8,
    },
    addressPadding: {
        paddingTop: 16,
    },
    component: {
        paddingLeft: 8,
        paddingRight: 12,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    card: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 16,
        fontWeight: 'semibold',
        marginBottom: 16,
    },
    header: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    noStatusesContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
});
