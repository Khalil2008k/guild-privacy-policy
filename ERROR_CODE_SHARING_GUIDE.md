# 📤 Error Code Sharing Guide

## Overview

Error codes are now formatted in a **unique, shareable format** that can be sent via chat and easily parsed.

## Format

Error codes are formatted as: `[ERROR_CODE:XXXX-XXXX-XXXX]`

**Example:**
- `HTTP_401` → `[ERROR_CODE:HTTP-401]`
- `PAYMENT_FAILED` → `[ERROR_CODE:PAYMENT-FAILED]`
- `WEBVIEW_ERROR` → `[ERROR_CODE:WEBVIEW-ERROR]`

## Full Error Report Format

When shared in chat, error codes are formatted as:

```
🔴 ERROR REPORT
━━━━━━━━━━━━━━━━━━━━
Code: [ERROR_CODE:XXXX-XXXX-XXXX]
Message: Error message here
Context: Payment flow
Time: 2025-11-07T13:00:00.000Z
Metadata:
  paymentId: COIN_1234567890
  amount: 15.00
━━━━━━━━━━━━━━━━━━━━
```

## How to Share Error Codes

### 1. **Automatic Display**
Error codes are automatically displayed in error messages:
```
Payment Failed
Payment could not be completed. Please try again.

Error Code: [ERROR_CODE:HTTP-401]
```

### 2. **Share to Chat**
Use `ErrorCodeShareService` to share error codes:

```typescript
import { ErrorCodeShareService } from '@/services/ErrorCodeShareService';
import { formatErrorForChat } from '@/utils/errorCodeFormatter';

// Share to specific user
await ErrorCodeShareService.shareErrorToUser(
  'recipientUserId',
  {
    errorCode: 'HTTP_401',
    errorMessage: 'Authorization Required',
    context: 'Payment flow',
    timestamp: new Date(),
    metadata: {
      paymentId: 'COIN_1234567890',
      amount: 15.00
    }
  }
);

// Share to existing chat
await ErrorCodeShareService.shareErrorToChat(
  'chatId',
  {
    errorCode: 'HTTP_401',
    errorMessage: 'Authorization Required',
    context: 'Payment flow'
  }
);
```

## How to Read Error Codes from Chat

### 1. **Check if Message Contains Error Code**
```typescript
import { hasErrorCode, extractErrorCode, parseErrorCodeFromChat } from '@/utils/errorCodeFormatter';

// Check if message has error code
if (hasErrorCode(message.text)) {
  // Extract error code
  const errorCode = extractErrorCode(message.text);
  console.log('Error Code:', errorCode);
  
  // Parse full error data
  const errorData = parseErrorCodeFromChat(message.text);
  console.log('Error Data:', errorData);
}
```

### 2. **Parse Full Error Report**
```typescript
const errorData = parseErrorCodeFromChat(message.text);
// Returns:
// {
//   errorCode: 'HTTP-401',
//   errorMessage: 'Authorization Required',
//   context: 'Payment flow',
//   timestamp: Date,
//   metadata: { ... }
// }
```

## Example Usage

### In Payment Error Handler
```typescript
const handlePaymentFailure = (error: string, errorCode?: string) => {
  // Format error code for display
  const formattedErrorCode = errorCode ? formatErrorCodeForChat(errorCode) : null;
  
  // Show error with code
  CustomAlertService.showError(
    'Payment Failed',
    `${error}\n\nError Code: ${formattedErrorCode}`
  );
  
  // Optionally share to chat
  if (errorCode) {
    ErrorCodeShareService.shareErrorToUser(
      'testUserId',
      {
        errorCode,
        errorMessage: error,
        context: 'Payment flow',
        timestamp: new Date(),
        metadata: { paymentId, amount }
      }
    );
  }
};
```

### Reading from Chat Messages
```typescript
// In chat screen, check messages for error codes
messages.forEach(message => {
  if (hasErrorCode(message.text)) {
    const errorData = parseErrorCodeFromChat(message.text);
    console.log('Found error code:', errorData);
    // Handle error code...
  }
});
```

## Format Details

### Error Code Format
- **Pattern:** `[ERROR_CODE:XXXX-XXXX-XXXX]`
- **Rules:**
  - Uppercase letters and numbers only
  - Special characters replaced with `-`
  - Wrapped in square brackets
  - Prefixed with `ERROR_CODE:`

### Full Report Format
- **Header:** `🔴 ERROR REPORT`
- **Separator:** `━━━━━━━━━━━━━━━━━━━━`
- **Fields:**
  - `Code: [ERROR_CODE:...]`
  - `Message: ...`
  - `Context: ...`
  - `Time: ISO timestamp`
  - `Metadata: ...` (optional)

## Benefits

1. **Unique Format** - Easy to identify in chat messages
2. **Parseable** - Can extract error codes programmatically
3. **Readable** - Human-readable format for support
4. **Shareable** - Can be sent to test users or support
5. **Traceable** - Includes timestamp and context

---

**Created:** November 7, 2025  
**Status:** ✅ Ready to use



