const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Scanning logs for DB operations...');

lines.forEach((line) => {
  if (!line.trim()) return;
  if (line.includes('find_db_operations.js')) return;
  
  if (line.includes('.db') || line.includes('prisma') || line.includes('copy') || line.includes('cp ') || line.includes('backup')) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'RUN_COMMAND' || data.type === 'PLANNER_RESPONSE') {
        const text = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
        if (text.includes('dev.db') || text.includes('prisma') || text.includes('copy') || text.includes('cp ') || text.includes('backup')) {
          console.log(`Step ${data.step_index} (${data.type}):`);
          console.log('  Content:', text.substring(0, 400));
          console.log('------------------------------------');
        }
      }
    } catch (e) {}
  }
});
