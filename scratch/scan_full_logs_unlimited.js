const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const keywords = ['gmail', 'canva', 'chatgpt', 'hotmail', 'outlook'];

console.log('Scanning entire transcript for database seed or inserts of Gmail/Canva/ChatGPT...');

let results = [];

lines.forEach((line, index) => {
  if (!line.trim()) return;
  if (line.includes('scan_full_logs_unlimited.js') || line.includes('all_upload_mentions.txt')) return;
  
  const lower = line.toLowerCase();
  const hasKeyword = keywords.some(kw => lower.includes(kw));
  
  if (hasKeyword) {
    try {
      const data = JSON.parse(line);
      // We are looking for:
      // 1. Tool calls like write_to_file for seed scripts
      // 2. Command outputs that list categories/products
      // 3. User inputs or model responses containing seed code
      results.push({
        lineNum: index + 1,
        step: data.step_index,
        type: data.type,
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
        toolCalls: data.tool_calls ? JSON.stringify(data.tool_calls) : ''
      });
    } catch (e) {
      results.push({
        lineNum: index + 1,
        step: -1,
        type: 'RAW',
        content: line
      });
    }
  }
});

console.log(`Found ${results.length} lines matching keywords.`);

// Save to scratch/unlimited_scan_results.txt
let outputText = '';
results.forEach(res => {
  outputText += `\n========================================\n`;
  outputText += `Line: ${res.lineNum} | Step: ${res.step} | Type: ${res.type}\n`;
  outputText += `========================================\n`;
  if (res.toolCalls) {
    outputText += `Tool Calls: ${res.toolCalls.substring(0, 1000)}\n`;
  }
  outputText += res.content + '\n';
});

fs.writeFileSync(path.resolve(__dirname, 'unlimited_scan_results.txt'), outputText, 'utf8');
console.log('Saved all results to scratch/unlimited_scan_results.txt');
