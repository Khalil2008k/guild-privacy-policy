/**
 * Error Code Formatter Utility
 * Formats error codes in a unique, shareable format for chat
 */

export interface ErrorCodeData {
  errorCode: string;
  errorMessage?: string;
  timestamp?: Date;
  context?: string;
  metadata?: Record<string, any>;
}

/**
 * Format error code in a unique, shareable format
 * Format: [ERROR_CODE:XXXX-XXXX-XXXX]
 */
export function formatErrorCodeForChat(errorCode: string): string {
  // Format: [ERROR_CODE:XXXX-XXXX-XXXX]
  // Example: [ERROR_CODE:PAY-401-AUTH]
  const formatted = errorCode.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  return `[ERROR_CODE:${formatted}]`;
}

/**
 * Format full error details for chat sharing
 * Creates a structured, readable format that can be parsed
 */
export function formatErrorForChat(data: ErrorCodeData): string {
  const { errorCode, errorMessage, timestamp, context, metadata } = data;
  
  const parts: string[] = [];
  
  // Header
  parts.push('🔴 ERROR REPORT');
  parts.push('━━━━━━━━━━━━━━━━━━━━');
  
  // Error Code (unique format)
  parts.push(`Code: ${formatErrorCodeForChat(errorCode)}`);
  
  // Error Message
  if (errorMessage) {
    parts.push(`Message: ${errorMessage}`);
  }
  
  // Context
  if (context) {
    parts.push(`Context: ${context}`);
  }
  
  // Timestamp
  const timeStr = timestamp 
    ? timestamp.toISOString() 
    : new Date().toISOString();
  parts.push(`Time: ${timeStr}`);
  
  // Metadata (if any)
  if (metadata && Object.keys(metadata).length > 0) {
    parts.push('Metadata:');
    Object.entries(metadata).forEach(([key, value]) => {
      parts.push(`  ${key}: ${JSON.stringify(value)}`);
    });
  }
  
  // Footer
  parts.push('━━━━━━━━━━━━━━━━━━━━');
  
  return parts.join('\n');
}

/**
 * Parse error code from chat message
 * Extracts error code from formatted chat message
 */
export function parseErrorCodeFromChat(message: string): ErrorCodeData | null {
  try {
    // Look for [ERROR_CODE:XXXX-XXXX-XXXX] format
    const errorCodeMatch = message.match(/\[ERROR_CODE:([^\]]+)\]/);
    if (!errorCodeMatch) {
      return null;
    }
    
    const errorCode = errorCodeMatch[1];
    
    // Parse other fields
    const lines = message.split('\n');
    const data: ErrorCodeData = {
      errorCode,
    };
    
    lines.forEach(line => {
      if (line.startsWith('Message: ')) {
        data.errorMessage = line.replace('Message: ', '');
      } else if (line.startsWith('Context: ')) {
        data.context = line.replace('Context: ', '');
      } else if (line.startsWith('Time: ')) {
        const timeStr = line.replace('Time: ', '');
        data.timestamp = new Date(timeStr);
      } else if (line.startsWith('  ') && data.metadata) {
        // Metadata line
        const [key, ...valueParts] = line.trim().split(': ');
        if (key && valueParts.length > 0) {
          if (!data.metadata) {
            data.metadata = {};
          }
          try {
            data.metadata[key] = JSON.parse(valueParts.join(': '));
          } catch {
            data.metadata[key] = valueParts.join(': ');
          }
        }
      } else if (line === 'Metadata:') {
        data.metadata = {};
      }
    });
    
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Check if message contains error code
 */
export function hasErrorCode(message: string): boolean {
  return /\[ERROR_CODE:[^\]]+\]/.test(message);
}

/**
 * Extract just the error code from message
 */
export function extractErrorCode(message: string): string | null {
  const match = message.match(/\[ERROR_CODE:([^\]]+)\]/);
  return match ? match[1] : null;
}



