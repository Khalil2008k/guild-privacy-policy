/**
 * Test User Image Upload and AI Processing
 * 
 * This script will:
 * 1. Upload the provided user image to testuser1@guild.app
 * 2. Process it through the AI background removal system
 * 3. Show the results and how it's displayed in the app
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch').default;

// Initialize Firebase Admin
const serviceAccount = require('./guild-4f46b-firebase-adminsdk-fbsvc-c7083f7a81.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'guild-4f46b',
    storageBucket: 'guild-4f46b.firebasestorage.app'
  });
}

const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

// Configuration
const TEST_USER_EMAIL = 'testuser1@guild.app';
const TEST_USER_PASSWORD = 'TestPass123!';
const USER_IMAGE_PATH = 'C:\\Users\\Admin\\Pictures\\Screenshots\\Screenshot 2025-10-30 075058.png';
const BACKEND_API_URL = 'https://guild-backend.onrender.com';

async function findOrCreateTestUser() {
  console.log('🔍 Looking for testuser1@guild.app...');
  
  try {
    // Try to find existing user
    const user = await auth.getUserByEmail(TEST_USER_EMAIL);
    console.log('✅ Found existing test user:', user.uid);
    return user;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('👤 Creating new test user...');
      
      // Create new user
      const user = await auth.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        displayName: 'Test User 1',
        emailVerified: true
      });
      
      // Create user document in Firestore
      await db.collection('users').doc(user.uid).set({
        email: TEST_USER_EMAIL,
        displayName: 'Test User 1',
        name: 'Test User 1',
        role: 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create wallet
      await db.collection('wallets').doc(user.uid).set({
        userId: user.uid,
        balance: 5000,
        currency: 'QR',
        coins: [{ denomination: 500, quantity: 10 }],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Created new test user:', user.uid);
      return user;
    } else {
      throw error;
    }
  }
}

async function uploadImageToFirebaseStorage(userId, imagePath) {
  console.log('📤 Uploading image to Firebase Storage...');
  
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    const fileName = `profileImages/${userId}/${Date.now()}.jpg`;
    
    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const file = bucket.file(fileName);
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          uploadedBy: userId,
          originalName: path.basename(imagePath)
        }
      }
    });
    
    // Get download URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365 // 1 year
    });
    
    console.log('✅ Image uploaded to Firebase Storage:', url);
    return url;
  } catch (error) {
    console.error('❌ Error uploading to Firebase Storage:', error);
    throw error;
  }
}

async function processImageWithAI(imagePath) {
  console.log('🤖 Processing image with AI background removal...');
  
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Create FormData for API call
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test-user-image.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('qualityThreshold', '0.7');
    formData.append('backgroundRemovalMethod', 'grabcut');
    formData.append('enableFallback', 'true');
    formData.append('enableCaching', 'true');
    
    // Call AI service
    const response = await fetch(`${BACKEND_API_URL}/api/profile-picture-ai/process`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer test-token', // You might need to adjust this
        ...formData.getHeaders()
      }
    });
    
    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    console.log('✅ AI processing result:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Error processing with AI:', error);
    throw error;
  }
}

async function updateUserProfile(userId, imageUrl) {
  console.log('👤 Updating user profile with processed image...');
  
  try {
    // Update user document with new photoURL
    await db.collection('users').doc(userId).update({
      photoURL: imageUrl,
      profileImage: imageUrl, // Some components use this field
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ User profile updated with image URL:', imageUrl);
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
}

async function displayUserProfile(userId) {
  console.log('📱 Fetching user profile to see how image is displayed...');
  
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    console.log('\n📋 USER PROFILE DATA:');
    console.log('═'.repeat(50));
    console.log('User ID:', userId);
    console.log('Email:', userData.email);
    console.log('Display Name:', userData.displayName);
    console.log('Photo URL:', userData.photoURL);
    console.log('Profile Image:', userData.profileImage);
    console.log('Updated At:', userData.updatedAt?.toDate());
    console.log('═'.repeat(50));
    
    return userData;
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting User Image Upload and AI Processing Test...\n');
    
    // Check if image file exists
    if (!fs.existsSync(USER_IMAGE_PATH)) {
      throw new Error(`Image file not found: ${USER_IMAGE_PATH}`);
    }
    
    console.log('📸 Image file found:', USER_IMAGE_PATH);
    console.log('📏 File size:', (fs.statSync(USER_IMAGE_PATH).size / 1024).toFixed(2), 'KB\n');
    
    // Step 1: Find or create test user
    const user = await findOrCreateTestUser();
    
    // Step 2: Upload image to Firebase Storage
    const imageUrl = await uploadImageToFirebaseStorage(user.uid, USER_IMAGE_PATH);
    
    // Step 3: Process image with AI (if backend is running)
    try {
      const aiResult = await processImageWithAI(USER_IMAGE_PATH);
      
      if (aiResult.success && aiResult.result) {
        console.log('🎨 AI Background Removal Results:');
        console.log('  - Processing Time:', aiResult.result.processingTime, 'ms');
        console.log('  - Quality Score:', aiResult.result.quality?.overall || 'N/A');
        console.log('  - Confidence:', aiResult.result.confidence || 'N/A');
        console.log('  - Processed Image URL:', aiResult.result.processedImageUrl || 'N/A');
        
        // Use AI processed image if available
        if (aiResult.result.processedImageUrl) {
          await updateUserProfile(user.uid, aiResult.result.processedImageUrl);
        } else {
          await updateUserProfile(user.uid, imageUrl);
        }
      } else {
        console.log('⚠️ AI processing failed, using original image');
        await updateUserProfile(user.uid, imageUrl);
      }
    } catch (aiError) {
      console.log('⚠️ AI service not available, using original image');
      await updateUserProfile(user.uid, imageUrl);
    }
    
    // Step 4: Display final user profile
    await displayUserProfile(user.uid);
    
    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📱 HOW TO VIEW IN APP:');
    console.log('1. Open the GUILD app');
    console.log('2. Sign in with: testuser1@guild.app / TestPass123!');
    console.log('3. Go to Profile tab');
    console.log('4. Check how the image is displayed');
    console.log('5. Go to Profile Settings to see the avatar');
    
    console.log('\n🔍 WHAT TO LOOK FOR:');
    console.log('- Background removal (if AI worked)');
    console.log('- Image quality and display');
    console.log('- How the image appears in different UI components');
    console.log('- Any processing artifacts or issues');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
main();
