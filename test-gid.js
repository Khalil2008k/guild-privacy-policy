const { gidService } = require('./backend/src/services/firebase/GIDService.ts');

async function testGID() {
  try {
    console.log('Testing GID system...');

    // Test GID generation
    const testUserData = {
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      birthDate: new Date('1990-01-01'),
      nationality: 'TestCountry'
    };

    const gid = gidService.generateGID(testUserData, 'CLIENT');
    console.log('Generated GID:', gid);

    // Test GID container creation
    const gidContainer = await gidService.createGIDContainer(
      'test-user-id',
      testUserData,
      'CLIENT'
    );

    console.log('GID container created:', gidContainer.gid);

    // Test GID retrieval
    const retrievedGID = await gidService.getUserGID('test-user-id');
    console.log('Retrieved GID:', retrievedGID);

    console.log('GID system test completed successfully!');

  } catch (error) {
    console.error('GID test failed:', error.message);
  }
}

testGID();


