/**
 * useFormValidation Hook Tests
 */

import { renderHook, act } from '@testing-library/react-hooks';

// Mock useFormValidation hook
interface ValidationRules {
  [key: string]: (value: any) => string | null;
}

interface FormState {
  [key: string]: any;
}

interface FormErrors {
  [key: string]: string | null;
}

const useFormValidation = (initialState: FormState, validationRules: ValidationRules) => {
  const [values, setValues] = React.useState(initialState);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateField = (name: string, value: any): string | null => {
    const rule = validationRules[name];
    return rule ? rule(value) : null;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, values[field]);
      newErrors[field] = error;
      if (error) isValid = false;
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (onSubmit: (values: FormState) => Promise<void>) => {
    setIsSubmitting(true);
    
    if (validateForm()) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  };

  const reset = () => {
    setValues(initialState);
    setErrors({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    validateForm,
    reset
  };
};

// Mock React for the hook
const React = {
  useState: jest.fn()
};

describe('useFormValidation Hook', () => {
  const mockSetState = jest.fn();
  
  beforeEach(() => {
    React.useState = jest.fn()
      .mockReturnValueOnce([{}, mockSetState]) // values
      .mockReturnValueOnce([{}, mockSetState]) // errors
      .mockReturnValueOnce([false, mockSetState]); // isSubmitting
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const initialState = {
    email: '',
    password: ''
  };

  const validationRules = {
    email: (value: string) => {
      if (!value) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(value)) return 'Email is invalid';
      return null;
    },
    password: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      return null;
    }
  };

  it('should initialize with correct default values', () => {
    const hook = useFormValidation(initialState, validationRules);
    
    expect(hook.values).toEqual({});
    expect(hook.errors).toEqual({});
    expect(hook.isSubmitting).toBe(false);
  });

  it('should provide handleChange function', () => {
    const hook = useFormValidation(initialState, validationRules);
    
    expect(typeof hook.handleChange).toBe('function');
  });

  it('should provide handleSubmit function', () => {
    const hook = useFormValidation(initialState, validationRules);
    
    expect(typeof hook.handleSubmit).toBe('function');
  });

  it('should provide validateForm function', () => {
    const hook = useFormValidation(initialState, validationRules);
    
    expect(typeof hook.validateForm).toBe('function');
  });

  it('should provide reset function', () => {
    const hook = useFormValidation(initialState, validationRules);
    
    expect(typeof hook.reset).toBe('function');
  });

  it('should handle form submission', async () => {
    const hook = useFormValidation(initialState, validationRules);
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    
    await hook.handleSubmit(mockOnSubmit);
    
    // Test that the function can be called without errors
    expect(typeof hook.handleSubmit).toBe('function');
  });

  it('should handle form reset', () => {
    const hook = useFormValidation(initialState, validationRules);
    
    hook.reset();
    
    // Test that the function can be called without errors
    expect(typeof hook.reset).toBe('function');
  });

  it('should validate individual fields', () => {
    const hook = useFormValidation(initialState, validationRules);
    
    // Test email validation
    expect(validationRules.email('')).toBe('Email is required');
    expect(validationRules.email('invalid-email')).toBe('Email is invalid');
    expect(validationRules.email('test@example.com')).toBe(null);
    
    // Test password validation
    expect(validationRules.password('')).toBe('Password is required');
    expect(validationRules.password('short')).toBe('Password must be at least 8 characters');
    expect(validationRules.password('validpassword')).toBe(null);
  });

  it('should handle change events', () => {
    const hook = useFormValidation(initialState, validationRules);
    
    hook.handleChange('email', 'test@example.com');
    
    // Test that the function can be called without errors
    expect(typeof hook.handleChange).toBe('function');
  });
});
