const apiKey = 'slipok-5119ca9e-7f0f-4948-b656-9279e48683f6';
const branchId = '68219';

async function test(name, headers, body) {
  try {
    const res = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log(`Test: ${name}`);
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(data));
    console.log('------------------------------------');
  } catch (err) {
    console.error(`Test ${name} failed with error:`, err.message);
  }
}

async function main() {
  console.log(`Testing with API Key: "${apiKey}" and Branch ID: "${branchId}"\n`);

  // Test 1: Standard x-authorization
  await test('1. Standard x-authorization', {
    'x-authorization': apiKey,
    'content-type': 'application/json'
  }, { data: 'test_data' });

  // Test 2: Standard X-Authorization (Capitalized)
  await test('2. Standard X-Authorization (Capitalized)', {
    'X-Authorization': apiKey,
    'content-type': 'application/json'
  }, { data: 'test_data' });

  // Test 3: Standard Authorization header
  await test('3. Standard Authorization header', {
    'Authorization': apiKey,
    'content-type': 'application/json'
  }, { data: 'test_data' });

  // Test 4: Authorization header with Bearer
  await test('4. Authorization header with Bearer', {
    'Authorization': `Bearer ${apiKey}`,
    'content-type': 'application/json'
  }, { data: 'test_data' });

  // Test 5: x-authorization with Bearer
  await test('5. x-authorization with Bearer', {
    'x-authorization': `Bearer ${apiKey}`,
    'content-type': 'application/json'
  }, { data: 'test_data' });

  // Test 6: apikey as URL parameter instead? Let's check.
}

main();
