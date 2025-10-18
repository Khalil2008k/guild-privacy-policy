/**
 * Create Test Users Script
 * Adds sample users to Firebase Auth and Firestore
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, setDoc, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCj9j5J4X8n8X8n8X8n8X8n8X8n8X8n8X8n8",
  authDomain: "guild-4f46b.firebaseapp.com",
  projectId: "guild-4f46b",
  storageBucket: "guild-4f46b.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcd1234efgh5678"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test users data
const testUsers = [
  {
    email: "john.developer@email.com",
    password: "password123",
    profile: {
      uid: "test-user-1",
      firstName: "John",
      lastName: "Developer",
      displayName: "John Developer",
      email: "john.developer@email.com",
      phoneNumber: "+97412345678",
      profileImage: null,
      bio: "Experienced React Native developer with 5+ years of experience",
      skills: ["React Native", "JavaScript", "TypeScript", "Node.js"],
      rating: 4.8,
      completedJobs: 15,
      rank: "S",
      guildId: null,
      guildRole: null,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
  {
    email: "sarah.designer@email.com",
    password: "password123",
    profile: {
      uid: "test-user-2",
      firstName: "Sarah",
      lastName: "Designer",
      displayName: "Sarah Designer",
      email: "sarah.designer@email.com",
      phoneNumber: "+97487654321",
      profileImage: null,
      bio: "Creative UI/UX designer specializing in mobile applications",
      skills: ["UI/UX Design", "Figma", "Adobe XD", "Prototyping"],
      rating: 4.9,
      completedJobs: 22,
      rank: "S",
      guildId: null,
      guildRole: null,
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
  {
    email: "mike.freelancer@email.com",
    password: "password123",
    profile: {
      uid: "test-user-3",
      firstName: "Mike",
      lastName: "Freelancer",
      displayName: "Mike Freelancer",
      email: "mike.freelancer@email.com",
      phoneNumber: "+97455556666",
      profileImage: null,
      bio: "Full-stack developer and digital marketing specialist",
      skills: ["React", "Node.js", "Digital Marketing", "SEO"],
      rating: 4.6,
      completedJobs: 8,
      rank: "A",
      guildId: null,
      guildRole: null,
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
];

async function createTestUsers() {
  console.log('👥 Creating test users...');

  try {
    for (const userData of testUsers) {
      try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const user = userCredential.user;

        console.log(`✅ Created auth user: ${userData.profile.firstName} (${user.uid})`);

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), userData.profile);

        // Create wallet for user
        await setDoc(doc(db, 'wallets', user.uid), {
          uid: user.uid,
          balance: 1000, // Starting balance
          currency: 'QAR',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✅ Created profile for: ${userData.profile.firstName}`);

      } catch (userError) {
        console.error(`❌ Error creating user ${userData.email}:`, userError.message);
      }
    }

    console.log('🎉 All test users created successfully!');
    console.log(`📊 Created ${testUsers.length} test users`);
    console.log('\n🔐 User credentials:');
    testUsers.forEach(user => {
      console.log(`   ${user.profile.firstName}: ${user.email} / ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error in createTestUsers:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
createTestUsers();
