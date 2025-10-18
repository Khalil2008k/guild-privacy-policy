/**
 * Quick Fatora Payment Test
 * Run this to test if your Fatora integration works
 * 
 * Usage: node test-fatora-payment.js
 */

const axios = require('axios');

// Your TEST API Key (confirmed safe to use!)
const FATORA_TEST_KEY = 'E4B73FEE-F492-4607-A38D-852B0EBC91C9';
const FATORA_API_URL = 'https://api.fatora.io/v1';

console.log('🧪 Testing Fatora Payment Integration...\n');

async function testFatoraPayment() {
  try {
    console.log('📤 Creating test payment...');
    
    const payload = {
      amount: 100.00,
      currency: 'QAR',
      order_id: `TEST-${Date.now()}`,
      client: {
        name: 'Test User',
        phone: '+97433445566',
        email: 'test@guild.app'
      },
      language: 'en',
      success_url: 'http://192.168.1.34:5000/api/payments/success',
      failure_url: 'http://192.168.1.34:5000/api/payments/failure',
      save_token: true,
      note: 'GUILD Test Payment - Safe to ignore'
    };

    console.log('📋 Payment Details:');
    console.log('   Amount:   ', payload.amount, 'QAR');
    console.log('   Order ID: ', payload.order_id);
    console.log('   Client:   ', payload.client.name);
    console.log('   Email:    ', payload.client.email);
    console.log();

    const response = await axios.post(
      `${FATORA_API_URL}/payments/checkout`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'api_key': FATORA_TEST_KEY
        },
        timeout: 10000
      }
    );

    console.log('✅ Payment Created Successfully!\n');
    console.log('════════════════════════════════════════════════════════');
    console.log('🎉 PAYMENT DETAILS:');
    console.log('════════════════════════════════════════════════════════');
    
    if (response.data.payment_url) {
      console.log('\n💳 Payment URL:');
      console.log('   ', response.data.payment_url);
      console.log('\n📝 Instructions:');
      console.log('   1. Copy the URL above');
      console.log('   2. Open it in your browser');
      console.log('   3. Use a test card to complete payment');
      console.log('\n🎴 Test Card (if needed):');
      console.log('   Card Number: 4111 1111 1111 1111');
      console.log('   Expiry:      12/25');
      console.log('   CVV:         123');
    }
    
    if (response.data.payment_id) {
      console.log('\n🆔 Payment ID:');
      console.log('   ', response.data.payment_id);
    }
    
    console.log('\n════════════════════════════════════════════════════════');
    console.log('✅ Fatora Integration Working!');
    console.log('════════════════════════════════════════════════════════\n');

    // Show full response for debugging
    console.log('📊 Full Response:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Payment Creation Failed!\n');
    console.log('════════════════════════════════════════════════════════');
    console.log('ERROR DETAILS:');
    console.log('════════════════════════════════════════════════════════');
    
    if (error.response) {
      // Server responded with error
      console.log('\n🔴 API Error:');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data?.message || 'Unknown error');
      console.log('\n📋 Response Data:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // Request made but no response
      console.log('\n🔴 Network Error:');
      console.log('   Could not reach Fatora API');
      console.log('   Check your internet connection');
    } else {
      // Something else happened
      console.log('\n🔴 Error:');
      console.log('   ', error.message);
    }
    
    console.log('\n════════════════════════════════════════════════════════');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify API key is correct');
    console.log('   3. Check Fatora API status');
    console.log('   4. Contact Fatora support if issue persists');
    console.log('════════════════════════════════════════════════════════\n');
  }
}

// Run the test
testFatoraPayment();

