const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';
const uploadDir = 'd:\\mymuayy\\public\\uploads';

if (!fs.existsSync(logPath) || !fs.existsSync(uploadDir)) {
  console.log('Log file or upload directory does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const files = fs.readdirSync(uploadDir);

const results = {};

lines.forEach((line, lineIdx) => {
  if (!line.trim()) return;
  if (line.includes('find_all_usages.js') || line.includes('all_upload_mentions.txt')) return;
  
  files.forEach((file) => {
    if (line.includes(file)) {
      if (!results[file]) results[file] = [];
      try {
        const data = JSON.parse(line);
        results[file].push({
          step: data.step_index,
          type: data.type,
          context: line.substring(line.indexOf(file) - 150, line.indexOf(file) + 250)
        });
      } catch (e) {
        results[file].push({
          step: -1,
          type: 'RAW',
          context: line.substring(line.indexOf(file) - 150, line.indexOf(file) + 250)
        });
      }
    }
  });
});

let outputText = '--- SCAN RESULTS FOR ALL UPLOADED FILES ---\n';
Object.keys(results).forEach((file) => {
  outputText += `\n========================================\n`;
  outputText += `File: ${file} (found ${results[file].length} times)\n`;
  results[file].forEach((res, i) => {
    outputText += `  [Match ${i+1}] Step ${res.step} (${res.type}):\n`;
    outputText += `    ${res.context.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim()}\n`;
  });
});

fs.writeFileSync(path.resolve(__dirname, 'all_usages.txt'), outputText, 'utf8');
console.log('Saved all usages to scratch/all_usages.txt');
