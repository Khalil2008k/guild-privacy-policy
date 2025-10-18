/**
 * Create Test Jobs Script
 * Adds sample jobs to Firebase for testing
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, updateDoc, doc } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

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
const db = getFirestore(app);
const auth = getAuth(app);

// Sample jobs data
const testJobs = [
  {
    title: "React Native Developer",
    description: "Looking for an experienced React Native developer to build a mobile app for our startup. The app will include features like user authentication, payment integration, and real-time chat functionality.",
    category: "development",
    budget: "5000-8000",
    location: "Doha, Qatar",
    timeNeeded: "3-4 weeks",
    skills: ["React Native", "JavaScript", "TypeScript", "Firebase"],
    isUrgent: true,
    status: "open",
    adminStatus: "approved",
    clientId: "test-client-1",
    clientName: "Tech Startup Inc",
    offers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "UI/UX Designer for E-commerce App",
    description: "We need a talented UI/UX designer to create beautiful and user-friendly designs for our e-commerce mobile application. Experience with mobile app design is required.",
    category: "design",
    budget: "3000-5000",
    location: "Remote",
    timeNeeded: "2 weeks",
    skills: ["Figma", "Adobe XD", "Mobile Design", "Prototyping"],
    isUrgent: false,
    status: "open",
    adminStatus: "approved",
    clientId: "test-client-2",
    clientName: "E-commerce Solutions",
    offers: [],
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(),
  },
  {
    title: "Social Media Marketing Specialist",
    description: "Seeking a social media marketing expert to help promote our new mobile app launch. Need someone who can create engaging content and manage campaigns across multiple platforms.",
    category: "marketing",
    budget: "2000-3500",
    location: "Doha, Qatar",
    timeNeeded: "1 month",
    skills: ["Social Media", "Content Creation", "Instagram", "Facebook Ads"],
    isUrgent: true,
    status: "open",
    adminStatus: "approved",
    clientId: "test-client-3",
    clientName: "Digital Marketing Agency",
    offers: [],
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(),
  },
  {
    title: "Backend API Developer",
    description: "Need a backend developer to build RESTful APIs for our mobile application. Experience with Node.js, Express, and database design is essential.",
    category: "development",
    budget: "4000-6000",
    location: "Remote",
    timeNeeded: "3 weeks",
    skills: ["Node.js", "Express", "MongoDB", "REST APIs"],
    isUrgent: false,
    status: "open",
    adminStatus: "approved",
    clientId: "test-client-4",
    clientName: "Tech Solutions Ltd",
    offers: [],
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedAt: new Date(),
  },
  {
    title: "Mobile App Tester",
    description: "Looking for a QA tester to thoroughly test our new mobile application before launch. Need someone with experience in mobile app testing and bug reporting.",
    category: "other",
    budget: "1500-2500",
    location: "Doha, Qatar",
    timeNeeded: "1 week",
    skills: ["QA Testing", "Mobile Testing", "Bug Reporting", "Test Cases"],
    isUrgent: true,
    status: "open",
    adminStatus: "approved",
    clientId: "test-client-5",
    clientName: "App Testing Services",
    offers: [],
    createdAt: new Date(Date.now() - 345600000), // 4 days ago
    updatedAt: new Date(),
  }
];

async function createTestJobs() {
  console.log('🧪 Creating test jobs...');

  try {
    for (const jobData of testJobs) {
      const docRef = await addDoc(collection(db, 'jobs'), jobData);
      console.log(`✅ Created job: ${jobData.title} (ID: ${docRef.id})`);
    }

    console.log('🎉 All test jobs created successfully!');
    console.log(`📊 Created ${testJobs.length} test jobs in Firebase`);
  } catch (error) {
    console.error('❌ Error creating test jobs:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
createTestJobs();
