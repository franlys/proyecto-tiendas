const fs = require('fs');
const path = require('path');

const filesToDelete = [
    'scripts/check-status.js',
    'scripts/check-status-simple.js',
    'scripts/fix-and-reset.js',
    'scripts/force-prod-reconnect.js',
    'scripts/force-prod-webhook.js',
    'scripts/migrate-v3.js'
];

filesToDelete.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Deleted: ${file}`);
        } else {
            console.log(`⚠️ Not found: ${file}`);
        }
    } catch (e) {
        console.error(`❌ Error deleting ${file}:`, e.message);
    }
});
