# Guild App Setup Guide

## Prerequisites Installation

### 1. Install Node.js

**Option A: Using Docker (Recommended)**
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Then run the app in a Docker container
docker run -it --rm -v ${PWD}:/app -w /app node:18-alpine sh
```

**Option B: Direct Installation**
1. Download Node.js 18+ from https://nodejs.org/
2. Install Node.js and npm
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### 2. Install Expo CLI
```bash
npm install -g @expo/cli
```

## Project Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Download Arabic Fonts
Download the following fonts and place them in `src/assets/fonts/`:
- NotoSansArabic-Regular.ttf
- NotoSansArabic-Bold.ttf
- NotoSansArabic-Medium.ttf

**Download Links:**
- https://fonts.google.com/noto/specimen/Noto+Sans+Arabic

### 3. Configure Firebase
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore and Realtime Database
3. Update `src/app/config/firebase.ts` with your configuration

### 4. Start Development
```bash
npm start
```

## Testing

### Expo Go Testing
1. Install Expo Go on your device
2. Scan the QR code from the development server
3. Test the app on your device

### Flipper Debugging
1. Install Flipper from https://fbflipper.com/
2. The app will automatically connect to Flipper in development mode

## Troubleshooting

### Common Issues
- **Font Loading Errors**: Ensure Arabic fonts are in the correct directory
- **Firebase Connection**: Verify Firebase configuration
- **RTL Issues**: Check I18nManager settings in `_layout.tsx`

### Performance Tips
- Use Expo Go for quick testing
- Use Flipper for detailed debugging
- Enable Hermes engine for better performance

## Next Steps
1. Customize the app branding
2. Add your Firebase configuration
3. Test on real devices
4. Deploy to app stores
