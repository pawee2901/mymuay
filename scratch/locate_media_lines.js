const fs = require('fs');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\d5401fab-f693-44ce-84cf-d09e7dc7f547\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, lineIdx) => {
  if (!line.trim()) return;
  if (line.includes('media__')) {
    try {
      const data = JSON.parse(line);
      console.log(`Line ${lineIdx + 1}: Step ${data.step_index} | Source: ${data.source} | Type: ${data.type}`);
    } catch (e) {
      console.log(`Line ${lineIdx + 1}: Match but JSON parsing failed`);
    }
  }
});
