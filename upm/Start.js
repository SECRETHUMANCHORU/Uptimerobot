const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let bypassData;

try {
  const bypassContent = fs.readFileSync('bypass.json', 'utf8');
  bypassData = JSON.parse(bypassContent);
} catch (error) {
  // If the file doesn't exist or is invalid JSON, create a new one
  fs.writeFileSync('bypass.json', '{"password": null}');
  bypassData = { password: null };
}

const storedPassword = bypassData.password;

if (storedPassword === 'ChoruAdminCode') {
  console.log(chalk.green('Stored password found. Starting server...'));
  startServer();
} else {
  rl.question('Enter the activation code: ', (enteredPassword) => {
    if (enteredPassword === 'ChoruAdminCode') {
      bypassData.password = enteredPassword;
      fs.writeFileSync('bypass.json', JSON.stringify(bypassData, null, 2));
      console.log(chalk.green('Activation successful. Starting server...'));
      startServer();
    } else {
      console.log(chalk.red('Activation code incorrect. Exiting.'));
      rl.close();
    }
  });
}

function startServer() {
  const server = require('../server.js');
  // Additional logic or handling can be added here if needed
  rl.close();
}
