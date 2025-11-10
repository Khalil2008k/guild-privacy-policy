# Console.log Replacement Guide

## Overview

Found **1,770 console.log statements** across 204 files. These should be replaced with a logger utility.

## Current Issues

- Performance degradation in production
- Potential security leak of sensitive data
- Violates ABSOLUTE_RULES.md Section V.4

## Solution

Replace all `console.log` with logger utility wrapped in `__DEV__` checks.

### Before:
```typescript
console.log('Processing payment...');
console.error('Payment failed:', error);
```

### After:
```typescript
import { logger } from '@/utils/logger';

if (__DEV__) {
  logger.debug('Processing payment...');
} else {
  logger.info('Processing payment...');
}

logger.error('Payment failed:', error);
```

## Automated Replacement

Use this regex find/replace:

**Find:**
```
console\.log\(([^)]+)\);
```

**Replace:**
```
if (__DEV__) { logger.debug($1); } else { logger.info($1); }
```

## Manual Review Required

- Review each replacement for context
- Ensure sensitive data is not logged
- Use appropriate log levels (debug, info, warn, error)

## Files with Most Console.logs

- `src/components/RealU2NetBackgroundRemover.js` - 8+ instances
- `src/services/ProductionU2NetService.js` - Multiple instances
- `backend/src/server.ts` - Startup logs (acceptable)









