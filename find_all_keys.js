const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const apiKeys = new Set();
  const branchIds = new Set();

  for await (const line of rl) {
    // Find patterns like slipok-xxxxx-xxxx-xxxx...
    const keysFound = line.match(/slipok-[a-zA-Z0-9-]+/g);
    if (keysFound) {
      keysFound.forEach(k => apiKeys.add(k));
    }

    // Find 4-6 digit numbers that could be branch IDs
    const branchesFound = line.match(/\b\d{4,6}\b/g);
    if (branchesFound) {
      branchesFound.forEach(b => {
        // filter out dates, port numbers, response codes etc.
        const num = parseInt(b, 10);
        if (num > 1000 && num < 99999) {
          if (b !== '3000' && b !== '1002' && b !== '1001' && b !== '1012' && b !== '1014' && b !== '1000' && b !== '1003' && b !== '1004') {
            branchIds.add(b);
          }
        }
      });
    }
  }

  console.log('--- Unique SlipOk API Keys Found in History ---');
  console.log(Array.from(apiKeys));
  console.log('\n--- Unique Branch IDs Found in History (Potential) ---');
  console.log(Array.from(branchIds));
}

main().catch(console.error);
