const fs = require('fs');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Scanning all lines for Gmail, Canva, ChatGPT...');

lines.forEach((line) => {
  if (!line.trim()) return;
  if (line.includes('scan_categories.js') || line.includes('scan_entire_logs_for_categories.js')) return;
  
  if (line.includes('Gmail') || line.includes('Canva') || line.includes('ChatGPT') || line.includes('GMAIL')) {
    // Check if it looks like database data, e.g., JSON representation, or a list of categories.
    if (line.includes('image') || line.includes('id') || line.includes('/uploads/')) {
      console.log(`Step ${JSON.parse(line).step_index} (Type: ${JSON.parse(line).type}):`);
      console.log(line.substring(0, 1000));
      console.log('------------------------------------');
    }
  }
});
