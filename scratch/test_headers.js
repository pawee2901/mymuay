const apiKey = 'slipok-40c8943a-8f4a-4f6d-a0b2-aebb47250154';
const branchId = '44043';

const url = `https://api.slipok.com/api/line/apikey/${branchId}/quota`;

async function runTest() {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-authorization': apiKey,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text}`);
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

runTest();
