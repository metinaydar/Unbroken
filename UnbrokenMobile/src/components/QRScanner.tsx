import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';

interface QRScannerProps {
  onQRCodeScanned: (data: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onQRCodeScanned, onClose }) => {
  const handleQRCodeScanned = (event: { data: string }) => {
    console.log('QR Code scanned:', event.data);
    onQRCodeScanned(event.data);
  };

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error);
    Alert.alert('Scanner Error', 'Failed to access camera. Please check permissions.');
  };

  return (
    <View style={styles.container}>
      <QRCodeScanner
        onRead={handleQRCodeScanned}
        flashMode={RNCamera.Constants.FlashMode.auto}
        topContent={
          <Text style={styles.instructions}>
            Scan a QR code to track a package
          </Text>
        }
        bottomContent={
          <View style={styles.buttonContainer}>
            <Text style={styles.button} onPress={onClose}>
              Cancel
            </Text>
          </View>
        }
        containerStyle={styles.scannerContainer}
        cameraStyle={styles.camera}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  instructions: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    fontSize: 18,
    color: '#fff',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 10,
  },
});

export default QRScanner; 