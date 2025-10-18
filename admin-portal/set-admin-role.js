const admin = require('firebase-admin');

// Initialize Firebase Admin with your project
admin.initializeApp({
  projectId: 'guild-4f46b'
});

async function setAdminRole() {
  try {
    const userUid = 'd94kK9YWrgdevASG58BZ5NQDJWt1'; // UID of admin@guild.app
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userUid, {
      role: 'super_admin'
    });
    
    console.log('✅ SUCCESS: Admin role set for admin@guild.app');
    console.log('🎯 You can now login to the admin portal!');
    console.log('');
    console.log('Login Credentials:');
    console.log('Email: admin@guild.app');
    console.log('Password: admin123');
    console.log('');
    console.log('🚀 Open admin portal: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
  }
  
  process.exit(0);
}

setAdminRole();
