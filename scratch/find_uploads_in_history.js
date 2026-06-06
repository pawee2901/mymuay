const fs = require('fs');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Scanning user inputs for image uploads...');

lines.forEach((line) => {
  if (!line.trim()) return;
  try {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT') {
      const text = JSON.stringify(data);
      if (text.includes('media__') || text.includes('uploaded_')) {
        console.log(`Step ${data.step_index}:`);
        console.log(`  Content: ${data.content}`);
        console.log(`  Data details:`, text.substring(0, 1000));
      }
    }
  } catch (err) {}
});
