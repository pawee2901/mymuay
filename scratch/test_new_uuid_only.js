const apiKey = '5119ca9e-7f0f-4948-b656-9279e48683f6';
const branchId = '68219';

const quotaUrl = `https://api.slipok.com/api/line/apikey/${branchId}/quota`;
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
