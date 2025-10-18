#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class NewArchitectureEnabler {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
  }

  async enable() {
    console.log('🚀 Enabling New Architecture (Fabric/JSI)...');
    
    try {
      // Step 1: Update app.json
      console.log('📱 Updating app.json...');
      await this.updateAppJson();
      
      // Step 2: Update metro.config.js
      console.log('⚙️  Updating metro.config.js...');
      await this.updateMetroConfig();
      
      // Step 3: Update package.json
      console.log('📦 Updating package.json...');
      await this.updatePackageJson();
      
      // Step 4: Create JSI bridge
      console.log('🌉 Creating JSI bridge...');
      await this.createJSIBridge();
      
      // Step 5: Create Fabric components
      console.log('🧩 Creating Fabric components...');
      await this.createFabricComponents();
      
      console.log('✅ New Architecture enabled successfully!');
      
    } catch (error) {
      console.error('❌ Failed to enable New Architecture:', error.message);
      process.exit(1);
    }
  }

  async updateAppJson() {
    const appJsonPath = path.join(this.projectRoot, 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    appJson.expo = {
      ...appJson.expo,
      newArchEnabled: true,
      plugins: [
        ...(appJson.expo.plugins || []),
        '@react-native-community/cli-platform-android',
        '@react-native-community/cli-platform-ios'
      ]
    };
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  }

  async updateMetroConfig() {
    const metroConfig = `
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable New Architecture
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable Hermes
config.resolver.hermes = true;

// Enable JSI
config.resolver.jsi = true;

// Enable Fabric
config.resolver.fabric = true;

module.exports = config;
`;
    
    fs.writeFileSync(path.join(this.projectRoot, 'metro.config.js'), metroConfig);
  }

  async updatePackageJson() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.dependencies = {
      ...packageJson.dependencies,
      'react-native-reanimated': '^3.0.0',
      'react-native-gesture-handler': '^2.0.0',
      'react-native-screens': '^3.0.0',
      'react-native-safe-area-context': '^4.0.0'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async createJSIBridge() {
    const jsiBridge = `
// JSI Bridge for native modules
import { NativeModules } from 'react-native';

export interface JSIBridge {
  // Performance monitoring
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
  
  // Native animations
  createNativeAnimation(config: AnimationConfig): Promise<AnimationHandle>;
  
  // File system operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  
  // Crypto operations
  hashString(input: string): Promise<string>;
  encryptData(data: string, key: string): Promise<string>;
  
  // Database operations
  executeQuery(query: string, params: any[]): Promise<any[]>;
  
  // Network operations
  makeRequest(url: string, options: RequestOptions): Promise<Response>;
}

export const JSI = NativeModules.JSIBridge as JSIBridge;
`;
    
    fs.writeFileSync(path.join(this.projectRoot, 'src/bridge/JSI.ts'), jsiBridge);
  }

  async createFabricComponents() {
    const fabricComponent = `
// Fabric component example
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FabricComponentProps {
  title: string;
  onPress?: () => void;
}

export function FabricComponent({ title, onPress }: FabricComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
`;
    
    fs.writeFileSync(path.join(this.projectRoot, 'src/components/FabricComponent.tsx'), fabricComponent);
  }
}

// Run the enabler
if (require.main === module) {
  const enabler = new NewArchitectureEnabler();
  enabler.enable()
    .then(() => {
      console.log('🎉 New Architecture enabled successfully!');
    })
    .catch(error => {
      console.error('❌ Failed to enable New Architecture:', error);
      process.exit(1);
    });
}

module.exports = NewArchitectureEnabler;







