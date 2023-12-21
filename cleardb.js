const sqlite3 = require('sqlite3').verbose();

// 1. Database Initialization and Connection
const db = new sqlite3.Database('./uptimerobot.sqlite', (err) => {
  if (err) {
    console.error("Error opening the SQLite database:", err.message);
    process.exit(1);
  }
  console.log("Connected to the SQLite database.");
});

// 2. Data Sanitization Function
function sanitizeData(callback) {
  db.get("SELECT data FROM uptimerobot WHERE id = 1", [], (err, row) => {
    if (err) {
      console.error("Error fetching data from database:", err.message);
      callback(err);
      return;
    }
    
    if (!row || !row.data) {
      console.log("No data found to sanitize.");
      callback();
      return;
    }
    
    const data = JSON.parse(row.data);
    const cleanedData = {};

    for (const key in data.uptimerobot) {
      if (key.startsWith('user')) {
        const index = key.substr(4); // Extract index from userX
        if (data.uptimerobot[`url${index}`]) {
          cleanedData[key] = data.uptimerobot[key];
        }
      } else if (key.startsWith('url')) {
        const index = key.substr(3); // Extract index from urlX
        if (data.uptimerobot[`user${index}`]) {
          cleanedData[key] = data.uptimerobot[key];
        }
      }
    }

    const sanitizedJSON = JSON.stringify({ uptimerobot: cleanedData });
    db.run("UPDATE uptimerobot SET data = ? WHERE id = 1", [sanitizedJSON], (updateErr) => {
      if (updateErr) {
        console.error("Error updating sanitized data:", updateErr.message);
        callback(updateErr);
        return;
      }
      console.log("Data sanitized successfully.");
      callback(null, sanitizedJSON);
    });
  });
}

// 3. Run the Data Sanitization
sanitizeData((err, sanitizedJSON) => {
  if (err) {
    console.error("Error during data sanitization:", err.message);
  } else {
    console.log("Sanitized Data:", sanitizedJSON);
  }
  db.close();
});
