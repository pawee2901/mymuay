const fs = require('fs');
const path = require('path');

// A very simple PNG and JPEG dimension parser in pure JS
function getImageSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.png') {
    // PNG dimensions are in IHDR chunk, starting at byte 16 (4 bytes width, 4 bytes height)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height, type: 'PNG' };
  } else if (ext === '.jpg' || ext === '.jpeg') {
    // JPEG dimensions parsing
    let offset = 2;
    while (offset < buffer.length) {
      const marker = buffer.readUInt16BE(offset);
      offset += 2;
      
      // SOF0 (Start of Frame 0) marker is 0xFFC0, SOF2 is 0xFFC2
      if (marker === 0xFFC0 || marker === 0xFFC2) {
        // Skip length (2 bytes) and data precision (1 byte)
        const height = buffer.readUInt16BE(offset + 3);
        const width = buffer.readUInt16BE(offset + 5);
        return { width, height, type: 'JPEG' };
      }
      
      const length = buffer.readUInt16BE(offset);
      offset += length;
    }
  }
  return { width: 0, height: 0, type: 'UNKNOWN' };
}

const uploadDir = 'd:\\mymuayy\\public\\uploads';
const files = fs.readdirSync(uploadDir);

console.log('--- Image Dimensions ---');
files.forEach((file) => {
  try {
    const size = getImageSize(path.join(uploadDir, file));
    const stats = fs.statSync(path.join(uploadDir, file));
    console.log(`File: ${file} | Type: ${size.type} | Size: ${size.width}x${size.height} | Bytes: ${stats.size}`);
  } catch (err) {
    console.log(`File: ${file} | Error: ${err.message}`);
  }
});
