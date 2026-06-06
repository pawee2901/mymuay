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

files.forEach((file) => {
  let found = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.includes('trace_all_uploads_completely.js') || line.includes('all_upload_mentions.txt')) continue;
    
    if (line.includes(file)) {
      try {
        const data = JSON.parse(line);
        // Exclude simple list directory outputs to get meaningful context
        if (data.type !== 'LIST_DIRECTORY' && data.type !== 'LIST_DIR') {
          found.push({
            step: data.step_index,
            type: data.type,
            line: line
          });
        }
      } catch (err) {}
    }
  }
  
  console.log(`\n========================================`);
  console.log(`File: ${file} | Found ${found.length} non-list-dir mentions`);
  if (found.length > 0) {
    // Print the first 2 mentions
    found.slice(0, 2).forEach((m, idx) => {
      console.log(`  [Mention ${idx + 1}] Step ${m.step} (Type: ${m.type}):`);
      const fileIdx = m.line.indexOf(file);
      console.log('    Context:', m.line.substring(Math.max(0, fileIdx - 150), Math.min(m.line.length, fileIdx + 250)));
    });
  } else {
    console.log('  No non-list-dir mentions found.');
  }
});
