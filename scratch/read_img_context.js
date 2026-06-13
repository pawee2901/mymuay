const fs = require('fs');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\d5401fab-f693-44ce-84cf-d09e7dc7f547\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const imgNames = [
  'media__1781072293498',
  'media__1781072336232',
  'media__1781072557815',
  'media__1781072570068',
  'media__1781072584676',
  'media__1781072596255',
  'media__1781072611713'
];

lines.forEach((line) => {
  if (!line.trim()) return;
  imgNames.forEach((img) => {
    if (line.includes(img)) {
      try {
        const data = JSON.parse(line);
        console.log(`\n==========================================`);
        console.log(`IMAGE: ${img} found in Step ${data.step_index} (${data.type})`);
        console.log(`Content:\n${data.content.substring(0, 1000)}`);
      } catch (err) {
        console.log(`IMAGE: ${img} found in step line (non-JSON)`);
      }
    }
  });
});
