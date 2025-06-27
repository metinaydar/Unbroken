# Unbroken
Team Chaos Coders for Couchbase Disaster Resilience Hackathon


# Unbroken: Disaster-Resilient Logistics Tracker - PoC Architecture

## Overview
Unbroken is a disaster-resilient logistics tracking system that maintains visibility and coordination across supply chain handoffs, even during network outages and system failures. Built on Couchbase's offline-first architecture, it ensures critical logistics data is never lost.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUD INFRASTRUCTURE                     │
├─────────────────────────────────────────────────────────────┤
│  Primary Data Center (Stockholm)                           │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Couchbase       │  │ Sync Gateway    │                 │
│  │ Server Cluster  │◄─┤ (Load Balanced) │                 │
│  │                 │  │                 │                 │
│  └─────────────────┘  └─────────────────┘                 │
│           │                     │                          │
│           ▼                     ▼                          │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Web Dashboard   │  │ Analytics &     │                 │
│  │ (Management)    │  │ Reporting API   │                 │
│  └─────────────────┘  └─────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│  Disaster Recovery Data Center (Gothenburg)                │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Couchbase       │  │ Sync Gateway    │                 │
│  │ Server (Replica)│◄─┤ (Standby)       │                 │
│  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                              │ 
                    Cross-Data Center Replication
                    (XDCR with Auto-Failover)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    EDGE DEVICES (OFFLINE-FIRST)             │
├─────────────────────────────────────────────────────────────┤
│  Mobile Apps with Couchbase Lite                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Driver App   │ │ Dock Worker  │ │ Warehouse    │        │
│  │              │ │ App          │ │ Manager App  │        │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │        │
│  │ │Couchbase │ │ │ │Couchbase │ │ │ │Couchbase │ │        │
│  │ │Lite DB   │ │ │ │Lite DB   │ │ │ │Lite DB   │ │        │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│         │                 │                 │              │
│    RFID/QR Scanner   RFID/QR Scanner   RFID/QR Scanner     │
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

### Disaster Resilience Features

#### 1. Cross-Data Center Replication (XDCR)
```
Primary DC (Stockholm) ←→ DR DC (Gothenburg)
- Bidirectional replication
- Automatic failover detection
- Sub-second RPO in normal conditions
- Automatic conflict resolution
```

#### 2. Network Partition Handling
- Apps continue functioning offline indefinitely
- Local conflict resolution until sync possible
- Priority queuing for critical updates
- Graceful degradation of non-essential features

#### 3. Data Recovery
- Point-in-time recovery capabilities
- Audit trail of all changes
- Backup to cloud storage (encrypted)

### PoC Implementation Plan

#### Phase 1: Core Offline Functionality (Week 1-2)
1. **Mobile App Setup**
   - React Native app with Couchbase Lite integration
   - Basic RFID/QR scanning
   - Offline data capture forms

2. **Local Data Management**
   - Implement core data models
   - Local conflict resolution
   - Basic sync preparation

#### Phase 2: Synchronization (Week 3)
1. **Sync Gateway Configuration**
   - Set up authentication
   - Configure sync channels
   - Implement role-based access

2. **Server Setup**
   - Single-node Couchbase Server
   - Basic web dashboard
   - Sync testing

#### Phase 3: Multi-User & Resilience (Week 4)
1. **Multi-User Testing**
   - Simulate handoff scenarios
   - Test conflict resolution
   - Performance optimization

2. **Disaster Simulation**
   - Network partition testing
   - Data recovery scenarios
   - Cross-data center failover

### Demo Scenarios

#### Scenario 1: Port Strike (Network Down)
1. Medical supplies arrive at port during communication blackout
2. Dock worker scans items offline, records condition and photos
3. Truck driver picks up shipment, scans transfer offline
4. When network returns, all events sync automatically
5. Warehouse receives real-time update of incoming shipment

#### Scenario 2: Rural Delivery (Intermittent Connectivity)
1. Driver in remote area delivers to farm cooperative
2. Scans packages offline, gets GPS location
3. Intermittent network allows partial sync
4. Full sync completes when driver returns to coverage area
5. Customer receives delivery confirmation immediately upon sync

#### Scenario 3: Data Center Failure
1. Primary Stockholm data center goes offline
2. Automatic failover to Gothenburg DC
3. Mobile apps seamlessly reconnect to backup
4. No data loss, minimal service interruption
5. Automatic recovery when primary DC restored

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

### Success Metrics

#### Operational Metrics
- **Uptime:** 99.9% availability target
- **Sync Performance:** <30 seconds for critical updates
- **Offline Duration:** Unlimited offline operation
- **Data Integrity:** Zero data loss during network failures

#### Business Metrics
- **Visibility Improvement:** 100% tracking coverage during disasters
- **Cost Reduction:** 15% reduction in lost shipment costs
- **Response Time:** 50% faster incident response
- **User Adoption:** 90% user satisfaction in disaster scenarios

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
