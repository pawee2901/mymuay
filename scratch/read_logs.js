const fs = require('fs');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const targets = [
  '1780638545044-yeog9yg.png',
  '1780638831141-o1amqix.png',
  '1780653446555-cexw4cl.png',
  '1780654023902-lvzn63x.png',
  '1780655933586-xagqi6k.png',
  '1780656180605-wjhuszy.png'
];

targets.forEach((target) => {
  console.log(`\n--- Searching logs for ${target} ---`);
  lines.forEach((line) => {
    if (!line.trim()) return;
    if (line.includes(target)) {
      try {
        const data = JSON.parse(line);
        console.log(`Step ${data.step_index} (${data.type}):`, line.substring(line.indexOf(target) - 200, line.indexOf(target) + 300));
      } catch (err) {
        console.log('Line matches (non-JSON):', line.substring(line.indexOf(target) - 200, line.indexOf(target) + 300));
      }
    }
  });
});
