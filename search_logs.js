const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  let matches = 0;
  for await (const line of rl) {
    if (line.includes('1002') || line.includes('Authorization Header')) {
      const obj = JSON.parse(line);
      // Let's print the step index, type, and source
      console.log(`--- Match #${matches + 1} (Step ${obj.step_index}, Type: ${obj.type}, Source: ${obj.source}) ---`);
      if (obj.content) {
        console.log(obj.content.substring(0, 500));
      } else if (obj.tool_calls) {
        console.log(JSON.stringify(obj.tool_calls).substring(0, 500));
      } else {
        console.log(line.substring(0, 500));
      }
      matches++;
      if (matches >= 20) {
        break;
      }
    }
    count++;
  }
}

main().catch(console.error);
