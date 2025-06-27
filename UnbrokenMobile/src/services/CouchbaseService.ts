import { Database, MutableDocument } from 'cbl-reactnative';

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

class CouchbaseService {
  private database: Database | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Create or open the database
      this.database = new Database('logistics_local');
      
      // Create some sample data for MVP demo
      await this.createSampleData();
      
      this.isInitialized = true;
      console.log('Couchbase Lite initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Couchbase Lite:', error);
      throw error;
    }
  }

  private async createSampleData(): Promise<void> {
    if (!this.database) return;

    try {
      // Create sample shipment
      const shipmentDoc = new MutableDocument('shipment::demo-001');
      shipmentDoc.setString('type', 'shipment');
      shipmentDoc.setString('shipment_id', 'SHP-2024-001');
      shipmentDoc.setString('origin', 'Port of Gothenburg');
      shipmentDoc.setString('destination', 'Stockholm Warehouse');
      shipmentDoc.setArray('items', ['item::demo-001', 'item::demo-002']);
      shipmentDoc.setString('status', 'in_transit');
      shipmentDoc.setString('created_at', new Date().toISOString());
      shipmentDoc.setString('company_id', 'company::sme_medical');
      await this.database.save(shipmentDoc);

      // Create sample items
      const item1Doc = new MutableDocument('item::demo-001');
      item1Doc.setString('type', 'item');
      item1Doc.setString('item_id', 'MED-SUPPLY-001');
      item1Doc.setString('name', 'Medical Thermometers');
      item1Doc.setString('qr_code', 'QR-MED-001');
      item1Doc.setString('condition', 'good');
      item1Doc.setString('shipment_id', 'shipment::demo-001');
      await this.database.save(item1Doc);

      const item2Doc = new MutableDocument('item::demo-002');
      item2Doc.setString('type', 'item');
      item2Doc.setString('item_id', 'MED-SUPPLY-002');
      item2Doc.setString('name', 'First Aid Kits');
      item2Doc.setString('qr_code', 'QR-MED-002');
      item2Doc.setString('condition', 'good');
      item2Doc.setString('shipment_id', 'shipment::demo-001');
      await this.database.save(item2Doc);

      console.log('Sample data created successfully');
    } catch (error) {
      console.error('Failed to create sample data:', error);
    }
  }

  // Event operations
  async recordEvent(eventData: Omit<Event, '_id' | 'timestamp' | 'synced'>): Promise<string> {
    if (!this.database) throw new Error('Database not initialized');

    const eventDoc = new MutableDocument(`event::${Date.now()}`);
    eventDoc.setString('type', 'event');
    eventDoc.setString('shipment_id', eventData.shipment_id);
    eventDoc.setString('item_id', eventData.item_id);
    eventDoc.setString('event_type', eventData.event_type);
    eventDoc.setDictionary('location', eventData.location);
    eventDoc.setString('timestamp', new Date().toISOString());
    eventDoc.setString('user_id', eventData.user_id);
    eventDoc.setString('notes', eventData.notes || '');
    eventDoc.setBoolean('synced', false);
    
    await this.database.save(eventDoc);
    console.log('Event recorded:', eventDoc.getId());
    return eventDoc.getId();
  }

  async getUnsyncedEvents(): Promise<Event[]> {
    if (!this.database) return [];

    try {
      const query = this.database.createQuery(`
        SELECT * FROM logistics_local 
        WHERE type = 'event' AND synced = false 
        ORDER BY timestamp DESC
      `);
      
      const results = await query.execute();
      return results.map(row => row.toJSON() as Event);
    } catch (error) {
      console.error('Failed to get unsynced events:', error);
      return [];
    }
  }

  async getAllEvents(): Promise<Event[]> {
    if (!this.database) return [];

    try {
      const query = this.database.createQuery(`
        SELECT * FROM logistics_local 
        WHERE type = 'event' 
        ORDER BY timestamp DESC
      `);
      
      const results = await query.execute();
      return results.map(row => row.toJSON() as Event);
    } catch (error) {
      console.error('Failed to get all events:', error);
      return [];
    }
  }

  // Item operations
  async createItem(itemData: Omit<Item, '_id'>): Promise<string> {
    if (!this.database) throw new Error('Database not initialized');

    const itemDoc = new MutableDocument(`item::${Date.now()}`);
    itemDoc.setString('type', 'item');
    itemDoc.setString('item_id', itemData.item_id);
    itemDoc.setString('name', itemData.name);
    itemDoc.setString('qr_code', itemData.qr_code);
    itemDoc.setString('condition', itemData.condition);
    itemDoc.setString('shipment_id', itemData.shipment_id);
    
    await this.database.save(itemDoc);
    return itemDoc.getId();
  }

  async getItemByQR(qrCode: string): Promise<Item | null> {
    if (!this.database) return null;

    try {
      const query = this.database.createQuery(`
        SELECT * FROM logistics_local 
        WHERE type = 'item' AND qr_code = $qrCode
      `);
      
      query.setString('qrCode', qrCode);
      const results = await query.execute();
      
      if (results.length > 0) {
        return results[0].toJSON() as Item;
      }
      return null;
    } catch (error) {
      console.error('Failed to get item by QR:', error);
      return null;
    }
  }

  // Shipment operations
  async createShipment(shipmentData: Omit<Shipment, '_id' | 'created_at'>): Promise<string> {
    if (!this.database) throw new Error('Database not initialized');

    const shipmentDoc = new MutableDocument(`shipment::${Date.now()}`);
    shipmentDoc.setString('type', 'shipment');
    shipmentDoc.setString('shipment_id', shipmentData.shipment_id);
    shipmentDoc.setString('origin', shipmentData.origin);
    shipmentDoc.setString('destination', shipmentData.destination);
    shipmentDoc.setArray('items', shipmentData.items);
    shipmentDoc.setString('status', shipmentData.status);
    shipmentDoc.setString('created_at', new Date().toISOString());
    shipmentDoc.setString('company_id', shipmentData.company_id);
    
    await this.database.save(shipmentDoc);
    return shipmentDoc.getId();
  }

  async getShipment(shipmentId: string): Promise<Shipment | null> {
    if (!this.database) return null;

    try {
      const doc = await this.database.getDocument(shipmentId);
      if (doc) {
        return doc.toJSON() as Shipment;
      }
      return null;
    } catch (error) {
      console.error('Failed to get shipment:', error);
      return null;
    }
  }

  // Sync operations (simplified for MVP)
  async markEventAsSynced(eventId: string): Promise<void> {
    if (!this.database) return;

    try {
      const doc = await this.database.getDocument(eventId);
      if (doc) {
        const mutableDoc = doc.toMutable();
        mutableDoc.setBoolean('synced', true);
        await this.database.save(mutableDoc);
      }
    } catch (error) {
      console.error('Failed to mark event as synced:', error);
    }
  }

  async getSyncStatus(): Promise<{ synced: number; unsynced: number }> {
    if (!this.database) return { synced: 0, unsynced: 0 };

    try {
      const syncedQuery = this.database.createQuery(`
        SELECT COUNT(*) as count FROM logistics_local 
        WHERE type = 'event' AND synced = true
      `);
      
      const unsyncedQuery = this.database.createQuery(`
        SELECT COUNT(*) as count FROM logistics_local 
        WHERE type = 'event' AND synced = false
      `);
      
      const syncedResults = await syncedQuery.execute();
      const unsyncedResults = await unsyncedQuery.execute();
      
      return {
        synced: syncedResults[0]?.getInt('count') || 0,
        unsynced: unsyncedResults[0]?.getInt('count') || 0
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return { synced: 0, unsynced: 0 };
    }
  }

  // Cleanup
  async close(): Promise<void> {
    if (this.database) {
      await this.database.close();
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.database !== null;
  }
}

// Export singleton instance
export const couchbaseService = new CouchbaseService(); 