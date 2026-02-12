const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/api/whatsapp/webhook/route.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
    if (line.includes('logDocRef')) {
        console.log(`${i + 1}: ${line.trim()}`);
    }
});
