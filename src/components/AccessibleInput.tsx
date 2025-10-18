import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  AccessibilityRole,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface AccessibleInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'phone';
  icon?: keyof typeof Ionicons.glyphMap;
  onValidate?: (value: string) => string | undefined;
}

/**
 * Fully accessible text input with proper labeling and error handling
 * Supports screen readers, keyboard navigation, and validation
 */
export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  hint,
  required = false,
  type = 'text',
  icon,
  onValidate,
  value,
  onChangeText,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>();

  const handleFocus = () => {
    setIsFocused(true);
    props.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Validate on blur
    if (onValidate && value) {
      const validationError = onValidate(value);
      setInternalError(validationError);
    }
    
    props.onBlur?.({} as any);
  };

  const handleChangeText = (text: string) => {
    onChangeText?.(text);
    
    // Clear error when user starts typing
    if (internalError) {
      setInternalError(undefined);
    }
  };

  const getKeyboardType = () => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'number':
        return 'numeric';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  const getAutoCompleteType = () => {
    switch (type) {
      case 'email':
        return 'email';
      case 'password':
        return showPassword ? 'off' : 'password';
      case 'phone':
        return 'tel';
      default:
        return 'off';
    }
  };

  const displayError = error || internalError;
  const accessibilityLabel = `${label}${required ? ', required' : ''}${
    displayError ? `, error: ${displayError}` : ''
  }`;

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      <TouchableOpacity
        accessible={true}
        accessibilityRole="none"
        onPress={() => inputRef.current?.focus()}
      >
        <Text
          style={[
            styles.label,
            { color: displayError ? theme.error : theme.text },
          ]}
        >
          {label}
          {required && <Text style={{ color: theme.error }}> *</Text>}
        </Text>
      </TouchableOpacity>

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: displayError
              ? theme.error
              : isFocused
              ? theme.primary
              : theme.border,
            backgroundColor: theme.surface,
          },
        ]}
      >
        {/* Icon */}
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={displayError ? theme.error : theme.textSecondary}
            style={styles.icon}
          />
        )}

        {/* Input */}
        <TextInput
          ref={inputRef}
          accessible={true}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={hint}
          accessibilityRole="none"
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType={getKeyboardType()}
          autoComplete={getAutoCompleteType()}
          secureTextEntry={type === 'password' && !showPassword}
          style={[
            styles.input,
            { color: theme.text },
          ]}
          placeholderTextColor={theme.textSecondary}
          {...props}
        />

        {/* Password Toggle */}
        {type === 'password' && (
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Hint/Error Text */}
      {(hint || displayError) && (
        <Text
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[
            styles.helperText,
            { color: displayError ? theme.error : theme.textSecondary },
          ]}
        >
          {displayError || hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48, // Minimum touch target size
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default AccessibleInput;

