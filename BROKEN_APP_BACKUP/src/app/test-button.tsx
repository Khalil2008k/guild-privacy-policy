import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/Button';

export default function TestButtonScreen() {
  const handlePress = () => {
    console.log('✅ Button works in GUILD-2!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Button Component Test</Text>
      <Text style={styles.subtitle}>Testing migrated Button component</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Test Button"
          onPress={handlePress}
          variant="primary"
        />
      </View>
      
      <Text style={styles.status}>
        ✅ If you see this button, migration is working!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  status: {
    fontSize: 14,
    color: '#00ff88',
    textAlign: 'center',
    marginTop: 20,
  },
});
