const apiKey = 'slipok-40c8943a-8f4a-4f6d-a0b2-aebb47250154';
const branchId = '44043';

const urls = [
  `http://api.slipok.com/api/line/apikey/${branchId}/quota`,
  `https://api.slipok.com/api/line/apikey/${branchId}/quota`
];

async function runTests() {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-authorization': apiKey
        }
      });
      const text = await res.text();
      console.log(`URL: "${url}"`);
      console.log(`Status: ${res.status}`);
      console.log(`Body: ${text}`);
      console.log('------------------------------------');
    } catch (err) {
      console.error(`Error for URL "${url}":`, err.message);
    }
  }
}

runTests();
