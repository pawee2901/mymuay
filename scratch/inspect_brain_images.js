const fs = require('fs');
const path = require('path');

function getImageSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.png') {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height, type: 'PNG' };
  } else if (ext === '.jpg' || ext === '.jpeg') {
    let offset = 2;
    while (offset < buffer.length) {
      const marker = buffer.readUInt16BE(offset);
      offset += 2;
      
      if (marker === 0xFFC0 || marker === 0xFFC2) {
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

const brainDir = 'C:\\Users\\Nitro\\.gemini\\antigravity\\brain\\17eb10c4-e966-4a65-ba32-5c32186bd90e';
const files = fs.readdirSync(brainDir).filter(f => f.startsWith('media__') || f.startsWith('uploaded_media_'));

console.log('--- Brain Image Dimensions ---');
files.forEach((file) => {
  try {
    const filePath = path.join(brainDir, file);
    const size = getImageSize(filePath);
    const stats = fs.statSync(filePath);
    console.log(`File: ${file} | Type: ${size.type} | Size: ${size.width}x${size.height} | Bytes: ${stats.size}`);
  } catch (err) {
    console.log(`File: ${file} | Error: ${err.message}`);
  }
});
