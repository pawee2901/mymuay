const fs = require('fs');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Scanning all occurrences of "/uploads/" in history...');

const occurrences = [];

lines.forEach((line) => {
  if (!line.trim()) return;
  try {
    const data = JSON.parse(line);
    const text = JSON.stringify(data);
    
    if (text.includes('/uploads/')) {
      // Find where in the text the uploads are, and get some surrounding context
      let idx = 0;
      while (true) {
        idx = text.indexOf('/uploads/', idx);
        if (idx === -1) break;
        
        // Extract surrounding context (e.g. 150 chars before and after)
        const context = text.substring(Math.max(0, idx - 150), Math.min(text.length, idx + 250));
        occurrences.push({
          step: data.step_index,
          type: data.type,
          context: context
        });
        
        idx += 9; // move past /uploads/
      }
    }
  } catch (err) {}
});

// Print unique contexts to see where they belong
const uniqueContexts = new Set();
occurrences.forEach((occ) => {
  // Clean context to remove duplicates
  const cleaned = occ.context.replace(/\\n/g, ' ').replace(/\\/g, '').trim();
  uniqueContexts.add(`Step ${occ.step} (${occ.type}): ${cleaned.substring(0, 300)}`);
});

Array.from(uniqueContexts).forEach((ctx) => {
  console.log(ctx);
});
