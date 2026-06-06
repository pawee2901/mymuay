const fs = require('fs');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const keywords = ['GMAIL', 'Gmail', 'Canva', 'ChatGPT', 'Outlook', 'Premium', 'premium'];

keywords.forEach((keyword) => {
  console.log(`\n--- Searching logs for: "${keyword}" ---`);
  let found = 0;
  lines.forEach((line) => {
    if (!line.trim()) return;
    if (line.includes(keyword) && !line.includes('scan_categories.js') && !line.includes('scan_brain.js') && !line.includes('read_logs.js')) {
      found++;
      if (found <= 8) {
        try {
          const data = JSON.parse(line);
          console.log(`Step ${data.step_index} (${data.type}):`);
          const idx = line.indexOf(keyword);
          console.log('  Context:', line.substring(Math.max(0, idx - 150), Math.min(line.length, idx + 250)));
        } catch (err) {
          const idx = line.indexOf(keyword);
          console.log('  Context (non-JSON):', line.substring(Math.max(0, idx - 150), Math.min(line.length, idx + 250)));
        }
      }
    }
  });
  console.log(`Found ${found} occurrences.`);
});
