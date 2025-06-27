import AsyncStorage from '@react-native-async-storage/async-storage';

// TypeScript interfaces for our data model
export interface Shipment {
  _id: string;
  type: 'shipment';
  shipment_id: string;
  origin: string;
  destination: string;
  items: string[];
  status: 'pending' | 'in_transit' | 'delivered';
  created_at: string;
  company_id: string;
}

export interface Item {
  _id: string;
  type: 'item';
  item_id: string;
  name: string;
  qr_code: string;
  condition: 'good' | 'damaged' | 'lost';
  shipment_id: string;
}

export interface Event {
  _id: string;
  type: 'event';
  shipment_id: string;
  item_id: string;
  event_type: 'pickup' | 'handoff' | 'delivery';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  timestamp: string;
  user_id: string;
  notes?: string;
  synced: boolean;
}

class DataService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Create sample data if it doesn't exist
      await this.createSampleData();
      this.isInitialized = true;
      console.log('Data service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize data service:', error);
      throw error;
    }
  }

  private async createSampleData(): Promise<void> {
    try {
      // Check if sample data already exists
      const existingShipments = await AsyncStorage.getItem('shipments');
      if (existingShipments) return;

      // Create sample shipment
      const sampleShipment: Shipment = {
        _id: 'shipment::demo-001',
        type: 'shipment',
        shipment_id: 'SHP-2024-001',
        origin: 'Port of Gothenburg',
        destination: 'Stockholm Warehouse',
        items: ['item::demo-001', 'item::demo-002'],
        status: 'in_transit',
        created_at: new Date().toISOString(),
        company_id: 'company::sme_medical'
      };

      // Create sample items
      const sampleItems: Item[] = [
        {
          _id: 'item::demo-001',
          type: 'item',
          item_id: 'MED-SUPPLY-001',
          name: 'Medical Thermometers',
          qr_code: 'QR-MED-001',
          condition: 'good',
          shipment_id: 'shipment::demo-001'
        },
        {
          _id: 'item::demo-002',
          type: 'item',
          item_id: 'MED-SUPPLY-002',
          name: 'First Aid Kits',
          qr_code: 'QR-MED-002',
          condition: 'good',
          shipment_id: 'shipment::demo-001'
        }
      ];

      // Create sample events
      const sampleEvents: Event[] = [
        {
          _id: 'event::demo-001',
          type: 'event',
          shipment_id: 'shipment::demo-001',
          item_id: 'item::demo-001',
          event_type: 'pickup',
          location: {
            lat: 57.7089,
            lng: 11.9746,
            address: 'Port of Gothenburg'
          },
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          user_id: 'user::driver_01',
          notes: 'Package picked up from port',
          synced: true
        }
      ];

      // Store sample data
      await AsyncStorage.setItem('shipments', JSON.stringify([sampleShipment]));
      await AsyncStorage.setItem('items', JSON.stringify(sampleItems));
      await AsyncStorage.setItem('events', JSON.stringify(sampleEvents));

      console.log('Sample data created successfully');
    } catch (error) {
      console.error('Failed to create sample data:', error);
    }
  }

  // Event operations
  async recordEvent(eventData: Omit<Event, '_id' | 'timestamp' | 'synced'>): Promise<string> {
    try {
      const events = await this.getAllEvents();
      const newEvent: Event = {
        _id: `event::${Date.now()}`,
        type: 'event',
        shipment_id: eventData.shipment_id,
        item_id: eventData.item_id,
        event_type: eventData.event_type,
        location: eventData.location,
        timestamp: new Date().toISOString(),
        user_id: eventData.user_id,
        notes: eventData.notes || '',
        synced: false
      };

      events.unshift(newEvent); // Add to beginning of array
      await AsyncStorage.setItem('events', JSON.stringify(events));
      
      console.log('Event recorded:', newEvent._id);
      return newEvent._id;
    } catch (error) {
      console.error('Failed to record event:', error);
      throw error;
    }
  }

  async getUnsyncedEvents(): Promise<Event[]> {
    try {
      const events = await this.getAllEvents();
      return events.filter(event => !event.synced);
    } catch (error) {
      console.error('Failed to get unsynced events:', error);
      return [];
    }
  }

  async getAllEvents(): Promise<Event[]> {
    try {
      const eventsJson = await AsyncStorage.getItem('events');
      return eventsJson ? JSON.parse(eventsJson) : [];
    } catch (error) {
      console.error('Failed to get all events:', error);
      return [];
    }
  }

  // Item operations
  async getItemByQR(qrCode: string): Promise<Item | null> {
    try {
      const itemsJson = await AsyncStorage.getItem('items');
      const items: Item[] = itemsJson ? JSON.parse(itemsJson) : [];
      return items.find(item => item.qr_code === qrCode) || null;
    } catch (error) {
      console.error('Failed to get item by QR:', error);
      return null;
    }
  }

  async createItem(itemData: Omit<Item, '_id'>): Promise<string> {
    try {
      const items = await this.getAllItems();
      const newItem: Item = {
        _id: `item::${Date.now()}`,
        ...itemData
      };

      items.push(newItem);
      await AsyncStorage.setItem('items', JSON.stringify(items));
      return newItem._id;
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  }

  async getAllItems(): Promise<Item[]> {
    try {
      const itemsJson = await AsyncStorage.getItem('items');
      return itemsJson ? JSON.parse(itemsJson) : [];
    } catch (error) {
      console.error('Failed to get all items:', error);
      return [];
    }
  }

  // Shipment operations
  async getShipment(shipmentId: string): Promise<Shipment | null> {
    try {
      const shipmentsJson = await AsyncStorage.getItem('shipments');
      const shipments: Shipment[] = shipmentsJson ? JSON.parse(shipmentsJson) : [];
      return shipments.find(shipment => shipment._id === shipmentId) || null;
    } catch (error) {
      console.error('Failed to get shipment:', error);
      return null;
    }
  }

  async createShipment(shipmentData: Omit<Shipment, '_id' | 'created_at'>): Promise<string> {
    try {
      const shipmentsJson = await AsyncStorage.getItem('shipments');
      const shipments: Shipment[] = shipmentsJson ? JSON.parse(shipmentsJson) : [];
      
      const newShipment: Shipment = {
        _id: `shipment::${Date.now()}`,
        ...shipmentData,
        created_at: new Date().toISOString()
      };

      shipments.push(newShipment);
      await AsyncStorage.setItem('shipments', JSON.stringify(shipments));
      return newShipment._id;
    } catch (error) {
      console.error('Failed to create shipment:', error);
      throw error;
    }
  }

  // Sync operations (simplified for MVP)
  async markEventAsSynced(eventId: string): Promise<void> {
    try {
      const events = await this.getAllEvents();
      const eventIndex = events.findIndex(event => event._id === eventId);
      
      if (eventIndex !== -1) {
        events[eventIndex].synced = true;
        await AsyncStorage.setItem('events', JSON.stringify(events));
      }
    } catch (error) {
      console.error('Failed to mark event as synced:', error);
    }
  }

  async getSyncStatus(): Promise<{ synced: number; unsynced: number }> {
    try {
      const events = await this.getAllEvents();
      const synced = events.filter(event => event.synced).length;
      const unsynced = events.filter(event => !event.synced).length;
      
      return { synced, unsynced };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return { synced: 0, unsynced: 0 };
    }
  }

  // Simulate sync process
  async simulateSync(): Promise<void> {
    try {
      const unsyncedEvents = await this.getUnsyncedEvents();
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mark all unsynced events as synced
      for (const event of unsyncedEvents) {
        await this.markEventAsSynced(event._id);
      }
      
      console.log(`Synced ${unsyncedEvents.length} events`);
    } catch (error) {
      console.error('Failed to simulate sync:', error);
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const dataService = new DataService(); 