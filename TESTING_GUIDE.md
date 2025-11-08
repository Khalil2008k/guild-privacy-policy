# 🚀 Chat System Testing Guide

## Quick Start (5 minutes)

### 1. Start Firebase Emulators
```bash
# Terminal 1: Start Firebase emulators
firebase emulators:start --import=./seed --export-on-exit

# Terminal 2: Start backend (if using)
pnpm --filter backend dev
```

### 2. Create Test Users & Chats
```bash
# Create test users and chats
node scripts/create-test-users.js
```

### 3. Run Comprehensive Tests
```bash
# Run all tests
chmod +x scripts/run-tests.sh
./scripts/run-tests.sh
```

## Test Users Created

| User | Email | UID | Phone |
|------|-------|-----|-------|
| User A | testuser-a@guild.app | test-user-a | +1234567890 |
| User B | testuser-b@guild.app | test-user-b | +1234567891 |

## Test Chats Created

| Chat ID | Type | Storage | Participants |
|---------|------|---------|--------------|
| direct-userA-userB | Personal | Local Storage | User A, User B |
| job-1234 | Job | Firestore | User A, User B |

## Manual Testing Checklist

### Core Functionality (20 minutes)

#### A. Text Messages
- [ ] Send text message in job chat (job-1234)
- [ ] Send text message in personal chat (direct-userA-userB)
- [ ] Verify messages appear on other device
- [ ] Test message ordering and timestamps

#### B. Media Messages
- [ ] Record and send voice message (5+ seconds)
- [ ] Record and send video message (10+ seconds)
- [ ] Verify thumbnails display correctly
- [ ] Test playback functionality
- [ ] Check file size limits (voice: 10MB, video: 50MB)

#### C. Real-time Features
- [ ] Test typing indicators (appear/disappear correctly)
- [ ] Test presence (online/offline status)
- [ ] Test read receipts (mark as "Seen")
- [ ] Test message status (sent/delivered/read)

### Performance Testing (10 minutes)

#### A. Latency Tests
- [ ] Message send latency < 800ms (emulator)
- [ ] Message send latency < 300ms (real device)
- [ ] Chat list load time < 1 second
- [ ] Media upload progress indicators

#### B. Concurrent Users
- [ ] Multiple users in same chat
- [ ] Multiple chats open simultaneously
- [ ] Background/foreground app switching

### Security Testing (10 minutes)

#### A. Permissions
- [ ] Non-participants cannot access chat
- [ ] Users can only read their own messages
- [ ] Admin can access all chats
- [ ] File upload size limits enforced

#### B. Data Validation
- [ ] Malicious file uploads blocked
- [ ] XSS prevention in messages
- [ ] SQL injection prevention
- [ ] Rate limiting on API calls

## Automated Test Results

The test suite will generate a report showing:

- ✅ **Passed Tests**: Core functionality working
- ❌ **Failed Tests**: Issues that need fixing
- 📊 **Performance Metrics**: Latency and throughput
- 🔒 **Security Validation**: Rules and permissions

## Common Issues & Fixes

### Issue: "Typing..." stuck
**Fix**: Clear typing indicators on disconnect
```javascript
// In PresenceService.disconnectUser()
await updateDoc(doc(db, "chats", chatId), { 
  [`typing.${uid}`]: deleteField() 
});
```

### Issue: Upload stalls
**Fix**: Add retry logic and progress indicators
```javascript
const tryUpload = async (fn) => {
  try { return await fn(); }
  catch (e) { await delay(800); return await fn(); }
};
```

### Issue: Firestore permissions denied
**Fix**: Check participant validation in rules
```javascript
function isParticipant(chatId) {
  return request.auth != null &&
    (request.auth.uid in get(/databases/(default)/documents/chats/$(chatId)).data.participants);
}
```

### Issue: Missing indexes
**Fix**: Add required Firestore indexes
```bash
firebase deploy --only firestore:indexes
```

## Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Message Send Latency | < 300ms | TBD |
| Chat List Load | < 1s | TBD |
| Media Upload | < 5s | TBD |
| Concurrent Users | 100+ | TBD |

## Production Readiness Checklist

- [ ] All automated tests passing
- [ ] Manual testing completed
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Backup strategy defined

## Support

For issues or questions:
1. Check the test report (`test-report.md`)
2. Review console logs with `LOG_LEVEL=debug`
3. Use Firebase Emulator UI for debugging
4. Check Firestore/Storage rules in console

---

**Happy Testing! 🎉**














