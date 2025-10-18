
// React Native New Architecture (Fabric/JSI) Implementation
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// New Architecture enables:
// 1. Fabric renderer for better performance
// 2. JSI (JavaScript Interface) for direct C++ communication
// 3. TurboModules for faster native module loading
// 4. Codegen for type-safe native modules

export function NewArchitectureComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native New Architecture Enabled</Text>
      <Text style={styles.description}>
        Features enabled: Fabric, JSI, TurboModules, Codegen
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

// Performance monitoring for New Architecture
export class NewArchitectureMonitor {
  private static instance: NewArchitectureMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): NewArchitectureMonitor {
    if (!NewArchitectureMonitor.instance) {
      NewArchitectureMonitor.instance = new NewArchitectureMonitor();
    }
    return NewArchitectureMonitor.instance;
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics(): Record<string, { average: number; count: number; last: number }> {
    const result: Record<string, { average: number; count: number; last: number }> = {};

    for (const [name, values] of this.metrics) {
      const sum = values.reduce((a, b) => a + b, 0);
      result[name] = {
        average: sum / values.length,
        count: values.length,
        last: values[values.length - 1]
      };
    }

    return result;
  }
}
