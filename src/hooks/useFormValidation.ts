import { useState, useCallback, useMemo } from 'react';
import { ValidationService, ValidationRulesInterface, ValidationResult } from '../utils/validation';

export interface FormField {
  value: string;
  rules: ValidationRulesInterface;
  error?: string;
  touched?: boolean;
}

export interface FormData {
  [key: string]: FormField;
}

export interface UseFormValidationReturn {
  formData: FormData;
  updateField: (fieldName: string, value: string) => void;
  validateField: (fieldName: string) => ValidationResult;
  validateForm: () => boolean;
  resetForm: () => void;
  getFieldError: (fieldName: string) => string | undefined;
  isFieldValid: (fieldName: string) => boolean;
  isFormValid: boolean;
  hasErrors: boolean;
  touchedFields: string[];
}

export function useFormValidation(initialData: FormData): UseFormValidationReturn {
  const [formData, setFormData] = useState<FormData>(initialData);

  const updateField = useCallback((fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        touched: true,
        error: undefined, // Clear error when user starts typing
      }
    }));
  }, []);

  const validateField = useCallback((fieldName: string): ValidationResult => {
    const field = formData[fieldName];
    if (!field) return { isValid: false, message: 'Field not found' };

    const result = ValidationService.validate(field.value, field.rules);

    setFormData(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error: result.isValid ? undefined : result.message,
      }
    }));

    return result;
  }, [formData]);

  const validateForm = useCallback((): boolean => {
    const results = ValidationService.validateForm(
      Object.keys(formData).reduce((acc, key) => ({
        ...acc,
        [key]: {
          value: formData[key].value,
          rules: formData[key].rules
        }
      }), {})
    );

    setFormData(prev => {
      const updated = { ...prev };
      Object.keys(results.errors).forEach(fieldName => {
        if (updated[fieldName]) {
          updated[fieldName] = {
            ...updated[fieldName],
            error: results.errors[fieldName],
            touched: true,
          };
        }
      });
      return updated;
    });

    return results.isValid;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
  }, [initialData]);

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return formData[fieldName]?.error;
  }, [formData]);

  const isFieldValid = useCallback((fieldName: string): boolean => {
    const field = formData[fieldName];
    if (!field) return false;
    return !field.error && field.touched === true;
  }, [formData]);

  const isFormValid = useMemo(() => {
    return Object.values(formData).every(field =>
      !field.error && (field.touched || !field.rules.required)
    );
  }, [formData]);

  const hasErrors = useMemo(() => {
    return Object.values(formData).some(field => !!field.error);
  }, [formData]);

  const touchedFields = useMemo(() => {
    return Object.keys(formData).filter(fieldName =>
      formData[fieldName].touched
    );
  }, [formData]);

  return {
    formData,
    updateField,
    validateField,
    validateForm,
    resetForm,
    getFieldError,
    isFieldValid,
    isFormValid,
    hasErrors,
    touchedFields,
  };
}
