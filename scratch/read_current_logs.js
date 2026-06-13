const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\d5401fab-f693-44ce-84cf-d09e7dc7f547\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist at ' + logPath);
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log(`Total log lines: ${lines.length}`);

// Print USER_INPUT steps
lines.forEach((line) => {
  if (!line.trim()) return;
  try {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT') {
      console.log(`\n--- STEP ${data.step_index} USER_INPUT ---`);
      console.log(data.content);
    }
  } catch (err) {
    // Ignore invalid JSON lines
  }
});
