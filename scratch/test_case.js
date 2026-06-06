const cases = [
  'slipok-40c8943a-8f4a-4f6d-a0b2-aebb47250154',
  'SLIPOK-40c8943a-8f4a-4f6d-a0b2-aebb47250154',
  'slipok-40C8943A-8F4A-4F6D-A0B2-AEBB47250154',
  'SLIPOK-40C8943A-8F4A-4F6D-A0B2-AEBB47250154',
  'bearer slipok-40c8943a-8f4a-4f6d-a0b2-aebb47250154',
  'Bearer slipok-40c8943a-8f4a-4f6d-a0b2-aebb47250154'
];

const branchId = '44043';

async function runTests() {
  for (const key of cases) {
    const quotaUrl = `https://api.slipok.com/api/line/apikey/${branchId}/quota`;
    try {
      const res = await fetch(quotaUrl, {
        method: 'GET',
        headers: {
          'x-authorization': key
        }
      });
      const text = await res.text();
      console.log(`Key: "${key}"`);
      console.log(`Status: ${res.status}`);
      console.log(`Body: ${text}`);
      console.log('------------------------------------');
    } catch (err) {
      console.error(`Error for key "${key}":`, err.message);
    }
  }
}

runTests();
