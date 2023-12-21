const { execSync } = require('child_process');

function start() {
    execSync('npm run start', { stdio: 'inherit' });
}

setInterval(start, 100000);
