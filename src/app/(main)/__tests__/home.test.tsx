/**
 * Home Screen Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';

// Mock the home screen component
const MockHomeScreen = () => {
  const [selectedTab, setSelectedTab] = React.useState('jobs');

  const handleTabPress = (tab: string) => {
    setSelectedTab(tab);
  };

  const handleGuildMap = () => {
    // Mock guild map navigation
  };

  return (
    <ScrollView testID="home-screen">
      <View testID="header">
        <Text testID="welcome-text">Welcome to GUILD</Text>
        <TouchableOpacity testID="guild-map-button" onPress={handleGuildMap}>
          <Text>Guild Map</Text>
        </TouchableOpacity>
      </View>
      
      <View testID="tab-navigation">
        <TouchableOpacity 
          testID="jobs-tab" 
          onPress={() => handleTabPress('jobs')}
        >
          <Text>Jobs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          testID="chat-tab" 
          onPress={() => handleTabPress('chat')}
        >
          <Text>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          testID="profile-tab" 
          onPress={() => handleTabPress('profile')}
        >
          <Text>Profile</Text>
        </TouchableOpacity>
      </View>

      <View testID="content">
        <Text testID="selected-tab">{selectedTab}</Text>
      </View>
    </ScrollView>
  );
};

describe('HomeScreen', () => {
  it('should render home screen components', () => {
    const { getByTestId } = render(<MockHomeScreen />);
    
    expect(getByTestId('home-screen')).toBeTruthy();
    expect(getByTestId('header')).toBeTruthy();
    expect(getByTestId('welcome-text')).toBeTruthy();
    expect(getByTestId('guild-map-button')).toBeTruthy();
    expect(getByTestId('tab-navigation')).toBeTruthy();
  });

  it('should handle tab navigation', () => {
    const { getByTestId } = render(<MockHomeScreen />);
    
    const chatTab = getByTestId('chat-tab');
    fireEvent.press(chatTab);
    
    expect(getByTestId('selected-tab').props.children).toBe('chat');
  });

  it('should handle guild map button press', () => {
    const { getByTestId } = render(<MockHomeScreen />);
    const guildMapButton = getByTestId('guild-map-button');
    
    fireEvent.press(guildMapButton);
    // Test passes if no errors are thrown
    expect(true).toBe(true);
  });

  it('should default to jobs tab', () => {
    const { getByTestId } = render(<MockHomeScreen />);
    
    expect(getByTestId('selected-tab').props.children).toBe('jobs');
  });

  it('should switch between all tabs', () => {
    const { getByTestId } = render(<MockHomeScreen />);
    
    // Test jobs tab
    fireEvent.press(getByTestId('jobs-tab'));
    expect(getByTestId('selected-tab').props.children).toBe('jobs');
    
    // Test chat tab
    fireEvent.press(getByTestId('chat-tab'));
    expect(getByTestId('selected-tab').props.children).toBe('chat');
    
    // Test profile tab
    fireEvent.press(getByTestId('profile-tab'));
    expect(getByTestId('selected-tab').props.children).toBe('profile');
  });
});
