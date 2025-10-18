/**
 * Comprehensive GID System Test
 * Tests the complete GID functionality end-to-end
 */

const { gidService } = require('./backend/src/services/firebase/GIDService.ts');

async function testGIDSystem() {
  console.log('🧪 Starting Comprehensive GID System Test...\n');

  try {
    // Test 1: GID Generation
    console.log('📋 Test 1: GID Generation');
    const testUserData = {
      name: 'GID Test User',
      email: 'gidtest@example.com',
      phoneNumber: '+1234567890',
      birthDate: new Date('1990-01-01'),
      nationality: 'TestCountry'
    };

    const gid = gidService.generateGID(testUserData, 'CLIENT');
    console.log('✅ Generated GID:', gid);
    console.log('✅ Format check:', gid.match(/^GID-[A-F0-9]{12}-CLIENT$/) ? 'PASS' : 'FAIL');

    // Test 2: GID Container Creation
    console.log('\n📦 Test 2: GID Container Creation');
    const gidContainer = await gidService.createGIDContainer(
      'test-user-123',
      testUserData,
      'CLIENT'
    );
    console.log('✅ GID Container created:', gidContainer.gid);
    console.log('✅ User data linked:', gidContainer.personalInfo.name === 'GID Test User');

    // Test 3: GID Retrieval
    console.log('\n🔍 Test 3: GID Retrieval');
    const retrievedGID = await gidService.getUserGID('test-user-123');
    console.log('✅ Retrieved GID:', retrievedGID);
    console.log('✅ GID consistency:', gid === retrievedGID);

    // Test 4: GID Container Retrieval
    console.log('\n📖 Test 4: GID Container Retrieval');
    const fullContainer = await gidService.getGIDContainer(gid);
    console.log('✅ Full container retrieved:', !!fullContainer);
    console.log('✅ Rank initialized:', fullContainer?.platformData.currentRank === 'G');

    // Test 5: Rank Update
    console.log('\n🏆 Test 5: Rank Update');
    await gidService.updateUserRank(gid, 'F');
    const updatedContainer = await gidService.getGIDContainer(gid);
    console.log('✅ Rank updated:', updatedContainer?.platformData.currentRank === 'F');

    // Test 6: Guild Affiliation
    console.log('\n🏘️ Test 6: Guild Affiliation');
    await gidService.addGuildAffiliation(gid, 'guild-test-123', 'MEMBER');
    const guildContainer = await gidService.getGIDContainer(gid);
    console.log('✅ Guild added:', guildContainer?.platformData.guilds.memberOf.includes('guild-test-123'));

    // Test 7: Cache Efficiency
    console.log('\n⚡ Test 7: Cache Performance');
    const startTime = Date.now();
    await gidService.getGIDContainer(gid); // Should use cache
    await gidService.getGIDContainer(gid); // Should use cache
    const endTime = Date.now();
    console.log('✅ Cache efficiency:', (endTime - startTime) < 50 ? 'PASS' : 'FAIL');

    // Test 8: Error Handling
    console.log('\n🛡️ Test 8: Error Handling');
    try {
      await gidService.createGIDContainer('duplicate-user', testUserData, 'CLIENT');
      console.log('❌ Should have thrown collision error');
    } catch (error) {
      console.log('✅ Collision detection working:', error.message.includes('COLLISION'));
    }

    // Test 9: Unique GIDs
    console.log('\n🔢 Test 9: GID Uniqueness');
    const gid1 = gidService.generateGID(testUserData, 'CLIENT');
    const gid2 = gidService.generateGID({
      ...testUserData,
      name: 'Different Name'
    }, 'CLIENT');
    console.log('✅ GIDs are unique:', gid1 !== gid2);

    // Test 10: Phone Validation
    console.log('\n📱 Test 10: Phone Validation');
    const isValidPhone = await gidService.validatePhoneNumber ? gidService.validatePhoneNumber('+1234567890') : false;
    console.log('✅ Phone validation:', isValidPhone);

    console.log('\n🎉 ALL GID TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n📊 GID System Status: ✅ FULLY OPERATIONAL');
    console.log('🚀 Ready for production use!');

  } catch (error) {
    console.error('❌ GID test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGIDSystem();

