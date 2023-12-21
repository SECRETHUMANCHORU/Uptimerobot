const chalk = require('chalk');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./uptimerobot.sqlite', (err) => {
  if (err) {
    console.error("Error opening the SQLite database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});


// Create tables if they don't exist
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS uptimerobot (key TEXT UNIQUE, value TEXT)");
});

exports.remove = (req, res) => {
  const linkToRemove = req.query.link;

  if (!linkToRemove) {
    return res.json({ error: 'Missing input', author: 'Choru tiktokers' });
  }

  const isLink = (input) => {
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    return urlRegex.test(input);
  };

  if (!isLink(linkToRemove)) {
    return res.json({ error: 'Invalid link. Please enter a valid URL.', author: 'Choru tiktokers' });
  }

  // Fetch the data column from the table
  db.get("SELECT data FROM uptimerobot LIMIT 1", [], (err, row) => {
    if (err) {
      console.log(chalk.red('Error fetching from uptimerobot database', err.message));
      return res.status(500).json({ message: "Internal Server Error", author: 'Choru tiktokers' });
    }

    let dataObj = JSON.parse(row.data);
    let userToRemove;

    // Find and remove the link and associated user
    for (const [key, value] of Object.entries(dataObj.uptimerobot)) {
      if (value === linkToRemove) {
        userToRemove = `user${key.slice(3)}`;  // e.g., if key is 'url5', userToRemove will be 'user5'
        delete dataObj.uptimerobot[key];
        break;
      }
    }

    // Check if userToRemove has any other associated URLs, if not remove the user
    const userHasOtherUrls = Object.values(dataObj.uptimerobot).some((value, i, array) => {
      const associatedUrlKey = `url${userToRemove.slice(4)}`;
      return array.includes(associatedUrlKey);
    });

    if (!userHasOtherUrls && userToRemove) {
      delete dataObj.uptimerobot[userToRemove];
    }

    // Update the data column with the modified JSON
    db.run("UPDATE uptimerobot SET data = ? WHERE id = 1", [JSON.stringify(dataObj)], function(err) {
      if (err) {
        console.log(chalk.red('Error updating uptimerobot database', err.message));
        return res.status(500).json({ message: "Internal Server Error", author: 'Choru tiktokers' });
      }
      return res.json({ message: `Link (and associated user if no more links exist) removed successfully.`, author: 'Choru tiktokers' });
    });
  });
};
