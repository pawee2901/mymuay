fetch(`https://api.slipok.com/api/line/apikey/44043`, {
  method: 'POST',
  headers: {
    'x-authorization': 'completely-fake-api-key'
  }
}).then(async (res) => {
  const text = await res.text();
  console.log('Fake Key Response code:', res.status);
  console.log('Fake Key Response body:', text);
}).catch(err => {
  console.error('Fetch error:', err);
});
