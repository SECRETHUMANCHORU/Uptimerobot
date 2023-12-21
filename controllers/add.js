const sqlite3 = require('sqlite3').verbose();
const chalk = require('chalk');

const db = new sqlite3.Database('./uptimerobot.sqlite', (err) => {
    if (err) {
        console.error("Error opening the SQLite database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

function initializeDB(callback) {
    // Create or modify the table structure
    db.run("CREATE TABLE IF NOT EXISTS uptimerobot (id INTEGER PRIMARY KEY, data TEXT)", (err) => {
        if (err) return callback(err);

        // Ensure the expected columns exist
        db.all("PRAGMA table_info(uptimerobot)", [], (err, columns) => {
            if (err) return callback(err);

            const hasIdColumn = columns.some(col => col.name === 'id');
            const hasDataColumn = columns.some(col => col.name === 'data');

            if (!hasIdColumn || !hasDataColumn) {
                console.warn("Recreating the uptimerobot table to match expected schema...");
                db.serialize(() => {
                    db.run("DROP TABLE IF EXISTS uptimerobot");
                    db.run("CREATE TABLE uptimerobot (id INTEGER PRIMARY KEY, data TEXT)", callback);
                });
            } else {
                callback(null);
            }
        });
    });
}

function getUptimerobotData(callback) {
    db.get("SELECT data FROM uptimerobot WHERE id = 1", [], (err, row) => {
        callback(err, row ? JSON.parse(row.data) : {});
    });
}

function saveUptimerobotData(data, callback) {
    const serializedData = JSON.stringify(data);
    db.run("INSERT OR REPLACE INTO uptimerobot (id, data) VALUES (?, ?)", [1, serializedData], callback);
}

exports.add = (req, res) => {
    const link = req.query.link;
    const user = req.query.user;

    if (!link || !user) {
        return res.json({ error: 'Missing input', author: 'Choru tiktokers' });
    }

    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    if (!urlRegex.test(link)) {
        return res.json({ error: 'Invalid link. Please enter a valid URL.', author: 'Choru tiktokers' });
    }

    initializeDB((initErr) => {
        if (initErr) {
            console.error(chalk.red('Error initializing the uptimerobot database:', initErr));
            return res.status(500).json({ message: "Internal Server Error", author: 'Choru tiktokers' });
        }

        getUptimerobotData((err, data) => {
            if (err) {
                console.error(chalk.red('Error fetching from uptimerobot database:', err));
                return res.status(500).json({ message: "Internal Server Error", author: 'Choru tiktokers' });
            }

            const uptimerobot = data.uptimerobot || {};

            // Check if the link or user already exists
            const existingUsers = Object.values(uptimerobot).filter(value => value === user);
            const existingLinks = Object.values(uptimerobot).filter(value => value === link);

            if (existingUsers.length || existingLinks.length) {
                return res.json({ error: 'User or Link already exists.', author: 'Choru tiktokers' });
            }

            // Find the next available index for the new user and link
            let index = 1;
            while (uptimerobot[`user${index}`] || uptimerobot[`url${index}`]) {
                index++;
            }

            // Insert the new link and user
            uptimerobot[`user${index}`] = user;
            uptimerobot[`url${index}`] = link;

            // Save the updated data
            saveUptimerobotData({ uptimerobot: uptimerobot }, (saveErr) => {
                if (saveErr) {
                    console.error(chalk.red('Failed to save to uptimerobot database:', saveErr));
                    return res.status(500).json({ message: "Internal Server Error", author: 'Choru tiktokers' });
                }
                res.json({ message: `Added user: ${user} with link: ${link}`, author: 'Choru tiktokers' });
                console.log(`Added user: ${user} with link: ${link}`);
   //           proccess.exit(1);
            });
        });
    });
};
