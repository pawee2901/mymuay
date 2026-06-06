const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Scanning logs for API actions...');

lines.forEach((line) => {
  if (!line.trim()) return;
  if (line.includes('scan_logs_for_post_requests.js')) return;
  
  if (line.includes('api/admin/categories') || line.includes('api/upload') || line.includes('Category') || line.includes('Product')) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'RUN_COMMAND' || data.type === 'PLANNER_RESPONSE' || data.type === 'SYSTEM' || data.type === 'USER_INPUT') {
        const text = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
        if (text.includes('api/admin/categories') || text.includes('api/upload') || text.includes('Category') || text.includes('Product')) {
          console.log(`Step ${data.step_index} (${data.type}):`);
          console.log('  Content:', text.substring(0, 500));
          console.log('------------------------------------');
        }
      }
    } catch (e) {}
  }
});
