# 🚨 Custom Alert System Guide

## Overview
The GUILD app now includes a **fully customized alert system** with beautiful, themed alerts that adapt to light/dark mode. Unlike native alerts, these custom alerts are styled to match your app's design system with theme colors, smooth animations, blur effects, and the signature GUILD shield icon.

## ✨ What Makes This Special
- **Fully Styled**: Beautiful custom design instead of system alerts
- **Theme-Aware**: Automatically adapts to light/dark mode
- **Shield Icon**: GUILD's signature shield icon with RTL positioning
- **Blur Background**: Modern blur overlay effect
- **Smooth Animations**: Fade-in animations for professional feel
- **Color-Coded**: Different colors for success, warning, error, and info

## 🎯 Features

### ✅ **Consistent Theming**
- All alerts follow the app's design system
- **Theme-aware colors** that adapt to light/dark mode
- **Dynamic color changes** based on current theme
- Automatic RTL (Right-to-Left) support for Arabic
- Consistent button styling and behavior
- **Lucide Shield icon** that changes position based on language direction

### 🎨 **Alert Types**
- **Default**: Standard alerts with OK/Cancel options
- **Success**: Green-themed success messages
- **Warning**: Orange-themed warning messages  
- **Error**: Red-themed error messages
- **Info**: Blue-themed informational messages
- **Confirmation**: Yes/No confirmation dialogs
- **Destructive**: Red-themed destructive action confirmations

### 🌍 **Internationalization**
- Full RTL support for Arabic language
- Localized button text and messages
- Automatic text direction handling

## 📱 Usage Examples

### Success Alert
```typescript
import { CustomAlertService } from '../services/CustomAlertService';

CustomAlertService.showSuccess(
  'Success!',
  'Operation completed successfully'
);
```

### Error Alert
```typescript
CustomAlertService.showError(
  'Error!',
  'Something went wrong'
);
```

### Warning Alert
```typescript
CustomAlertService.showWarning(
  'Warning!',
  'Please review your information'
);
```

### Info Alert
```typescript
CustomAlertService.showInfo(
  'Information',
  'Here is some useful information'
);
```

### Confirmation Alert
```typescript
CustomAlertService.showConfirmation(
  'Delete Item',
  'Are you sure you want to delete this item?',
  () => {
    // Handle confirmation
    console.log('Item deleted');
  },
  () => {
    // Handle cancellation (optional)
    console.log('Deletion cancelled');
  },
  isRTL
);
```

### Destructive Confirmation
```typescript
CustomAlertService.showDestructiveConfirmation(
  'Delete Account',
  'This action cannot be undone. Are you sure?',
  () => {
    // Handle destructive action
    deleteUserAccount();
  },
  undefined, // No cancel handler needed
  isRTL
);
```

## 🧪 Testing

### Test Button Location
The sign-in screen now includes a **"Test Alert"** button that demonstrates the alert system:

1. **Main Test Button**: Shows the default test alert with multiple options
   - Features a **Lucide Shield icon** that changes position based on language direction
   - Uses theme colors that adapt to light/dark mode
2. **Alert Type Buttons**: Four colored buttons to test different alert types:
   - 🟢 **Success** (Theme-aware Green)
   - 🟠 **Warning** (Theme-aware Orange) 
   - 🔴 **Error** (Theme-aware Red)
   - 🔵 **Info** (Theme-aware Blue)
3. **Shield Icon**: Appears in the corner of the alert types section
   - **English**: Shield icon on the right side
   - **Arabic**: Shield icon on the left side

### How to Test
1. Navigate to the sign-in screen
2. Scroll down to see the test buttons
3. Tap any test button to see the alert in action
4. Test both English and Arabic (RTL) modes

## 🎨 Design System

### Color Scheme
- **Success**: Theme-aware green (`theme.success`)
- **Warning**: Theme-aware orange (`theme.warning`)
- **Error**: Theme-aware red (`theme.error`)
- **Info**: Theme-aware blue (`theme.info`)
- **Default**: App theme colors (`theme.primary`, `theme.surface`, etc.)
- **Adaptive**: Colors automatically change between light and dark modes

### Button Styles
- **Default**: Standard app button styling
- **Cancel**: Light gray with cancel styling
- **Destructive**: Red with destructive styling

## 🔧 Implementation

### Import the Service
```typescript
import { CustomAlertService } from '../services/CustomAlertService';
```

### Basic Usage
```typescript
// No need for theme context - it's automatic!
const { isRTL } = useI18n();

// Show a themed alert
CustomAlertService.showSuccess('Title', 'Message');
CustomAlertService.showError('Title', 'Message');
CustomAlertService.showWarning('Title', 'Message');
CustomAlertService.showInfo('Title', 'Message');
```

### Custom Alert with Buttons
```typescript
CustomAlertService.showDefault(
  'Custom Title',
  'Custom message with detailed information',
  [
    {
      text: 'Cancel',
      style: 'cancel',
    },
    {
      text: 'Confirm',
      style: 'default',
      onPress: () => console.log('Confirmed')
    },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => console.log('Deleted')
    }
  ]
);
```

## 📋 Best Practices

### 1. **Use Appropriate Alert Types**
- Use **Success** for completed actions
- Use **Warning** for potential issues
- Use **Error** for failures
- Use **Info** for general information
- Use **Confirmation** for yes/no decisions
- Use **Destructive** for dangerous actions

### 2. **Keep Messages Clear**
- Use concise, actionable titles
- Provide clear, helpful messages
- Avoid technical jargon

### 3. **Handle RTL Properly**
- Always pass the `isRTL` parameter
- Test in both English and Arabic modes
- Ensure text flows correctly

### 4. **Provide Callbacks**
- Always provide `onPress` callbacks for buttons
- Handle both success and error cases
- Log important actions for debugging

## 🚀 Integration

The alert system is now ready to be used throughout the app. Simply import `AlertService` and use the appropriate method for your use case.

### Files Modified
- ✅ `src/app/(auth)/sign-in.tsx` - Added test buttons
- ✅ `src/services/AlertService.ts` - Created alert service
- ✅ `ALERT_SYSTEM_GUIDE.md` - This documentation

### Next Steps
1. Replace existing `Alert.alert()` calls with `AlertService` methods
2. Test all alert types in both languages
3. Customize colors and styling as needed
4. Add more specialized alert methods if required

The alert system is now fully functional and ready for use across the entire GUILD application! 🎉
