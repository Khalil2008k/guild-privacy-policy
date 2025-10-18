/**
 * Button Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';

// Mock Button component
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  testID?: string;
}

const MockButton: React.FC<ButtonProps> = ({ 
  title, 
  onPress, 
  disabled = false, 
  variant = 'primary',
  testID 
}) => {
  return (
    <TouchableOpacity 
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: variant === 'primary' ? '#007AFF' : '#6B7280',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <Text testID={`${testID}-text`}>{title}</Text>
    </TouchableOpacity>
  );
};

describe('Button Component', () => {
  it('should render button with title', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <MockButton title="Test Button" onPress={mockOnPress} testID="test-button" />
    );
    
    expect(getByTestId('test-button')).toBeTruthy();
    expect(getByTestId('test-button-text').props.children).toBe('Test Button');
  });

  it('should call onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <MockButton title="Test Button" onPress={mockOnPress} testID="test-button" />
    );
    
    fireEvent.press(getByTestId('test-button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <MockButton 
        title="Test Button" 
        onPress={mockOnPress} 
        disabled={true}
        testID="test-button" 
      />
    );
    
    fireEvent.press(getByTestId('test-button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should render primary variant correctly', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <MockButton 
        title="Primary Button" 
        onPress={mockOnPress} 
        variant="primary"
        testID="primary-button" 
      />
    );
    
    const button = getByTestId('primary-button');
    expect(button.props.style.backgroundColor).toBe('#007AFF');
  });

  it('should render secondary variant correctly', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <MockButton 
        title="Secondary Button" 
        onPress={mockOnPress} 
        variant="secondary"
        testID="secondary-button" 
      />
    );
    
    const button = getByTestId('secondary-button');
    expect(button.props.style.backgroundColor).toBe('#6B7280');
  });

  it('should show disabled state correctly', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <MockButton 
        title="Disabled Button" 
        onPress={mockOnPress} 
        disabled={true}
        testID="disabled-button" 
      />
    );
    
    const button = getByTestId('disabled-button');
    expect(button.props.style.opacity).toBe(0.5);
  });
});
