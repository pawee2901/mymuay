const fs = require('fs');

const paths = [
  'd:\\mymuayy\\dev.db',
  'd:\\mymuayy\\prisma\\dev.db'
];

paths.forEach((p) => {
  if (fs.existsSync(p)) {
    const stats = fs.statSync(p);
    console.log(`File: ${p}`);
    console.log(`- Size: ${stats.size} bytes`);
    console.log(`- Modified: ${stats.mtime.toISOString()}`);
  } else {
    console.log(`File: ${p} does not exist`);
  }
});
