const crypto = require('crypto');
const pwd = process.argv[2] || '040394';
const hash = crypto.createHash('sha256').update(pwd).digest('hex');
console.log(`password: ${pwd}`);
console.log(`sha256: ${hash}`);
