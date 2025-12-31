const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

console.log('=== SOVEREIGN ORDER 8: SEALING SYSTEM ===');

// 1. Define Sovereign Paths
const sovereignPaths = [
    'core',
    'encryption',
    'policy',
    'sequelize_setup.js'
];

// Helper to ensure directory exists
function ensureDir(dirName) {
    const fullPath = path.join(__dirname, '../', dirName);
    if (!fs.existsSync(fullPath)) {
        if (!fullPath.endsWith('.js')) {
            console.log(`Creating placeholder directory: ${dirName}`);
            fs.mkdirSync(fullPath, { recursive: true });
            // Create a dummy readme to allow hashing
            fs.writeFileSync(path.join(fullPath, 'SOVEREIGN_LOCKED.md'), '# LOCKED\nThis directory is under sovereign seal.');
        }
    }
}

// Helper to calculate file/dir hash
function getHash(target) {
    const fullPath = path.join(__dirname, '../', target);
    if (!fs.existsSync(fullPath)) return null;

    if (fs.lstatSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath);
        const hashes = files.map(f => getHash(path.join(target, f)));
        return crypto.createHash('sha256').update(hashes.join('')).digest('hex');
    } else {
        const content = fs.readFileSync(fullPath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}

// Execution
const snapshot = {};

sovereignPaths.forEach(target => {
    ensureDir(target);
    snapshot[target] = getHash(target);

    // Apply Read-Only Attribute (Windows)
    const fullPath = path.join(__dirname, '../', target);
    const cmd = `attrib +R "${fullPath}" /S /D`; // /S applies to files in subdirs, /D to directories

    exec(cmd, (error) => {
        if (error) {
            console.error(`❌ Failed to lock ${target}:`, error.message);
        } else {
            console.log(`🔒 Locked: ${target}`);
        }
    });
});

// Save snapshot
fs.writeFileSync(
    path.join(__dirname, '../.sovereign_snapshot.json'),
    JSON.stringify(snapshot, null, 2)
);

console.log('✅ Snapshot saved to .sovereign_snapshot.json');
console.log('✅ Sovereign Seal applied.');
