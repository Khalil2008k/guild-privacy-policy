const { twilioService } = require('./backend/src/services/sms/TwilioService.ts');

async function testSMS() {
  try {
    console.log('Testing SMS service...');

    // Test phone validation
    const phone = '+97472072054';
    const isValid = await twilioService.validatePhoneNumber(phone);
    console.log(`Phone ${phone} valid:`, isValid);

    // Test SMS sending
    const result = await twilioService.sendSMS({
      to: phone,
      body: 'Test SMS from Firebase system - Hello!'
    });

    console.log('SMS result:', result);

    // Test verification code generation
    const verification = await twilioService.generateVerificationCode(phone, 'phone_verification');
    console.log('Verification generated:', verification ? 'SUCCESS' : 'FAILED');

    console.log('All SMS tests completed!');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSMS();


