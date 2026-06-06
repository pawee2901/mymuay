const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Searching for original database records in logs...');

const matches = [];

lines.forEach((line) => {
  if (!line.trim()) return;
  if (line.includes('extract_categories_data.js')) return;
  
  if (line.includes('GMAIL | OUTLOOK | HOTMAIL') || line.includes('Canva | Microsoft 365') || line.includes('ChatGPT')) {
    matches.push(line);
  }
});

console.log(`Found ${matches.length} matching lines.`);
matches.forEach((line, index) => {
  console.log(`\nMatch ${index + 1}:`);
  try {
    const data = JSON.parse(line);
    console.log(`Step: ${data.step_index}`);
    console.log(`Type: ${data.type}`);
    // If there is stringified json, let's find it.
    const text = JSON.stringify(data);
    
    // Print parts containing uploads or category names
    let startIdx = 0;
    while (true) {
      const idx = text.indexOf('/uploads/', startIdx);
      if (idx === -1) break;
      console.log('  Upload context:', text.substring(Math.max(0, idx - 100), Math.min(text.length, idx + 200)));
      startIdx = idx + 9;
    }
    
    // Dump first 2000 chars of content if it's a model response or run command output
    console.log('Content snippet:', typeof data.content === 'string' ? data.content.substring(0, 2000) : 'Non-string content');
  } catch (err) {
    console.log('Error parsing line:', err.message);
    console.log('Raw line snippet:', line.substring(0, 1000));
  }
});
