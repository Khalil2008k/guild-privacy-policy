// Simple script to create the first admin user
const https = require('https');

const firebaseConfig = {
  apiKey: "AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w",
  authDomain: "guild-4f46b.firebaseapp.com",
  projectId: "guild-4f46b",
};

async function createSuperAdmin() {
  try {
    console.log('🔥 Creating super admin user...');
    
    // Call the Cloud Function directly
    const functionUrl = 'https://initializesuperadmin-afclis6h2q-uc.a.run.app';
    
    const postData = JSON.stringify({
      data: {
        email: 'admin@guild.app',
        password: 'admin123'
      }
    });

    const options = {
      hostname: 'initializesuperadmin-afclis6h2q-uc.a.run.app',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.result && response.result.success) {
            console.log('✅ Super admin created successfully!');
            console.log('📧 Email: admin@guild.app');
            console.log('🔐 Password: admin123');
            console.log('🎯 You can now login to the admin portal!');
          } else {
            console.log('⚠️ Response:', response);
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.log('Response data:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  }
}

// Run the function
createSuperAdmin();
