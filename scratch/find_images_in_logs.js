const fs = require('fs');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\d5401fab-f693-44ce-84cf-d09e7dc7f547\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

lines.forEach((line) => {
  if (!line.trim()) return;
  if (line.includes('media__') || line.includes('upload')) {
    try {
      const data = JSON.parse(line);
      console.log(`\nStep ${data.step_index} (${data.type}):`);
      // Find all media__ patterns
      const matches = data.content.match(/media__[0-9]+/g);
      if (matches) {
        console.log('Matches:', matches);
      } else {
        console.log('Content preview:', data.content.substring(0, 500));
      }
    } catch (e) {}
  }
});
