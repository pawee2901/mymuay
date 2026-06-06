const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e';

if (!fs.existsSync(brainDir)) {
  console.log('Brain directory does not exist');
  process.exit(0);
}

const files = fs.readdirSync(brainDir);
console.log('Scanning brain files...');

files.forEach((file) => {
  const filePath = path.join(brainDir, file);
  const stat = fs.statSync(filePath);
  if (stat.isFile() && (file.endsWith('.json') || file.endsWith('.md'))) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('GMAIL') || content.includes('Canva') || content.includes('ChatGPT') || content.includes('Netflix') || content.includes('uploads')) {
      console.log(`\n--- Found match in file: ${file} ---`);
      // Print lines that match
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        if (l.includes('GMAIL') || l.includes('Canva') || l.includes('ChatGPT') || l.includes('Netflix') || l.includes('uploads') || l.includes('media__')) {
          console.log(`  Line ${i+1}: ${l.trim().substring(0, 300)}`);
        }
      });
    }
  }
});
