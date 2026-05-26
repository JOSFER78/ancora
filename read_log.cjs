const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\yo\\.gemini\\antigravity-ide\\brain\\db45cc54-7efb-4c84-8f9d-7c7be48dc342\\.system_generated\\logs\\transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.trim().split('\n');
  console.log(`Searching transcript of ${lines.length} lines...`);
  
  lines.forEach((line, idx) => {
    if (line.includes('task-760')) {
      console.log(`\n--- Line ${idx} ---`);
      console.log(line);
    }
  });
} catch (e) {
  console.error("Error:", e.message);
}
