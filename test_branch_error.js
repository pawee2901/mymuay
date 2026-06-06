const apiKey = 'slipok-5119ca9e-7f0f-4948-b656-9279e48683f6';

async function test(branchId) {
  try {
    const res = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
      method: 'POST',
      headers: {
        'x-authorization': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ data: 'test_data' })
    });
    const data = await res.json();
    console.log(`Branch ID: ${branchId}`);
    console.log(`Status: ${res.status}`);
    console.log(`Response:`, JSON.stringify(data));
    console.log('------------------------------------');
  } catch (err) {
    console.error(`Error for branch ${branchId}:`, err.message);
  }
}

async function main() {
  await test('68219'); // User branch ID
  await test('999999'); // Random non-existent branch ID
}

main();
