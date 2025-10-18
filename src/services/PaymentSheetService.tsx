import React from 'react';
import { PaymentSuccessSheet } from '../components/PaymentSuccessSheet';

interface TransactionData {
  title: string;
  amount: string;
  date: string;
  from: string;
  cardNumber: string;
  type?: 'debit' | 'credit';
}

interface SheetState {
  visible: boolean;
  transactionData?: TransactionData;
  isSuccess?: boolean;
}

class PaymentSheetServiceClass {
  private setSheetState: ((state: SheetState) => void) | null = null;

  initialize(setSheetState: (state: SheetState) => void) {
    this.setSheetState = setSheetState;
  }

  showPaymentSuccess(transactionData?: TransactionData) {
    if (this.setSheetState) {
      this.setSheetState({
        visible: true,
        transactionData,
        isSuccess: true,
      });
    }
  }

  showPaymentFailed(transactionData?: TransactionData) {
    if (this.setSheetState) {
      this.setSheetState({
        visible: true,
        transactionData,
        isSuccess: false,
      });
    }
  }

  hide() {
    if (this.setSheetState) {
      this.setSheetState({
        visible: false,
      });
    }
  }
}

export const PaymentSheetService = new PaymentSheetServiceClass();

// Provider component
export const PaymentSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sheetState, setSheetState] = React.useState<SheetState>({
    visible: false,
  });

  React.useEffect(() => {
    PaymentSheetService.initialize(setSheetState);
  }, []);

  const handleDismiss = () => {
    setSheetState({ visible: false });
  };

  return (
    <>
      {children}
      <PaymentSuccessSheet
        visible={sheetState.visible}
        transactionData={sheetState.transactionData}
        isSuccess={sheetState.isSuccess}
        onDismiss={handleDismiss}
      />
    </>
  );
};
