/**
 * Artillery processor for Firebase auth simulation
 * Generates realistic Firebase tokens for load testing
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock Firebase configuration (replace with your actual config for real tests)
const MOCK_FIREBASE_CONFIG = {
  projectId: 'guild-4f46b',
  privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_FOR_TESTING\n-----END PRIVATE KEY-----\n',
  clientEmail: 'firebase-adminsdk-test@guild-4f46b.iam.gserviceaccount.com'
};

function generateMockFirebaseToken(uid, email) {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: `https://securetoken.google.com/${MOCK_FIREBASE_CONFIG.projectId}`,
    aud: MOCK_FIREBASE_CONFIG.projectId,
    auth_time: now - 300, // 5 minutes ago
    user_id: uid,
    sub: uid,
    iat: now,
    exp: now + 3600, // 1 hour from now
    email: email,
    email_verified: true,
    firebase: {
      identities: {
        email: [email]
      },
      sign_in_provider: "password"
    }
  };

  // In a real scenario, you'd use Firebase Admin SDK to create custom tokens
  // For load testing, we'll use a mock JWT
  return jwt.sign(payload, 'mock-secret-key-for-testing-only');
}

module.exports = {
  generateMockToken: generateMockFirebaseToken
};
