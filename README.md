# Unbroken 🚢 📦 ⚯
Team Chaos Coders for Couchbase Disaster Resilience Hackathon

# Work in Progress with a tech-stack of the tools:
- Couchbase as the multipurpose NoSQL database for transactional, analytical, mobile, and AI applications.
- Claude with `Sonnet 4` model for faster ideation of system architecture
- Firebase Studio for web and mobile application creation
- ...


# Unbroken: Disaster-Resilient Logistics Tracker - PoC Architecture

## Overview
Unbroken is a disaster-resilient logistics tracking system that maintains visibility and coordination across supply chain handoffs, even during network outages and system failures. Built on Couchbase's offline-first architecture, it ensures critical logistics data is never lost.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUD INFRASTRUCTURE                     │
├─────────────────────────────────────────────────────────────┤
│  Primary Data Center (Stockholm)                            │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Couchbase       │  │ Sync Gateway    │                   │
│  │ Server Cluster  │◄─┤ (Load Balanced) │                   │
│  │                 │  │                 │                   │
│  └─────────────────┘  └─────────────────┘                   │
│           │                     │                           │
│           ▼                     ▼                           │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Web Dashboard   │  │ Analytics &     │                   │
│  │ (Management)    │  │ Reporting API   │                   │
│  └─────────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  Disaster Recovery Data Center (Gothenburg)                 │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ Couchbase       │  │ Sync Gateway    │                   │
│  │ Server (Replica)│◄─┤ (Standby)       │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │ 
                    Cross-Data Center Replication
                    (XDCR with Auto-Failover)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    EDGE DEVICES (OFFLINE-FIRST)             │
├─────────────────────────────────────────────────────────────┤
│  Mobile Apps with Couchbase Lite                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Driver App   │ │ Dock Worker  │ │ Warehouse    │         │
│  │              │ │ App          │ │ Manager App  │         │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │         │
│  │ │Couchbase │ │ │ │Couchbase │ │ │ │Couchbase │ │         │
│  │ │Lite DB   │ │ │ │Lite DB   │ │ │ │Lite DB   │ │         │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│         │                 │                 │               │
│    RFID/QR Scanner   RFID/QR Scanner   RFID/QR Scanner      │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Mobile Applications (Offline-First)
**Technology Stack:**
- React Native/Flutter with Couchbase Lite
- RFID/QR code scanning capabilities
- GPS location services
- Camera for condition documentation

**Key Features:**
- Offline data capture and storage
- Automatic sync when connectivity available
- Role-based UI (Driver, Dock Worker, Warehouse Manager)
- Real-time status indicators

#### 2. Couchbase Lite (Local Database)
**Purpose:** Local data persistence and offline capabilities
- Embedded NoSQL database on each mobile device
- Stores logistics events, item data, and sync metadata
- Conflict resolution for concurrent updates
- Automatic replication to Sync Gateway

#### 3. Sync Gateway (Synchronization Layer)
**Purpose:** Manages data synchronization between mobile apps and server
- Handles authentication and access control
- Manages conflict resolution
- Supports selective sync (user/role-based data filtering)
- Load balanced for high availability

#### 4. Couchbase Server Cluster (Central Database)
**Purpose:** Central data repository and analytics
- Multi-node cluster for high availability
- Real-time indexing and querying
- Cross-data center replication (XDCR)
- Analytics and reporting capabilities

### Data Model

#### Core Entities

```json
{
  "shipment": {
    "_id": "shipment::12345",
    "type": "shipment",
    "shipment_id": "SHP-2024-001",
    "origin": "Port of Gothenburg",
    "destination": "Stockholm Warehouse",
    "items": ["item::001", "item::002"],
    "status": "in_transit",
    "created_at": "2024-06-27T10:00:00Z",
    "company_id": "company::sme_medical"
  },
  
  "item": {
    "_id": "item::001",
    "type": "item",
    "item_id": "MED-SUPPLY-001",
    "name": "Medical Thermometers",
    "rfid_tag": "RFID123456789",
    "qr_code": "QR-MED-001",
    "condition": "good",
    "temperature_sensitive": true,
    "shipment_id": "shipment::12345"
  },
  
  "event": {
    "_id": "event::uuid-001",
    "type": "event",
    "shipment_id": "shipment::12345",
    "item_id": "item::001",
    "event_type": "handoff",
    "location": {
      "lat": 57.7089,
      "lng": 11.9746,
      "address": "Port of Gothenburg"
    },
    "timestamp": "2024-06-27T14:30:00Z",
    "user_id": "user::dock_worker_01",
    "notes": "Package condition verified",
    "photos": ["photo_url_1"],
    "next_handler": "driver::truck_001",
    "synced": false
  }
}
```

### Synchronization Strategy

#### 1. Conflict Resolution
- **Last-Write-Wins:** For status updates and location data
- **Merge Strategy:** For cumulative data (event logs)
- **Custom Resolution:** For critical handoff conflicts

#### 2. Selective Sync
- Users only sync data relevant to their role and location
- Company-based data isolation
- Route-based filtering for drivers

#### 3. Sync Triggers
- **Immediate:** When network is available and data is critical
- **Scheduled:** Every 5 minutes for routine updates
- **Manual:** User-initiated sync for important handoffs

### Disaster Resilience Features (Jury Criteria Implementation)

#### 1. Data Center Failure Handling (Jury Criterion #1)
**Implementation using Couchbase XDCR:**

```yaml
# Primary Cluster Configuration (Stockholm)
primary_cluster:
  nodes: 3
  endpoint: "stockholm.unbroken.com"
  buckets: ["logistics", "users", "analytics"]
  
# Replica Cluster Configuration (Gothenburg)  
replica_cluster:
  nodes: 2
  endpoint: "gothenburg.unbroken.com"
  buckets: ["logistics", "users", "analytics"]

# XDCR Setup
xdcr_replication:
  direction: "bidirectional"
  conflict_resolution: "sequence_number" # Last-write-wins
  replication_lag_target: "<1 second"
  auto_failover: true
  failover_timeout: "30 seconds"
```

**Automatic Failover Process:**
1. **Health Monitoring**: Continuous health checks every 10 seconds
2. **Failure Detection**: If primary cluster unreachable for 30 seconds
3. **DNS Failover**: Automatic DNS switch to replica cluster
4. **App Reconnection**: Mobile apps automatically reconnect via Sync Gateway
5. **Seamless Operation**: Users continue working without interruption
6. **Automatic Recovery**: When primary recovers, bidirectional sync resumes

**Demo Implementation:**
```javascript
// Sync Gateway Configuration with Failover
{
  "databases": {
    "logistics": {
      "server": "couchbase://stockholm.unbroken.com,gothenburg.unbroken.com",
      "bucket": "logistics",
      "auto_import": true,
      "enable_shared_bucket_access": true,
      "delta_sync": {
        "enabled": true
      }
    }
  },
  "cluster_config": {
    "server": "couchbase://stockholm.unbroken.com",
    "data_dir": "./data",
    "heartbeat_interval_seconds": 10,
    "server_tls_skip_verify": false
  }
}
```

#### 2. Network Outage Handling (Jury Criterion #2)
**Implementation using Couchbase Lite + Capella App Services:**

**Mobile App Offline Persistence:**
```javascript
// React Native Implementation
import {Database, MutableDocument, Replicator} from 'couchbase-lite-react-native';

class LogisticsTracker {
  constructor() {
    this.database = new Database('logistics_local');
    this.setupReplication();
  }

  // Automatic bidirectional sync with conflict handling
  setupReplication() {
    const config = {
      database: this.database,
      target: 'wss://sync.unbroken.com/logistics',
      replicatorType: 'PUSH_AND_PULL',
      continuous: true,
      authenticator: this.getAuthenticator(),
      
      // Conflict Resolution Strategy
      conflictResolver: (conflict) => {
        // Custom resolution for logistics events
        if (conflict.documentID.startsWith('event::')) {
          return this.resolveEventConflict(conflict);
        }
        // Default to remote wins for other documents
        return conflict.remoteDocument;
      }
    };
    
    this.replicator = new Replicator(config);
    this.replicator.start();
  }

  // Offline data capture - works without network
  async recordHandoff(itemId, location, notes) {
    const eventDoc = new MutableDocument(`event::${Date.now()}`);
    eventDoc.setString('type', 'handoff');
    eventDoc.setString('item_id', itemId);
    eventDoc.setDictionary('location', location);
    eventDoc.setString('notes', notes);
    eventDoc.setDate('timestamp', new Date());
    eventDoc.setString('user_id', this.getCurrentUser());
    eventDoc.setBoolean('synced', false);
    
    // Saves locally immediately, syncs when network available
    await this.database.save(eventDoc);
    
    return eventDoc.getId();
  }
}
```

**Conflict Resolution Strategy:**
```javascript
resolveEventConflict(conflict) {
  const local = conflict.localDocument;
  const remote = conflict.remoteDocument;
  
  // For handoff events, merge both versions
  if (local.getString('event_type') === 'handoff' && 
      remote.getString('event_type') === 'handoff') {
    
    const merged = new MutableDocument(conflict.documentID);
    
    // Keep the earlier timestamp
    const localTime = local.getDate('timestamp');
    const remoteTime = remote.getDate('timestamp');
    
    if (localTime < remoteTime) {
      merged.setData(local.getData());
      merged.setString('conflict_resolved', 'local_timestamp_earlier');
    } else {
      merged.setData(remote.getData());
      merged.setString('conflict_resolved', 'remote_timestamp_earlier');
    }
    
    // Add conflict metadata
    merged.setString('original_conflict_id', conflict.documentID);
    merged.setDate('conflict_resolved_at', new Date());
    
    return merged;
  }
  
  // Default to remote document for other conflicts
  return remote;
}
```

#### 3. Network Recovery & Sync Verification
**Automatic Sync Process:**
1. **Connection Detection**: Monitor network state changes
2. **Sync Initialization**: Automatically start replication when online
3. **Conflict Resolution**: Handle concurrent updates using defined strategies
4. **Verification**: Confirm all offline data successfully synced
5. **User Notification**: Inform users of sync status and any conflicts

**Demo Verification Points:**
```javascript
// Network state monitoring
class NetworkManager {
  constructor(replicator) {
    this.replicator = replicator;
    this.setupNetworkListeners();
  }
  
  setupNetworkListeners() {
    // Monitor connection changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.replicator.isRunning()) {
        console.log('Network restored - starting sync');
        this.replicator.start();
        this.verifyPendingSync();
      }
    });
  }
  
  async verifyPendingSync() {
    // Query for unsynced documents
    const query = this.database.createQuery(
      'SELECT * FROM logistics WHERE synced = false'
    );
    
    const results = await query.execute();
    console.log(`${results.length} documents pending sync`);
    
    // Monitor sync progress
    this.replicator.addChangeListener((change) => {
      if (change.status.error) {
        console.error('Sync error:', change.status.error);
      } else {
        console.log(`Sync progress: ${change.status.progress.completed}/${change.status.progress.total}`);
      }
    });
  }
}
```

### PoC Implementation Plan

#### Phase 1: Core Offline Functionality (Week 1-2)
1. **Mobile App Setup**
   - React Native app with Couchbase Lite integration
   - Basic RFID/QR scanning functionality
   - Offline-first data capture forms
   - **Jury Criterion Focus**: Implement robust offline persistence

2. **Local Conflict Resolution**
   - Implement timestamp-based conflict resolution
   - Event merging strategies for handoff conflicts
   - Local data validation and integrity checks

#### Phase 2: Synchronization & Network Resilience (Week 3)
1. **Sync Gateway Configuration**
   - Bidirectional sync with Capella App Services
   - Role-based channel access control
   - **Jury Criterion Focus**: Automatic sync restoration after network outages

2. **Conflict Resolution Testing**
   - Simulate concurrent offline updates
   - Verify automatic conflict resolution
   - Test sync verification and user notifications

#### Phase 3: Data Center Failover (Week 4)
1. **XDCR Implementation**
   - Set up bidirectional replication between clusters
   - Configure automatic failover detection
   - **Jury Criterion Focus**: Seamless data center failover

2. **End-to-End Resilience Testing**
   - Combined failure scenarios (network + data center)
   - Performance under stress conditions
   - Full recovery verification

#### Phase 4: Jury Demo Preparation (Final Days)
1. **Demo Script Creation**
   - Rehearse specific jury test scenarios
   - Prepare clear success criteria demonstrations
   - Create monitoring dashboards for real-time verification

2. **Performance Optimization**
   - Optimize sync times and conflict resolution
   - Ensure sub-30-second failover times
   - Stress test with multiple concurrent users

### Jury Demo Scenarios (Specific Test Cases)

#### Jury Test #1: Data Center Failure Simulation
**Setup:**
- Primary cluster running in Stockholm (simulated)
- Replica cluster running in Gothenburg (simulated)
- Mobile app connected and actively tracking shipments
- XDCR bidirectional replication active

**Test Execution:**
1. **Pre-Failure State**: Show active tracking with 3 users updating different shipments
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

#### Jury Test #2: Network Outage Simulation
**Setup:**
- 3 mobile devices with different user roles (driver, dock worker, warehouse)
- Each device has Couchbase Lite with pending and synced data
- All devices initially connected and synchronized

**Test Execution:**
1. **Disconnect Network**: Simulate complete network outage for all devices
2. **Offline Operations**: 
   - Driver scans 5 new package pickups
   - Dock worker logs 3 handoffs with condition updates
   - Warehouse manager records 2 damage reports
3. **Create Conflicts**: Same package updated by multiple users offline
4. **Restore Network**: Reconnect all devices simultaneously
5. **Automatic Sync**: Verify bidirectional sync begins immediately
6. **Conflict Resolution**: Show how conflicts are automatically resolved

**Success Criteria:**
- ✅ All offline operations saved locally
- ✅ Automatic sync initiation upon network restoration
- ✅ Conflicts resolved using defined strategies (timestamp-based for events)
- ✅ Final state consistent across all devices
- ✅ User notification of sync completion and conflict resolution

#### Jury Test #3: Combined Failure Scenario
**The Ultimate Resilience Test:**
1. **Start with Network Outage**: All mobile apps offline
2. **Add Data Center Failure**: Primary cluster goes down while apps offline
3. **Partial Network Recovery**: Some apps come online, connect to backup cluster
4. **Full Recovery**: Remaining apps come online, primary cluster restored
5. **Verification**: All data eventually consistent across all nodes

**Real-World Context:**
*"A port strike cuts communications while a data center fire hits Stockholm. Dock workers continue logging arrivals offline. When backup systems activate and networks partially restore, truck drivers get updates. Full recovery shows complete supply chain visibility maintained throughout the disaster."*

### Technical Specifications

#### Mobile App Requirements
- **OS Support:** iOS 12+, Android 8+
- **Storage:** 100MB local database capacity
- **Sensors:** Camera, GPS, NFC/RFID reader
- **Connectivity:** WiFi, 4G/5G, Bluetooth

#### Server Requirements
- **Primary DC:** 3-node Couchbase cluster (16 cores, 64GB RAM each)
- **DR DC:** 2-node Couchbase cluster (8 cores, 32GB RAM each)
- **Storage:** 1TB SSD per node (with backup to cloud)
- **Network:** 1Gbps connectivity, VPN between DCs

### Success Metrics (Aligned with Jury Criteria)

#### Jury Criterion #1: Data Center Failure Resilience
- **Failover Time**: <30 seconds automatic failover detection and recovery
- **Data Consistency**: 100% data consistency across clusters during failover
- **Service Continuity**: 0 user-visible service interruptions during failover
- **Recovery Time**: <60 seconds for full bidirectional sync restoration

#### Jury Criterion #2: Network Outage Resilience  
- **Offline Duration**: Unlimited offline operation capability
- **Sync Completion**: 100% of offline data successfully synchronized
- **Conflict Resolution**: Automatic resolution of 100% of conflicts without data loss
- **Sync Speed**: <30 seconds for critical logistics events to sync after reconnection

#### Business Impact Metrics
- **Visibility Improvement**: 100% tracking coverage during disasters
- **Cost Reduction**: 15% reduction in lost shipment costs for SMEs
- **Response Time**: 50% faster incident response during supply chain disruptions
- **User Adoption**: 90% user satisfaction in disaster scenarios

#### Technical Performance Metrics
- **Database Performance**: <100ms response time for local queries
- **Sync Throughput**: Handle 1000+ concurrent document updates
- **Storage Efficiency**: <10MB local storage per user for 30-day operation
- **Battery Impact**: <5% additional battery drain for background sync

### Future Enhancements

1. **AI-Powered Predictions**
   - Delay prediction based on historical data
   - Route optimization during disruptions
   - Predictive maintenance alerts

2. **IoT Integration**
   - Temperature/humidity sensors
   - Shock detection for fragile items
   - Automated condition reporting

3. **Blockchain Integration**
   - Immutable audit trail
   - Smart contracts for automatic payments
   - Multi-party supply chain verification

4. **Advanced Analytics**
   - Supply chain bottleneck identification
   - Performance benchmarking
   - Predictive risk assessment

This architecture ensures that small businesses maintain complete visibility and control over their logistics operations, even during the most challenging disaster scenarios, while leveraging Couchbase's proven offline-first capabilities.
