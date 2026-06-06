const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const earlyFiles = [
  '1780634295010-q3pqvj5.jpg',
  '1780637354041-r72s6vf.png',
  '1780637358560-e9gs6dw.jpeg',
  '1780637534669-gfahdoi.png',
  '1780637550147-1z9lm4u.png',
  '1780637632168-emndu00.png',
  '1780637686101-qqnj3uq.png',
  '1780637746848-idxun5n.png',
  '1780637803156-d84tnlz.png',
  '1780637954782-lqhx12o.png',
  '1780638055297-xmcstrh.png',
  '1780638080179-93k8614.png',
  '1780638194737-b7ekfy8.jpeg'
];

earlyFiles.forEach((file) => {
  let found = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.includes('trace_early_uploads.js') || line.includes('all_upload_mentions.txt')) continue;
    
    if (line.includes(file)) {
      try {
        const data = JSON.parse(line);
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
    found.slice(0, 2).forEach((m, idx) => {
      console.log(`  [Mention ${idx + 1}] Step ${m.step} (Type: ${m.type}):`);
      const fileIdx = m.line.indexOf(file);
      console.log('    Context:', m.line.substring(Math.max(0, fileIdx - 150), Math.min(m.line.length, fileIdx + 250)));
    });
  } else {
    console.log('  No non-list-dir mentions found.');
  }
});
