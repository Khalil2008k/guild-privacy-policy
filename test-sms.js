const http = require('http');

const testSMS = async () => {
  const postData = JSON.stringify({
    phoneNumber: '+1234567890'
  });

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/auth/sms/send-verification-code',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response status:', res.statusCode);
      console.log('Response body:', data);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(postData);
  req.end();
};

testSMS();


