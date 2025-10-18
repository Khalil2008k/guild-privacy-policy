import React from 'react';
import { CustomAlert, CustomAlertButton } from '../components/CustomAlert';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: CustomAlertButton[];
  type: 'default' | 'success' | 'warning' | 'error' | 'info';
}

class CustomAlertServiceClass {
  private setAlertState: ((state: AlertState) => void) | null = null;

  initialize(setAlertState: (state: AlertState) => void) {
    this.setAlertState = setAlertState;
  }

  private show(
    title: string,
    message: string,
    buttons: CustomAlertButton[] = [],
    type: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default'
  ) {
    if (this.setAlertState) {
      this.setAlertState({
        visible: true,
        title,
        message,
        buttons,
        type,
      });
    }
  }

  showDefault(title: string, message: string, buttons?: CustomAlertButton[]) {
    this.show(title, message, buttons, 'default');
  }

  showSuccess(title: string, message: string, buttons?: CustomAlertButton[]) {
    this.show(title, message, buttons, 'success');
  }

  showWarning(title: string, message: string, buttons?: CustomAlertButton[]) {
    this.show(title, message, buttons, 'warning');
  }

  showError(title: string, message: string, buttons?: CustomAlertButton[]) {
    this.show(title, message, buttons, 'error');
  }

  showInfo(title: string, message: string, buttons?: CustomAlertButton[]) {
    this.show(title, message, buttons, 'info');
  }

  showAlert(title: string, message: string, buttons?: CustomAlertButton[]) {
    this.showDefault(title, message, buttons);
  }

  showConfirmation(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    isRTL: boolean = false
  ) {
    this.show(title, message, [
      {
        text: isRTL ? 'إلغاء' : 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: isRTL ? 'تأكيد' : 'Confirm',
        style: 'default',
        onPress: onConfirm,
      },
    ], 'default');
  }

  showDestructiveConfirmation(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    isRTL: boolean = false
  ) {
    this.show(title, message, [
      {
        text: isRTL ? 'إلغاء' : 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: isRTL ? 'حذف' : 'Delete',
        style: 'destructive',
        onPress: onConfirm,
      },
    ], 'error');
  }
}

export const CustomAlertService = new CustomAlertServiceClass();

// Provider component
export const CustomAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = React.useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'default',
  });

  React.useEffect(() => {
    CustomAlertService.initialize(setAlertState);
  }, []);

  const handleDismiss = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  return (
    <>
      {children}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        type={alertState.type}
        onDismiss={handleDismiss}
      />
    </>
  );
};



