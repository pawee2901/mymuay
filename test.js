async function check() {
  const res = await fetch('https://gooddayotp.site.je/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const text = await res.text();
  console.log("HTML length:", text.length);
  
  const jsFiles = [...text.matchAll(/src="([^"]+\.js)[^"]*"/g)].map(m => m[1]);
  console.log("JS Files:", jsFiles);
  
  const apiMatch = text.match(/https:\/\/[a-zA-Z0-9.-]+\/api\/[a-zA-Z0-9.\/-]+/g);
  if (apiMatch) console.log("API URLs in HTML:", apiMatch);
  
  const domains = text.match(/https:\/\/[a-zA-Z0-9.-]+/g);
  if (domains) console.log("Domains:", [...new Set(domains)]);
}
check();
