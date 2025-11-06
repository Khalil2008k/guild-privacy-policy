# GUILD ABSOLUTE DEVELOPMENT RULES

**Mode:** Ultra-Strict / Zero-Tolerance / Full-Compliance  
**Applies To:** All tasks involving design, coding, debugging, AI integration, documentation, or audit within the GUILD system.

---

## 🧠 I. CORE PHILOSOPHY

1. **Truth is mandatory.**
2. **Never hide, simplify, or sugarcoat any issue.**
3. **Always expose every weakness, even if it makes the system look bad.**
4. **No shortcuts.**
5. **Never output "example," "placeholder," "TODO," "mock," or "sample" code unless explicitly asked.**
6. **Every implementation must be real, complete, and executable.**
7. **No assumptions without evidence.**
8. **If something is unknown, explicitly say:**
   - `UNCERTAIN: requires verification in file <path>`
9. **No fake AI or unconnected logic.**
10. **All AI systems must be real, traceable, testable, and integrated.**
11. **Fake or simulated AI logic is considered a critical defect.**

---

## 🧩 II. AI SYSTEM RULES

### Only one AI system is permitted:

**FraudDetectionService** (a.k.a. AdvancedAMLService)

- **Purpose:** detect fraudulent transactions, money laundering, fake accounts, and suspicious withdrawals.

### All other AI modules are forbidden and must be fully removed:

❌ Job Matching Engine  
❌ Proposal Generator  
❌ Image Processing / Background Remover / U²-Net  
❌ AI Job Evaluators or Suggestion Systems

### FraudDetectionService must:

1. Be implemented in `backend/src/core/FraudDetectionService.ts`
2. Contain only real rule-based or API-connected logic (no stubs).
3. Return structured JSON results:
   ```json
   {
     "riskScore": 0-100,
     "flags": ["suspicious_amount", "rapid_withdrawals"],
     "decision": "approve" | "review" | "block"
   }
   ```
4. Log every detection event in Firestore collection: `fraudAlerts/{alertId}`

### AI Health Monitoring:

Every AI module must have a `/health` endpoint returning:

```json
{
  "alive": true,
  "uptime": <seconds>,
  "lastScan": <timestamp>
}
```

If it fails, system must automatically disable AI-dependent routes.

---

## 🛡️ III. BACKEND & SECURITY RULES

1. **Zero mock logic.**
   - Every route, service, and controller must perform its documented function in full.
   - Mock data = automatic failure.

2. **Webhook Verification:**
   - Every PSP (Fatora) webhook must verify signature before processing.
   - Reject all unsigned or invalid requests.

3. **Escrow Atomicity:**
   - Escrow release and wallet updates must occur inside a Firestore transaction.
   - No separate writes allowed.

4. **Admin Protection:**
   - Every admin route requires `requireAdmin` middleware.
   - Unauthenticated or non-admin access must be instantly rejected.

5. **CORS and Origin:**
   - In production, only allow domains defined in environment variables.
   - Never leave localhost or `*` origins in deployed code.

6. **Input Sanitization:**
   - Every user-generated field (chat messages, forms, uploads) must be sanitized using a safe library.
   - No inline HTML allowed anywhere.

7. **File Upload Validation:**
   - Validate both MIME type and magic bytes before storing.
   - Reject unknown or unsafe file types immediately.

---

## 💳 IV. PAYMENT & WALLET RULES

1. **Real Wallet Logic Only.**
   - No fake balances or placeholders.
   - Always pull from Firestore `wallets/{userId}`.
   - Auto-create wallet if missing.

2. **Escrow Integrity.**
   - Escrow funds must exist in `escrows/{jobId}`.
   - Cannot be released without both client and system approval.

3. **Webhook Reliability.**
   - Implement retry queue with max 5 attempts.
   - Every failed webhook must be logged in `webhookRetries`.

4. **KYC Enforcement.**
   - Users without KYC = cannot withdraw.
   - System must verify `user.isKYCVerified === true` before processing.

5. **Precision & Auditing.**
   - All coin conversions must use `decimal.js` or equivalent.
   - Rounding errors or mismatched precision = fatal error.

---

## 🔐 V. FRONTEND RULES

1. **No hardcoded user data.**
   - Remove all test IDs, test avatars, or dummy values.

2. **Error Boundaries Mandatory.**
   - Every screen must have `<ErrorBoundary>` wrapper with fallback UI.

3. **Memory-Safe Architecture.**
   - Every Firestore listener (`onSnapshot`) must unsubscribe on unmount.

4. **No Console Logs in Production.**
   - Replace with centralized logger (`logger.info`, `logger.error`).

5. **State Management Integrity.**
   - `AuthContext` handles only auth.
   - `ProfileContext` handles only user profile.
   - No duplicate states or race conditions.

6. **Offline Safety.**
   - Implement offline message queue in chat.
   - Messages must sync on reconnect.

7. **UI Consistency.**
   - All navigation follows standard patterns (`router.push` forward, `router.replace` for overwrites).
   - Loading and error states required for all async data.

---

## 📊 VI. DATABASE RULES

1. **Security Rules Strict Mode.**
   - No `allow read: if true`.
   - Every rule must verify `request.auth`.

2. **Firestore Indexing.**
   - Must include `firestore.indexes.json`.
   - Every compound query must have matching index.

3. **Schema Integrity.**
   - Only one user collection structure (`users/{userId}`) allowed.
   - No duplicate `userProfiles` collections.

4. **Validation Required.**
   - Message length ≤ 5000 chars.
   - Wallet balance cannot be negative.
   - Transactions must include `createdAt`, `amount`, `currency`.

---

## 🧪 VII. TESTING RULES

1. **Test Coverage Minimum:**
   - Backend: ≥ 80%
   - Frontend: ≥ 60%
   - Integration (E2E): ≥ 50%

2. **Critical Tests Required:**
   - Webhook signature validation
   - Escrow release transaction
   - KYC enforcement
   - Role-based admin access
   - Memory leak detection

3. **Fail-Safe:**
   - Any test failure in CI = block deployment.
   - Tests must run automatically before every merge.

---

## ⚙️ VIII. DEVELOPMENT CONDUCT

All code changes must:

1. Pass lint (`eslint --max-warnings=0`)
2. Pass type checks (`tsc --noEmit`)
3. Pass all tests
4. Include documentation or docstring for each new function

### Prohibited Words in Source:

- "TODO"
- "mock"
- "sample"
- "placeholder"
- "temporary"

**Presence of these = automatic fail.**

### Output Discipline:

- Never say "done" unless every check passes.
- If anything remains unfinished, report precisely what and where.

---

## 🧰 IX. EXECUTION PROMPT TEMPLATE (for IDE AI)

**System Command:**

You are bound by the GUILD Absolute Development Rules.

1. Scan the entire project.
2. Remove all forbidden AI systems.
3. Keep only `FraudDetectionService`.
4. Enforce every backend, frontend, and database rule above.

For each violation, automatically correct it.

If automatic correction is not possible, comment with:

```typescript
// MANUAL ACTION REQUIRED: <exact description>
```

At completion, generate a "GUILD Integrity Report" showing:

1. Violations found
2. Fixes applied
3. Pending manual tasks
4. Compliance percentage (0–100%)

---

## 🏁 X. FINAL ENFORCEMENT

**These rules are absolute and unbreakable.**

Any attempt to bypass, simplify, fake, or misrepresent implementation quality is treated as system failure.

The AI must deliver full, precise, verified, real implementations only — or explicitly report what prevents completion.








