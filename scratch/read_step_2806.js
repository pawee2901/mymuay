const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

lines.forEach((line) => {
  if (!line.trim()) return;
  try {
    const data = JSON.parse(line);
    if (data.step_index === 2806) {
      console.log('Found step 2806, writing to text file...');
      fs.writeFileSync(path.resolve(__dirname, 'step_2806_output.txt'), data.content, 'utf8');
      console.log('Saved to scratch/step_2806_output.txt');
    }
  } catch (err) {}
});
