const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const results = [];

lines.forEach((line) => {
  if (!line.trim()) return;
  if (line.includes('scan_entire_logs_for_any_uploads.js') || line.includes('all_upload_mentions.txt')) return;
  
  if (line.includes('/uploads/')) {
    try {
      const data = JSON.parse(line);
      // We only care about data if it has tool calls, command outputs, or view file content
      if (data.type === 'RUN_COMMAND' || data.type === 'VIEW_FILE' || data.type === 'PLANNER_RESPONSE' || data.type === 'USER_INPUT') {
        results.push({
          step: data.step_index,
          type: data.type,
          content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
        });
      }
    } catch (err) {
      results.push({
        step: -1,
        type: 'UNPARSED',
        content: line
      });
    }
  }
});

console.log(`Found ${results.length} mentions of uploads.`);

// Write all mentions to scratch/all_upload_mentions.txt
let outputText = '';
results.forEach((res) => {
  outputText += `\n========================================\n`;
  outputText += `Step: ${res.step} | Type: ${res.type}\n`;
  outputText += `========================================\n`;
  outputText += res.content + '\n';
});

fs.writeFileSync(path.resolve(__dirname, 'all_upload_mentions.txt'), outputText, 'utf8');
console.log('Saved all upload mentions to scratch/all_upload_mentions.txt');
