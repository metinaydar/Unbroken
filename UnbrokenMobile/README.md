# Unbroken Mobile App - MVP

A React Native mobile application demonstrating disaster-resilient logistics tracking using offline-first architecture.

## Features

### MVP Core Features
- **Role-based Interface**: Switch between Driver, Dock Worker, and Warehouse Manager roles
- **QR Code Scanning**: Scan QR codes to track packages and record handoff events
- **Offline Event Recording**: Record logistics events that are stored locally
- **Sync Simulation**: Simulate syncing offline events to the cloud
- **Real-time Status**: View sync status and event history

### Disaster Resilience Features
- **Offline Operation**: App works without internet connection
- **Local Data Storage**: All events stored locally using AsyncStorage
- **Sync Status Tracking**: Clear visibility of synced vs offline events
- **Conflict Resolution**: Timestamp-based conflict resolution for concurrent updates

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation Steps

1. **Install Dependencies**
   ```bash
   cd UnbrokenMobile
   npm install
   ```

2. **iOS Setup (macOS only)**
   ```bash
   cd ios
   bundle install
   bundle exec pod install
   cd ..
   ```

3. **Run the App**
   ```bash
   # For Android
   npx react-native run-android
   
   # For iOS
   npx react-native run-ios
   ```

## Usage

### Basic Operation

1. **Select Role**: Choose your role (Driver, Dock Worker, or Warehouse Manager)
2. **Scan QR Code**: Tap "Scan QR Code" to scan package QR codes
3. **Record Events**: Events are automatically recorded when scanning QR codes
4. **Manual Events**: Use "Record Manual Event" to create events without scanning
5. **Sync Data**: Tap "Sync Events" to simulate syncing offline data

### Demo QR Codes

The app includes sample data with these QR codes:
- `QR-MED-001` - Medical Thermometers
- `QR-MED-002` - First Aid Kits

### Testing Disaster Resilience Scenarios

#### Scenario 1: Network Outage Simulation
1. **Start the app** and record some events
2. **Disconnect network** (turn off WiFi/mobile data)
3. **Continue using the app** - scan QR codes and record events
4. **Verify offline operation** - events are stored locally
5. **Reconnect network** and tap "Sync Events"
6. **Verify sync** - all offline events are synced

#### Scenario 2: Data Center Failure Simulation
1. **Record events** while connected to network
2. **Simulate data center failure** (this is simulated in the app)
3. **Continue operations** - app continues working offline
4. **Verify data persistence** - all data remains accessible
5. **Simulate recovery** - tap "Sync Events" to restore connectivity

## Architecture

### Data Model
```typescript
interface Event {
  _id: string;
  type: 'event';
  shipment_id: string;
  item_id: string;
  event_type: 'pickup' | 'handoff' | 'delivery';
  location: { lat: number; lng: number; address: string };
  timestamp: string;
  user_id: string;
  notes?: string;
  synced: boolean;
}
```

### Components
- **App.tsx**: Main application component
- **QRScanner.tsx**: QR code scanning component
- **DataService.ts**: Data management and sync simulation

### Storage
- **AsyncStorage**: Local data persistence (MVP implementation)
- **Future**: Couchbase Lite integration for production

## Development

### Project Structure
```
UnbrokenMobile/
├── src/
│   ├── components/
│   │   └── QRScanner.tsx
│   └── services/
│       ├── CouchbaseService.ts (future)
│       └── DataService.ts
├── App.tsx
└── package.json
```

### Adding New Features

1. **New Event Types**: Add to the `event_type` union type in DataService.ts
2. **New Roles**: Add to the `roles` array in App.tsx
3. **New Data Fields**: Update the TypeScript interfaces

### Testing

#### Manual Testing
1. Test QR scanning with sample QR codes
2. Test offline operation by disabling network
3. Test sync functionality
4. Test role switching

#### Automated Testing (Future)
```bash
npm test
```

## Troubleshooting

### Common Issues

1. **Camera Permission Denied**
   - Ensure camera permissions are granted in device settings
   - Restart the app after granting permissions

2. **QR Scanner Not Working**
   - Check if camera is being used by another app
   - Ensure good lighting conditions
   - Try different QR codes

3. **Sync Issues**
   - Check network connectivity
   - Restart the app
   - Clear app data if needed

### Debug Mode
Enable debug logging by checking the console output:
```bash
npx react-native log-android  # Android
npx react-native log-ios      # iOS
```

## Future Enhancements

### Phase 2: Couchbase Lite Integration
- Replace AsyncStorage with Couchbase Lite
- Implement real sync with Sync Gateway
- Add conflict resolution

### Phase 3: Advanced Features
- GPS location tracking
- Photo capture for condition documentation
- Real-time notifications
- Advanced analytics

### Phase 4: Production Features
- Multi-node cluster support
- Advanced security
- Performance optimization
- Comprehensive testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Couchbase Disaster Resilience Hackathon.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console logs
3. Create an issue in the repository
