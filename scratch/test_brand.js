const apiKey = 'slipok-40c8943a-8f4a-4f6d-a0b2-aebb47250154';
const brandId = '31174';

const quotaUrl = `https://api.slipok.com/api/line/apikey/${brandId}/quota`;
console.log('Calling Quota URL:', quotaUrl);

fetch(quotaUrl, {
  method: 'GET',
  headers: {
    'x-authorization': apiKey
  }
}).then(async (res) => {
  const text = await res.text();
  console.log('Status code:', res.status);
  console.log('Response body:', text);
}).catch(err => {
  console.error('Fetch error:', err);
});
