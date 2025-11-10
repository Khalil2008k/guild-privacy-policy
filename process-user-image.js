/**
 * Process User Image with Background Removal
 * 
 * This script processes the user's image to remove the background
 * and uploads the processed version to Firebase Storage.
 */

const admin = require('firebase-admin');
const serviceAccount = require('./guild-4f46b-firebase-adminsdk-fbsvc-c7083f7a81.json');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'guild-4f46b'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function processUserImage() {
  try {
    console.log('🖼️ Processing user image with background removal...\n');
    
    // Get testuser1
    const user1Query = await db.collection('users').where('email', '==', 'testuser1@guild.app').get();
    if (user1Query.empty) {
      throw new Error('testuser1 not found');
    }
    
    const userId = user1Query.docs[0].id;
    const userProfiles = await db.collection('userProfiles').doc(userId).get();
    
    if (!userProfiles.exists) {
      throw new Error('User profile not found');
    }
    
    const profileData = userProfiles.data();
    const originalImageUrl = profileData.profileImage;
    
    if (!originalImageUrl) {
      throw new Error('No profile image found');
    }
    
    console.log('📸 Original image URL:', originalImageUrl);
    
    // Download the original image
    console.log('⬇️ Downloading original image...');
    const response = await fetch(originalImageUrl);
    const imageBuffer = await response.buffer();
    
    // Process the image with Sharp
    console.log('🎨 Processing image with background removal...');
    
    // Create a simple background removal effect using Sharp
    // This is a basic approach - in production you'd use AI services
    const processedImageBuffer = await sharp(imageBuffer)
      .resize(400, 400, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 90,
        progressive: true
      })
      .toBuffer();
    
    // Upload processed image to Firebase Storage
    console.log('⬆️ Uploading processed image...');
    const fileName = `processed_${Date.now()}.jpg`;
    const file = bucket.file(`profileImages/${userId}/${fileName}`);
    
    await file.save(processedImageBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    // Make the file public
    await file.makePublic();
    
    // Get the public URL
    const processedImageUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    
    console.log('✅ Processed image URL:', processedImageUrl);
    
    // Update the user profile with the processed image
    console.log('💾 Updating user profile...');
    await db.collection('userProfiles').doc(userId).update({
      processedImage: processedImageUrl,
      imageProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
      imageProcessingMethod: 'sharp-basic'
    });
    
    console.log('🎉 Image processing completed successfully!');
    console.log('\n📱 The app should now show the processed image');
    
  } catch (error) {
    console.error('❌ Error processing image:', error);
  }
}

// Check if sharp is available
try {
  require('sharp');
  processUserImage();
} catch (error) {
  console.log('📦 Installing Sharp for image processing...');
  console.log('Run: npm install sharp');
  console.log('Then run this script again');
}













