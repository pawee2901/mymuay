const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(0);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const keywords = ['รูป', 'เดิม', 'หลับ', 'รีเซ็ต', 'หาย', 'db', 'reset', 'force', ' seed', 'Categories', 'Gmail', 'Canva', 'ChatGPT'];

console.log('Searching for logs matching Thai keywords or DB resets...');

lines.forEach((line) => {
  if (!line.trim()) return;
  if (line.includes('search_thai_logs.js') || line.includes('all_upload_mentions.txt')) return;
  
  let match = false;
  keywords.forEach(kw => {
    if (line.includes(kw)) match = true;
  });
  
  if (match) {
    try {
      const data = JSON.parse(line);
      // We only care about user inputs, planner responses, or command logs
      if (data.type === 'USER_INPUT' || data.type === 'PLANNER_RESPONSE' || data.type === 'RUN_COMMAND') {
        const text = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
        if (text.includes('Gmail') || text.includes('Canva') || text.includes('ChatGPT') || text.includes('db push') || text.includes('reset') || text.includes('รูป')) {
          console.log(`Step ${data.step_index} (${data.type}):`);
          console.log('  Content:', text.substring(0, 500));
          console.log('------------------------------------');
        }
      }
    } catch (e) {}
  }
});
