// Node.js script to set up admin user in Firebase
// Run with: node setup-admin-user.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  // You'll need to download your service account key from Firebase Console
  // Go to: Project Settings > Service Accounts > Generate New Private Key
  // Then replace this with your actual service account data
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://guild-4f46b-default-rtdb.firebaseio.com'
  });
}

async function setupAdminUser() {
  try {
    const email = 'admin@guild.app';
    const password = 'admin123';
    
    // Create or get user
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('✅ Admin user already exists:', userRecord.uid);
    } catch (error) {
      // User doesn't exist, create them
      userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: 'Guild Admin',
        emailVerified: true,
      });
      console.log('✅ Admin user created:', userRecord.uid);
    }

    // Set admin role custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'super_admin'
    });
    
    console.log('✅ Admin role set for user:', userRecord.uid);
    
    // Create user document in Firestore
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: 'Guild Admin',
      status: 'active',
      verificationStatus: 'verified',
      rank: 'SSS', // Highest rank
      guild: null,
      guildRole: null,
      completedJobs: 0,
      earnings: 0,
      isOnline: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log('✅ Admin user document created in Firestore');
    console.log('');
    console.log('🎯 Admin Portal Setup Complete!');
    console.log('');
    console.log('Login Credentials:');
    console.log('Email: admin@guild.app');
    console.log('Password: admin123');
    console.log('');
    console.log('The admin user is now ready to access the Guild Admin Portal.');
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  }
}

// Run the setup
setupAdminUser().then(() => {
  console.log('Setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
