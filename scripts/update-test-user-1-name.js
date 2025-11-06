/**
 * Update Test User 1 Name to Arabic
 * Changes firstName from "Test" to "فهد" and lastName to "ا"
 */

const admin = require('firebase-admin');
const serviceAccount = require('../guild-4f46b-firebase-adminsdk-fbsvc-c7083f7a81.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'guild-4f46b'
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function updateTestUser1Name() {
  console.log('🔄 Updating Test User 1 name to Arabic...\n');

  try {
    // Find test user 1
    const userQuery = await db.collection('users').where('email', '==', 'testuser1@guild.app').get();
    
    if (userQuery.empty) {
      console.log('❌ testuser1 not found');
      return;
    }

    const userDoc = userQuery.docs[0];
    const userId = userDoc.id;
    console.log('✅ Found testuser1:', userId);

    // Update userProfiles collection
    const userProfileRef = db.collection('userProfiles').doc(userId);
    const userProfileDoc = await userProfileRef.get();

    if (userProfileDoc.exists) {
      await userProfileRef.update({
        firstName: 'فهد',
        lastName: 'ا',
        fullName: 'فهد - ا',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ Updated userProfiles: firstName="فهد", lastName="ا", fullName="فهد - ا"');
    } else {
      await userProfileRef.set({
        userId: userId,
        firstName: 'فهد',
        lastName: 'ا',
        fullName: 'فهد - ا',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ Created userProfiles with Arabic name');
    }

    // Update users collection displayName
    await db.collection('users').doc(userId).update({
      displayName: 'فهد - ا',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Updated users collection displayName');

    // Update Firebase Auth displayName
    try {
      await auth.updateUser(userId, {
        displayName: 'فهد - ا',
      });
      console.log('✅ Updated Firebase Auth displayName');
    } catch (authError) {
      console.log('⚠️ Could not update Firebase Auth displayName (may require admin):', authError.message);
    }

    console.log('\n✅ Test User 1 name updated successfully!');
    console.log('   First Name: فهد');
    console.log('   Last Name: ا');
    console.log('   Full Name: فهد - ا');
    
  } catch (error) {
    console.error('❌ Error updating test user 1 name:', error);
    process.exit(1);
  }
}

updateTestUser1Name()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });




