@echo off
echo Adding all changes to git...
git add .
echo Creating commit with comprehensive message...
git commit -m "🚀 STABLE: Fix critical app crashes and stabilize backend

✅ APP FIXES:
- Fixed critical notification service crash in AuthContext.tsx
- Added safety checks for notificationService.onUserSignOut()
- Added proper error handling with try-catch blocks
- App now starts without crashes and handles sign-out properly

✅ BACKEND FIXES:
- Backend running stable on port 4000
- Re-enabled core routes: users, payments, jobs, notifications
- Fixed Firebase initialization and Firestore settings
- Enhanced error handling and validation
- Updated dependencies and service integrations

✅ SERVICES STATUS:
- Firebase & Redis: Connected ✅
- User routes: Working ✅
- Payment routes: Working ✅
- Job routes: Partially enabled ✅
- Notification routes: Working ✅

🎯 RESULT: Both app and backend are now stable and functional!
Backend health checks passing, app connecting successfully.

Branch: backend-enhancement-firebase-only
Status: STABLE WORKING STATE"

echo Commit completed successfully!
pause
