# Unbroken 🚢 📦 ⚯
Team Chaos Coders for Couchbase Disaster Resilience Hackathon

# MVP Tech Stack:
- **Mobile**: React Native with TypeScript + Couchbase Lite
- **Backend**: Couchbase Server (single-node clusters) + Sync Gateway
- **Cloud**: Couchbase Capella for managed infrastructure
- **Development**: Firebase Studio for rapid prototyping
- **AI co-workers**: Claude Sonnet 4, Cursor, Firebase Studio, ...

# Unbroken: Disaster-Resilient Logistics Tracker - MVP Architecture

## Overview
Unbroken is a disaster-resilient logistics tracking system that maintains visibility and coordination across supply chain handoffs, even during network outages and system failures. This MVP focuses on proving core disaster resilience concepts using Couchbase's offline-first architecture.

## MVP System Architecture

### Simplified High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUD INFRASTRUCTURE (MVP)               │
├─────────────────────────────────────────────────────────────┤
│  Primary Data Center (Stockholm)                            │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Couchbase       │  │ Sync Gateway    │                   │
│  │ Server          │◄─┤ (Single Node)   │                   │
│  │ (Single Node)   │  │                 │                   │
│  └─────────────────┘  └─────────────────┘                   │
│           │                     │                           │
│           ▼                     ▼                           │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Web Dashboard   │  │ Analytics API   │                   │
│  │ (Management)    │  │ (Basic)         │                   │
│  └─────────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  Disaster Recovery Data Center (Gothenburg)                 │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Couchbase       │  │ Sync Gateway    │                   │
│  │ Server          │◄─┤ (Standby)       │                   │
│  │ (Single Node)   │  │                 │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │ 
                    Cross-Data Center Replication
                    (XDCR - Bidirectional)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APPS (MVP)                        │
├─────────────────────────────────────────────────────────────┤
│  React Native + TypeScript + Couchbase Lite                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Driver App   │ │ Dock Worker  │ │ Warehouse    │         │
│  │              │ │ App          │ │ Manager App  │         │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │         │
│  │ │Couchbase │ │ │ │Couchbase │ │ │ │Couchbase │ │         │
│  │ │Lite DB   │ │ │ │Lite DB   │ │ │ │Lite DB   │ │         │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│         │                 │                 │               │
│    QR Scanner         QR Scanner        QR Scanner          │
└─────────────────────────────────────────────────────────────┘
```

### MVP Core Components

#### 1. Mobile Applications (React Native + TypeScript)
**Technology Stack:**
- React Native with TypeScript for type safety
- Couchbase Lite for local database
- React Native Camera for QR code scanning
- React Native Geolocation for GPS services

**Key Features (MVP):**
- Offline data capture and storage
- Automatic sync when connectivity available
- Role-based UI (Driver, Dock Worker, Warehouse Manager)
- Basic QR code scanning for package tracking

#### 2. Couchbase Lite (Local Database)
**Purpose:** Local data persistence and offline capabilities
- Embedded NoSQL database on each mobile device
- Stores logistics events, item data, and sync metadata
- Basic conflict resolution for concurrent updates
- Automatic replication to Sync Gateway

#### 3. Sync Gateway (Synchronization Layer)
**Purpose:** Manages data synchronization between mobile apps and server
- Handles authentication and access control
- Manages basic conflict resolution
- Supports selective sync (user/role-based data filtering)
- Single-node deployment for MVP

#### 4. Couchbase Server (Central Database)
**Purpose:** Central data repository and analytics
- Single-node cluster for MVP simplicity
- Real-time indexing and querying
- Cross-data center replication (XDCR)
- Basic analytics capabilities

### MVP Data Model

#### Core Entities (Simplified)

```typescript
// TypeScript interfaces for type safety
interface Shipment {
  _id: string; // "shipment::12345"
  type: "shipment";
  shipment_id: string; // "SHP-2024-001"
  origin: string;
  destination: string;
  items: string[]; // Array of item IDs
  status: "pending" | "in_transit" | "delivered";
  created_at: string;
  company_id: string;
}

interface Item {
  _id: string; // "item::001"
  type: "item";
  item_id: string; // "MED-SUPPLY-001"
  name: string;
  qr_code: string;
  condition: "good" | "damaged" | "lost";
  shipment_id: string;
}

interface Event {
  _id: string; // "event::uuid-001"
  type: "event";
  shipment_id: string;
  item_id: string;
  event_type: "pickup" | "handoff" | "delivery";
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
```

### MVP Synchronization Strategy

#### 1. Basic Conflict Resolution
- **Last-Write-Wins:** For status updates and location data
- **Timestamp-based:** For event conflicts
- **Simple Merge:** For cumulative data (event logs)

#### 2. Selective Sync (MVP)
- Users only sync data relevant to their role
- Company-based data isolation
- Basic route-based filtering for drivers

#### 3. Sync Triggers
- **Immediate:** When network is available and data is critical
- **Scheduled:** Every 5 minutes for routine updates
- **Manual:** User-initiated sync for important handoffs

### MVP Disaster Resilience Features

#### 1. Data Center Failure Handling (Jury Criterion #1)
**Implementation using Couchbase XDCR:**

```yaml
# Primary Cluster Configuration (Stockholm) - MVP
primary_cluster:
  nodes: 1  # Single node for MVP
  endpoint: "stockholm.unbroken.com"
  buckets: ["logistics", "users"]
  
# Replica Cluster Configuration (Gothenburg) - MVP
replica_cluster:
  nodes: 1  # Single node for MVP
  endpoint: "gothenburg.unbroken.com"
  buckets: ["logistics", "users"]

# XDCR Setup
xdcr_replication:
  direction: "bidirectional"
  conflict_resolution: "sequence_number"
  replication_lag_target: "<5 seconds"  # Relaxed for MVP
  auto_failover: true
  failover_timeout: "30 seconds"
```

**Automatic Failover Process:**
1. **Health Monitoring**: Continuous health checks every 15 seconds
2. **Failure Detection**: If primary cluster unreachable for 30 seconds
3. **DNS Failover**: Automatic DNS switch to replica cluster
4. **App Reconnection**: Mobile apps automatically reconnect via Sync Gateway
5. **Seamless Operation**: Users continue working without interruption

#### 2. Network Outage Handling (Jury Criterion #2)
**Implementation using React Native + Couchbase Lite:**

```typescript
// React Native + TypeScript Implementation
import { Database, MutableDocument, Replicator } from 'couchbase-lite-react-native';
import NetInfo from '@react-native-async-storage/async-storage';

class LogisticsTracker {
  private database: Database;
  private replicator: Replicator;

  constructor() {
    this.database = new Database('logistics_local');
    this.setupReplication();
  }

  // Automatic bidirectional sync with conflict handling
  private setupReplication(): void {
    const config = {
      database: this.database,
      target: 'wss://sync.unbroken.com/logistics',
      replicatorType: 'PUSH_AND_PULL',
      continuous: true,
      authenticator: this.getAuthenticator(),
      
      // Basic Conflict Resolution Strategy
      conflictResolver: (conflict: any) => {
        return this.resolveConflict(conflict);
      }
    };
    
    this.replicator = new Replicator(config);
    this.replicator.start();
  }

  // Offline data capture - works without network
  async recordHandoff(itemId: string, location: any, notes?: string): Promise<string> {
    const eventDoc = new MutableDocument(`event::${Date.now()}`);
    eventDoc.setString('type', 'event');
    eventDoc.setString('event_type', 'handoff');
    eventDoc.setString('item_id', itemId);
    eventDoc.setDictionary('location', location);
    eventDoc.setString('notes', notes || '');
    eventDoc.setDate('timestamp', new Date());
    eventDoc.setString('user_id', this.getCurrentUser());
    eventDoc.setBoolean('synced', false);
    
    // Saves locally immediately, syncs when network available
    await this.database.save(eventDoc);
    
    return eventDoc.getId();
  }

  private resolveConflict(conflict: any): any {
    const local = conflict.localDocument;
    const remote = conflict.remoteDocument;
    
    // For events, use timestamp-based resolution
    if (local.getString('type') === 'event' && 
        remote.getString('type') === 'event') {
      
      const localTime = new Date(local.getString('timestamp'));
      const remoteTime = new Date(remote.getString('timestamp'));
      
      // Return the document with the earlier timestamp
      return localTime < remoteTime ? local : remote;
    }
    
    // Default to remote document for other conflicts
    return remote;
  }
}
```

### MVP Implementation Plan

#### Phase 1: Core Offline Functionality
1. **React Native App Setup**
   - React Native + TypeScript project setup
   - Couchbase Lite integration
   - Basic QR scanning functionality
   - Offline-first data capture forms
   - **Jury Criterion Focus**: Implement robust offline persistence

2. **Local Conflict Resolution**
   - Implement timestamp-based conflict resolution
   - Basic event merging strategies
   - Local data validation

#### Phase 2: Synchronization & Network Resilience
1. **Sync Gateway Configuration**
   - Bidirectional sync with Capella App Services
   - Role-based channel access control
   - **Jury Criterion Focus**: Automatic sync restoration after network outages

2. **Conflict Resolution Testing**
   - Simulate concurrent offline updates
   - Verify automatic conflict resolution
   - Test sync verification

#### Phase 3: Data Center Failover
1. **XDCR Implementation**
   - Set up bidirectional replication between single-node clusters
   - Configure automatic failover detection
   - **Jury Criterion Focus**: Seamless data center failover

2. **End-to-End Resilience Testing**
   - Combined failure scenarios
   - Performance under stress conditions
   - Full recovery verification

#### Phase 4: Demo Preparation
1. **Demo Script Creation**
   - Rehearse specific jury test scenarios
   - Prepare clear success criteria demonstrations
   - Create monitoring dashboards

2. **Performance Optimization**
   - Optimize sync times and conflict resolution
   - Ensure sub-30-second failover times
   - Stress test with multiple concurrent users

### MVP Jury Demo Scenarios

#### Jury Test #1: Data Center Failure Simulation (MVP)
**Setup:**
- Single-node primary cluster in Stockholm
- Single-node replica cluster in Gothenburg
- Mobile app connected and actively tracking shipments
- XDCR bidirectional replication active

**Test Execution:**
1. **Pre-Failure State**: Show active tracking with 2 users updating different shipments
2. **Simulate Failure**: Shut down primary Stockholm cluster
3. **Automatic Failover**: Within 30 seconds, apps reconnect to Gothenburg replica
4. **Continued Operation**: Users continue scanning/updating without interruption
5. **Data Verification**: All data remains accessible and consistent
6. **Recovery**: Restart Stockholm cluster, verify bidirectional sync resumes

**Success Criteria:**
- ✅ Zero data loss during failover
- ✅ Apps reconnect automatically within 30 seconds  
- ✅ Users can continue all operations seamlessly
- ✅ Bidirectional sync resumes automatically on recovery

#### Jury Test #2: Network Outage Simulation (MVP)
**Setup:**
- 2 mobile devices with different user roles (driver, dock worker)
- Each device has Couchbase Lite with pending and synced data
- All devices initially connected and synchronized

**Test Execution:**
1. **Disconnect Network**: Simulate complete network outage for all devices
2. **Offline Operations**: 
   - Driver scans 3 new package pickups
   - Dock worker logs 2 handoffs with condition updates
3. **Create Conflicts**: Same package updated by both users offline
4. **Restore Network**: Reconnect all devices simultaneously
5. **Automatic Sync**: Verify bidirectional sync begins immediately
6. **Conflict Resolution**: Show how conflicts are automatically resolved

**Success Criteria:**
- ✅ All offline operations saved locally
- ✅ Automatic sync initiation upon network restoration
- ✅ Conflicts resolved using timestamp-based strategy
- ✅ Final state consistent across all devices
- ✅ User notification of sync completion

### MVP Technical Specifications

#### Mobile App Requirements
- **Framework:** React Native with TypeScript
- **OS Support:** iOS 12+, Android 8+
- **Storage:** 50MB local database capacity
- **Sensors:** Camera (QR scanning), GPS
- **Connectivity:** WiFi, 4G/5G

#### Server Requirements (MVP)
- **Primary DC:** Single-node Couchbase cluster (8 cores, 32GB RAM)
- **DR DC:** Single-node Couchbase cluster (8 cores, 32GB RAM)
- **Storage:** 500GB SSD per node
- **Network:** 1Gbps connectivity, VPN between DCs

### MVP Success Metrics

#### Jury Criterion #1: Data Center Failure Resilience
- **Failover Time**: <30 seconds automatic failover detection and recovery
- **Data Consistency**: 100% data consistency across clusters during failover
- **Service Continuity**: 0 user-visible service interruptions during failover

#### Jury Criterion #2: Network Outage Resilience  
- **Offline Duration**: Unlimited offline operation capability
- **Sync Completion**: 100% of offline data successfully synchronized
- **Conflict Resolution**: Automatic resolution of 100% of conflicts without data loss
- **Sync Speed**: <30 seconds for critical logistics events to sync after reconnection

#### MVP Business Impact Metrics
- **Visibility Improvement**: 100% tracking coverage during disasters
- **Response Time**: 50% faster incident response during supply chain disruptions
- **User Adoption**: 90% user satisfaction in disaster scenarios

### MVP Future Enhancements

1. **Multi-node Clusters**: Scale to production-grade infrastructure
2. **Advanced Analytics**: Add reporting and dashboard capabilities
3. **IoT Integration**: Temperature/humidity sensors for sensitive items
4. **AI-Powered Predictions**: Delay prediction and route optimization

This MVP architecture ensures that small businesses maintain complete visibility and control over their logistics operations during disasters, while keeping the implementation simple and focused for the hackathon demo.
