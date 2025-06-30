import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/providers/AuthContext';
import { router } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileScreen() {
  const [username, setUsername] = useState('driver_01');
  const [password, setPassword] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState('');
  const { setUser } = useAuth();

  const handleSignIn = () => {
    let role: '' | 'driver' | 'dock_worker' | 'warehouse_staff' = '';
    if        (username === 'driver_01' && password === 'pass123') {
      role = 'driver';
    } else if (username === 'dock_01' && password === 'pass123') {
      role = 'dock_worker';
    } else if (username === 'wh_01' && password === 'pass123') {
      role = 'warehouse_staff';
    } else {
      setError('Invalid credentials.');
      return;
    }
    setUser({ username, role });
    setError('');
    router.replace('/'); // Switch to Logistics tab
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Sign In</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleExpand} style={styles.expandToggle}>
        <Text style={styles.expandToggleText}>{expanded ? 'Hide test credentials' : 'Need credentials to test? (Tap to expand)'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.expandContent}>
          <Text style={styles.expandDescription}>Log in with one of the following:</Text>
          <Text style={styles.credentialItem}>• Driver: <Text style={styles.bold}>driver_01</Text> / <Text style={styles.bold}>pass123</Text></Text>
          <Text style={styles.credentialItem}>• Dock Worker: <Text style={styles.bold}>dock_01</Text> / <Text style={styles.bold}>pass123</Text></Text>
          <Text style={styles.credentialItem}>• Warehouse Staff: <Text style={styles.bold}>wh_01</Text> / <Text style={styles.bold}>pass123</Text></Text>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  expandToggle: {
    marginTop: 8,
    marginBottom: 4,
  },
  expandToggleText: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
  },
  expandContent: {
    marginTop: 8,
    backgroundColor: '#f0f4fa',
    borderRadius: 8,
    padding: 16,
    width: '100%',
  },
  expandDescription: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  credentialItem: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
    color: '#222',
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
    fontSize: 16,
  },
}); 