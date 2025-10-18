import { Alert, AlertButton } from 'react-native';

export interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
  onDismiss?: () => void;
}

export interface ThemedAlertOptions extends AlertOptions {
  isRTL?: boolean;
  theme?: 'default' | 'success' | 'warning' | 'error' | 'info';
  themeColors?: {
    success: string;
    warning: string;
    error: string;
    info: string;
    primary: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export class AlertService {
  /**
   * Show a themed alert with consistent styling
   */
  static showThemedAlert(options: ThemedAlertOptions): void {
    const {
      title,
      message,
      buttons = [],
      cancelable = true,
      onDismiss,
      isRTL = false,
      theme = 'default'
    } = options;

    // Default buttons if none provided
    const defaultButtons: AlertButton[] = [
      {
        text: isRTL ? 'إلغاء' : 'Cancel',
        style: 'cancel',
        onPress: () => console.log('Alert cancelled')
      },
      {
        text: isRTL ? 'موافق' : 'OK',
        style: 'default',
        onPress: () => console.log('Alert confirmed')
      }
    ];

    const finalButtons = buttons.length > 0 ? buttons : defaultButtons;

    Alert.alert(
      title,
      message,
      finalButtons,
      {
        cancelable,
        onDismiss
      }
    );
  }

  /**
   * Show a success alert
   */
  static showSuccess(title: string, message: string, isRTL: boolean = false, themeColors?: any): void {
    this.showThemedAlert({
      title,
      message,
      isRTL,
      theme: 'success',
      themeColors,
      buttons: [
        {
          text: isRTL ? 'حسناً' : 'OK',
          style: 'default',
          onPress: () => console.log('Success alert confirmed')
        }
      ]
    });
  }

  /**
   * Show an error alert
   */
  static showError(title: string, message: string, isRTL: boolean = false, themeColors?: any): void {
    this.showThemedAlert({
      title,
      message,
      isRTL,
      theme: 'error',
      themeColors,
      buttons: [
        {
          text: isRTL ? 'حسناً' : 'OK',
          style: 'default',
          onPress: () => console.log('Error alert confirmed')
        }
      ]
    });
  }

  /**
   * Show a warning alert
   */
  static showWarning(title: string, message: string, isRTL: boolean = false, themeColors?: any): void {
    this.showThemedAlert({
      title,
      message,
      isRTL,
      theme: 'warning',
      themeColors,
      buttons: [
        {
          text: isRTL ? 'إلغاء' : 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Warning alert cancelled')
        },
        {
          text: isRTL ? 'متابعة' : 'Continue',
          style: 'destructive',
          onPress: () => console.log('Warning alert confirmed')
        }
      ]
    });
  }

  /**
   * Show an info alert
   */
  static showInfo(title: string, message: string, isRTL: boolean = false, themeColors?: any): void {
    this.showThemedAlert({
      title,
      message,
      isRTL,
      theme: 'info',
      themeColors,
      buttons: [
        {
          text: isRTL ? 'حسناً' : 'OK',
          style: 'default',
          onPress: () => console.log('Info alert confirmed')
        }
      ]
    });
  }

  /**
   * Show a confirmation alert
   */
  static showConfirmation(
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void,
    isRTL: boolean = false,
    themeColors?: any
  ): void {
    this.showThemedAlert({
      title,
      message,
      isRTL,
      theme: 'default',
      themeColors,
      buttons: [
        {
          text: isRTL ? 'إلغاء' : 'Cancel',
          style: 'cancel',
          onPress: onCancel || (() => console.log('Confirmation cancelled'))
        },
        {
          text: isRTL ? 'تأكيد' : 'Confirm',
          style: 'default',
          onPress: onConfirm
        }
      ]
    });
  }

  /**
   * Show a destructive action confirmation
   */
  static showDestructiveConfirmation(
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void,
    isRTL: boolean = false,
    themeColors?: any
  ): void {
    this.showThemedAlert({
      title,
      message,
      isRTL,
      theme: 'error',
      themeColors,
      buttons: [
        {
          text: isRTL ? 'إلغاء' : 'Cancel',
          style: 'cancel',
          onPress: onCancel || (() => console.log('Destructive action cancelled'))
        },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: onConfirm
        }
      ]
    });
  }

  /**
   * Show a test alert for design preview
   */
  static showTestAlert(isRTL: boolean = false, themeColors?: any): void {
    this.showThemedAlert({
      title: isRTL ? 'اختبار التنبيه' : 'Test Alert',
      message: isRTL 
        ? 'هذا تنبيه تجريبي لاختبار تصميم التنبيهات في التطبيق. يمكنك استخدام هذا التصميم في جميع أنحاء التطبيق.'
        : 'This is a test alert to preview the alert design for the entire app. You can use this design throughout the application.',
      isRTL,
      theme: 'default',
      themeColors,
      buttons: [
        {
          text: isRTL ? 'إلغاء' : 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Test alert cancelled')
        },
        {
          text: isRTL ? 'موافق' : 'OK',
          style: 'default',
          onPress: () => console.log('Test alert confirmed')
        },
        {
          text: isRTL ? 'خيار إضافي' : 'Extra Option',
          style: 'destructive',
          onPress: () => console.log('Extra option selected')
        }
      ]
    });
  }
}

export default AlertService;
