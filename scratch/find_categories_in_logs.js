const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Scanning lines for category definitions in JSON format...');

const matches = [];

lines.forEach((line) => {
  if (!line.trim()) return;
  if (line.includes('find_categories_in_logs.js')) return;
  
  // Look for occurrences of GMAIL, Gmail, Canva, ChatGPT
  if (line.toLowerCase().includes('gmail') || line.toLowerCase().includes('canva') || line.toLowerCase().includes('chatgpt')) {
    // If it contains /uploads/, it is likely an image link or category definition
    if (line.includes('/uploads/')) {
      matches.push(line);
    }
  }
});

console.log(`Found ${matches.length} matching lines with uploads and keywords.`);

matches.forEach((line, index) => {
  console.log(`\n========================================`);
  console.log(`Match ${index + 1}:`);
  try {
    const data = JSON.parse(line);
    console.log(`Step: ${data.step_index} | Type: ${data.type}`);
    
    // Scan for all occurrences of upload URLs in the content
    const text = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    console.log('Content Snippet:', text.substring(0, 1500));
  } catch (err) {
    console.log('Raw Snippet (Parse Error):', line.substring(0, 1000));
  }
});
