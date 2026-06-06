const https = require('https');

https.get('https://www.wondd.com/game/garena/index.php?id=9601', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('HTML Length:', data.length);
    // Find where boxprice or boxpriceadditionnal appears
    let index = 0;
    while ((index = data.indexOf('boxprice', index)) !== -1) {
      console.log('Found boxprice at index:', index);
      console.log(data.substring(index - 100, index + 300));
      index += 8;
    }
  });
}).on('error', (err) => {
  console.error(err);
});
