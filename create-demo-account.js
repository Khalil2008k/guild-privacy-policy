/**
 * Create Full Demo Account for GUILD
 * Run this script to create a complete demo user with all data
 * 
 * Usage: node create-demo-account.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./backend/config/firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'guild-4f46b'
});

const auth = admin.auth();
const db = admin.firestore();

// Demo Account Credentials
const DEMO_ACCOUNT = {
  email: 'demo@guild.app',
  password: 'Demo@2025',
  displayName: 'Sarah Al-Khalifa',
  phoneNumber: '+97433445566'
};

// Full User Profile Data
const DEMO_PROFILE = {
  // Basic Info
  displayName: 'Sarah Al-Khalifa',
  email: 'demo@guild.app',
  phoneNumber: '+97433445566',
  photoURL: 'https://i.pravatar.cc/300?img=47',
  
  // Professional Info
  title: 'Senior Full-Stack Developer',
  bio: 'Experienced full-stack developer specializing in React Native, Node.js, and Firebase. Over 5 years of experience building scalable mobile and web applications. Based in Doha, Qatar.',
  
  // Skills
  skills: [
    'React Native',
    'Node.js',
    'TypeScript',
    'Firebase',
    'MongoDB',
    'GraphQL',
    'REST APIs',
    'UI/UX Design',
    'Figma',
    'Git'
  ],
  
  // Location
  location: {
    city: 'Doha',
    country: 'Qatar',
    coordinates: {
      latitude: 25.2854,
      longitude: 51.5310
    }
  },
  
  // Stats
  stats: {
    completedJobs: 47,
    activeProposals: 3,
    rating: 4.8,
    reviewCount: 42,
    responseTime: '< 2 hours',
    completionRate: 96,
    onTimeDelivery: 98
  },
  
  // Preferences
  preferences: {
    hourlyRate: 150, // QAR per hour
    availability: 'full-time',
    preferredJobTypes: ['web-development', 'mobile-development', 'api-development'],
    remoteOnly: false,
    willingToTravel: true
  },
  
  // Social Links
  socialLinks: {
    github: 'https://github.com/sarahalkhalifa',
    linkedin: 'https://linkedin.com/in/sarahalkhalifa',
    portfolio: 'https://sarahalkhalifa.dev',
    twitter: 'https://twitter.com/sarahalkhalifa'
  },
  
  // Account Settings
  settings: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: true,
    language: 'en',
    theme: 'dark',
    privacyMode: false
  },
  
  // Metadata
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
  isVerified: true,
  isActive: true,
  accountType: 'freelancer',
  memberSince: new Date('2023-03-15'),
  
  // Verification
  verifications: {
    email: true,
    phone: true,
    identity: true,
    payment: true
  },
  
  // Badges
  badges: ['top-rated', 'verified', 'quick-responder', 'quality-work'],
  
  // Portfolio Items
  portfolio: [
    {
      id: 'p1',
      title: 'E-commerce Mobile App',
      description: 'Full-featured e-commerce app with payment integration',
      technologies: ['React Native', 'Node.js', 'Stripe'],
      imageUrl: 'https://picsum.photos/400/300?random=1',
      projectUrl: 'https://demo.app',
      completedDate: new Date('2024-10-01')
    },
    {
      id: 'p2',
      title: 'Real Estate Platform',
      description: 'Property listing platform with advanced search',
      technologies: ['React', 'Firebase', 'Google Maps API'],
      imageUrl: 'https://picsum.photos/400/300?random=2',
      projectUrl: 'https://demo2.app',
      completedDate: new Date('2024-08-15')
    },
    {
      id: 'p3',
      title: 'Fitness Tracking App',
      description: 'Mobile app for tracking workouts and nutrition',
      technologies: ['React Native', 'MongoDB', 'GraphQL'],
      imageUrl: 'https://picsum.photos/400/300?random=3',
      projectUrl: 'https://demo3.app',
      completedDate: new Date('2024-06-20')
    }
  ]
};

// Wallet Data
const DEMO_WALLET = {
  balance: 15250.50,
  currency: 'QAR',
  totalEarnings: 342500.75,
  pendingAmount: 2500.00,
  availableForWithdrawal: 12750.50,
  transactions: []
};

// Sample Reviews
const DEMO_REVIEWS = [
  {
    rating: 5,
    comment: 'Excellent work! Sarah delivered ahead of schedule and the quality exceeded expectations. Highly recommended!',
    reviewerName: 'Ahmed Al-Mansoori',
    reviewerPhoto: 'https://i.pravatar.cc/150?img=12',
    projectTitle: 'E-commerce Mobile App',
    createdAt: new Date('2024-10-05')
  },
  {
    rating: 5,
    comment: 'Very professional and great communication throughout the project. Will definitely hire again!',
    reviewerName: 'Fatima Hassan',
    reviewerPhoto: 'https://i.pravatar.cc/150?img=45',
    projectTitle: 'Real Estate Platform',
    createdAt: new Date('2024-08-20')
  },
  {
    rating: 4,
    comment: 'Good work overall. Minor revisions needed but Sarah was quick to address them.',
    reviewerName: 'Mohammed Al-Thani',
    reviewerPhoto: 'https://i.pravatar.cc/150?img=33',
    projectTitle: 'Fitness Tracking App',
    createdAt: new Date('2024-06-25')
  }
];

// Sample Active Proposals
const DEMO_PROPOSALS = [
  {
    jobTitle: 'React Native Developer Needed',
    proposedAmount: 8000,
    proposedDuration: '2 weeks',
    coverLetter: 'I have extensive experience with React Native and would love to work on this project. I can deliver high-quality code within the specified timeline.',
    status: 'pending',
    submittedAt: new Date('2025-10-14')
  },
  {
    jobTitle: 'Backend API Development',
    proposedAmount: 5500,
    proposedDuration: '10 days',
    coverLetter: 'With 5+ years of Node.js experience, I can build a robust and scalable API for your project.',
    status: 'shortlisted',
    submittedAt: new Date('2025-10-13')
  }
];

async function createDemoAccount() {
  console.log('🚀 Creating complete demo account...\n');
  
  try {
    // Step 1: Create Firebase Auth User
    console.log('1️⃣ Creating Firebase Auth user...');
    let userRecord;
    try {
      // Try to get existing user
      userRecord = await auth.getUserByEmail(DEMO_ACCOUNT.email);
      console.log('   ✅ User already exists, updating...');
      
      // Update existing user
      userRecord = await auth.updateUser(userRecord.uid, {
        displayName: DEMO_ACCOUNT.displayName,
        phoneNumber: DEMO_ACCOUNT.phoneNumber,
        emailVerified: true
      });
      
      // Update password
      await auth.updateUser(userRecord.uid, {
        password: DEMO_ACCOUNT.password
      });
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          email: DEMO_ACCOUNT.email,
          password: DEMO_ACCOUNT.password,
          displayName: DEMO_ACCOUNT.displayName,
          phoneNumber: DEMO_ACCOUNT.phoneNumber,
          emailVerified: true
        });
        console.log('   ✅ New user created');
      } else {
        throw error;
      }
    }
    
    const userId = userRecord.uid;
    console.log(`   ✅ User ID: ${userId}\n`);
    
    // Step 2: Create User Profile
    console.log('2️⃣ Creating user profile in Firestore...');
    await db.collection('users').doc(userId).set({
      ...DEMO_PROFILE,
      uid: userId,
      guildId: `GUILD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    }, { merge: true });
    console.log('   ✅ Profile created\n');
    
    // Step 3: Create Wallet
    console.log('3️⃣ Creating wallet...');
    await db.collection('wallets').doc(userId).set({
      ...DEMO_WALLET,
      userId: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('   ✅ Wallet created\n');
    
    // Step 4: Create Reviews
    console.log('4️⃣ Creating reviews...');
    for (const review of DEMO_REVIEWS) {
      await db.collection('reviews').add({
        ...review,
        freelancerId: userId,
        createdAt: admin.firestore.Timestamp.fromDate(review.createdAt)
      });
    }
    console.log(`   ✅ ${DEMO_REVIEWS.length} reviews created\n`);
    
    // Step 5: Create Proposals
    console.log('5️⃣ Creating active proposals...');
    for (const proposal of DEMO_PROPOSALS) {
      await db.collection('proposals').add({
        ...proposal,
        freelancerId: userId,
        freelancerName: DEMO_ACCOUNT.displayName,
        freelancerPhoto: DEMO_PROFILE.photoURL,
        submittedAt: admin.firestore.Timestamp.fromDate(proposal.submittedAt)
      });
    }
    console.log(`   ✅ ${DEMO_PROPOSALS.length} proposals created\n`);
    
    // Step 6: Create Notifications
    console.log('6️⃣ Creating sample notifications...');
    const notifications = [
      {
        userId: userId,
        type: 'proposal_shortlisted',
        title: 'Proposal Shortlisted!',
        message: 'Your proposal for "Backend API Development" has been shortlisted.',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        userId: userId,
        type: 'new_review',
        title: 'New Review Received',
        message: 'Ahmed Al-Mansoori left you a 5-star review!',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const notification of notifications) {
      await db.collection('notifications').add(notification);
    }
    console.log(`   ✅ ${notifications.length} notifications created\n`);
    
    // Success Summary
    console.log('═'.repeat(60));
    console.log('✅ DEMO ACCOUNT CREATED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('\n📧 Login Credentials:');
    console.log(`   Email:    ${DEMO_ACCOUNT.email}`);
    console.log(`   Password: ${DEMO_ACCOUNT.password}`);
    console.log(`   Phone:    ${DEMO_ACCOUNT.phoneNumber}`);
    console.log(`\n🆔 User Details:`);
    console.log(`   Name:     ${DEMO_ACCOUNT.displayName}`);
    console.log(`   User ID:  ${userId}`);
    console.log(`   Title:    ${DEMO_PROFILE.title}`);
    console.log(`\n💰 Wallet:`);
    console.log(`   Balance:  ${DEMO_WALLET.balance} QAR`);
    console.log(`   Earnings: ${DEMO_WALLET.totalEarnings} QAR`);
    console.log(`\n⭐ Stats:`);
    console.log(`   Rating:        ${DEMO_PROFILE.stats.rating}/5`);
    console.log(`   Reviews:       ${DEMO_PROFILE.stats.reviewCount}`);
    console.log(`   Completed:     ${DEMO_PROFILE.stats.completedJobs} jobs`);
    console.log(`   Active Bids:   ${DEMO_PROPOSALS.length}`);
    console.log(`\n🎨 Profile Includes:`);
    console.log(`   ✅ Full bio and title`);
    console.log(`   ✅ ${DEMO_PROFILE.skills.length} skills`);
    console.log(`   ✅ ${DEMO_PROFILE.portfolio.length} portfolio items`);
    console.log(`   ✅ Social links (GitHub, LinkedIn, etc.)`);
    console.log(`   ✅ Location and contact info`);
    console.log(`   ✅ Verified badges`);
    console.log(`\n🎯 Ready to use in the app!`);
    console.log('═'.repeat(60));
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error creating demo account:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
createDemoAccount();

