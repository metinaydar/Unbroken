/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import QRScanner from './src/components/QRScanner';
import { dataService, Event, Item } from './src/services/DataService';

// Define user roles
const roles = ['Driver', 'Dock Worker', 'Warehouse Manager'] as const;
type Role = typeof roles[number];

const App = () => {
  const [role, setRole] = useState<Role>('Driver');
  const [events, setEvents] = useState<Event[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ synced: 0, unsynced: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    loadEvents();
    loadSyncStatus();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      await dataService.initialize();
      await loadEvents();
      await loadSyncStatus();
    } catch (error) {
      Alert.alert('Initialization Error', 'Failed to initialize the app');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const allEvents = await dataService.getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await dataService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleScanQR = () => {
    setShowScanner(true);
  };

  const handleQRCodeScanned = async (qrData: string) => {
    setShowScanner(false);
    
    try {
      // Look up item by QR code
      const item = await dataService.getItemByQR(qrData);
      
      if (item) {
        // Record handoff event
        const eventData = {
          type: 'event' as const,
          shipment_id: item.shipment_id,
          item_id: item._id,
          event_type: 'handoff' as const,
          location: {
            lat: 57.7089, // Mock location
            lng: 11.9746,
            address: 'Current Location'
          },
          user_id: `user::${role.toLowerCase().replace(' ', '_')}`,
          notes: `Handoff recorded by ${role}`
        };

        await dataService.recordEvent(eventData);
        await loadEvents();
        await loadSyncStatus();
        
        Alert.alert(
          'Event Recorded', 
          `Handoff recorded for ${item.name} (${item.item_id})`
        );
      } else {
        Alert.alert('Item Not Found', `No item found with QR code: ${qrData}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record event');
    }
  };

  const handleManualEvent = async () => {
    try {
      // Create a manual event for demo purposes
      const eventData = {
        type: 'event' as const,
        shipment_id: 'shipment::demo-001',
        item_id: 'item::demo-001',
        event_type: 'pickup' as const,
        location: {
          lat: 57.7089,
          lng: 11.9746,
          address: 'Port of Gothenburg'
        },
        user_id: `user::${role.toLowerCase().replace(' ', '_')}`,
        notes: `Manual event recorded by ${role}`
      };

      await dataService.recordEvent(eventData);
      await loadEvents();
      await loadSyncStatus();
      
      Alert.alert('Event Recorded', 'Manual event recorded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to record manual event');
    }
  };

  const handleSync = async () => {
    try {
      setIsLoading(true);
      await dataService.simulateSync();
      await loadEvents();
      await loadSyncStatus();
      Alert.alert('Sync Complete', 'All offline events have been synced');
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync events');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventType}>{item.event_type.toUpperCase()}</Text>
      <Text>Item: {item.item_id}</Text>
      <Text>Notes: {item.notes}</Text>
      <Text>Time: {new Date(item.timestamp).toLocaleString()}</Text>
      <Text style={item.synced ? styles.syncedText : styles.unsyncedText}>
        Status: {item.synced ? 'Synced' : 'Offline'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Unbroken Logistics Tracker</Text>
      
      <Text style={styles.subtitle}>Select Role:</Text>
      <View style={styles.roleContainer}>
        {roles.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.roleButton, role === r && styles.selectedRole]}
            onPress={() => setRole(r)}
          >
            <Text style={styles.roleText}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Scan QR Code" onPress={handleScanQR} />
        <Button title="Record Manual Event" onPress={handleManualEvent} />
        <Button title="Sync Events" onPress={handleSync} />
      </View>

      <View style={styles.syncStatus}>
        <Text style={styles.syncText}>
          Synced: {syncStatus.synced} | Offline: {syncStatus.unsynced}
        </Text>
      </View>

      <Text style={styles.subtitle}>Events:</Text>
      <FlatList
        data={events}
        keyExtractor={item => item._id}
        renderItem={renderEvent}
        style={styles.eventList}
      />

      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <QRScanner
          onQRCodeScanned={handleQRCodeScanned}
          onClose={() => setShowScanner(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginTop: 16, 
    marginBottom: 8 
  },
  roleContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 16 
  },
  roleButton: { 
    padding: 10, 
    borderRadius: 8, 
    backgroundColor: '#eee' 
  },
  selectedRole: { 
    backgroundColor: '#cce5ff' 
  },
  roleText: { 
    fontSize: 16 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  syncStatus: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  syncText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  eventList: {
    flex: 1,
  },
  eventItem: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderRadius: 8,
  },
  eventType: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  syncedText: {
    color: 'green',
    fontWeight: '600',
  },
  unsyncedText: {
    color: 'orange',
    fontWeight: '600',
  },
});

export default App;
