const fs = require('fs-extra');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const db = new sqlite3.Database('./uptimerobot.sqlite', (err) => {
  if (err) {
    console.error("Error opening the SQLite database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

const allowedIDFilePath = path.join(__dirname, '../allowedID.json');
let allowedIDData = {
  allowedIDs: ['100084149373287', '100088806220727']
};

try {
  if (!fs.existsSync(allowedIDFilePath)) {
    fs.writeJSONSync(allowedIDFilePath, allowedIDData, { spaces: 4 });
  } else {
    allowedIDData = fs.readJSONSync(allowedIDFilePath);
  }
} catch (err) {
  console.log('Error reading or creating allowedID.json', err);
}

function getUptimerobotData(callback) {
  db.get("SELECT data FROM uptimerobot LIMIT 1", [], (err, row) => {
    if (err) {
      console.log(chalk.red('Error fetching from uptimerobot database'));
      callback(err, {});
    } else {
      const data = row ? JSON.parse(row.data) : {};
      callback(null, data);
    }
  });
}

exports.showAllUrls = async (req, res) => {
  const allowedID = req.query.allowid;

  if (!allowedID || !allowedIDData.allowedIDs.includes(allowedID)) {
    return res.status(403).json({ message: 'Access denied. Invalid or missing allowedID.' });
  }

  getUptimerobotData((err, dataObj) => {
    if (err) {
      console.error("Error reading uptimerobot data", err);
      return res.status(500).json({ message: "Internal Server Error", author: 'Choru tiktokers' });
    }

    const data = dataObj.uptimerobot || {};
    const urls = [];

    for (let i = 1; i <= Object.keys(data).length / 2; i++) { // Assuming every user has a URL
      const urlKey = `url${i}`;
      const userKey = `user${i}`;
      if (data[urlKey]) {
        const urlObject = new URL(data[urlKey]);
        const hostParts = urlObject.hostname.split('.');
        const text1 = hostParts[0].toLowerCase();
        let text2 = hostParts[1];
        text2 = text2.charAt(0).toLowerCase() + text2.slice(1);
        const urlText = data[urlKey];
        const user = data[userKey] ? data[userKey] : 'User not found';
        const newUrl = `https://replit.com/@${text2}`;
        urls.push(`User: ${user}\nURL: ${urlText}\nNew URL: ${newUrl}`);
      }
    }

    if (urls.length > 0) {
      return res.json({ urls, author: 'Choru tiktokers' });
    } else {
      return res.json({ message: 'No URLs or users found in the list.', author: 'Choru tiktokers' });
    }
  });
};





function getAllowedIDs(callback) {
  try {
    const data = fs.readJSONSync(allowedIDFilePath);
    callback(null, data.allowedIDs);
  } catch (err) {
    callback(err);
  }
}

function addAllowedID(uid, callback) {
  try {
    if (!allowedIDData.allowedIDs.includes(uid)) {
      allowedIDData.allowedIDs.push(uid);
      fs.writeJSONSync(allowedIDFilePath, allowedIDData, { spaces: 4 });
    }
    callback(null);
  } catch (err) {
    callback(err);
  }
}

exports.adminId = async (req, res, next) => {
  const { uid } = req.query;

  if (!uid) {
    return res.json({ error: 'Missing UID', author: 'Choru tiktokers' });
  }

  getAllowedIDs((err, existingUids) => {
    if (err) {
      console.error("Error reading allowed IDs", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (existingUids.includes(uid)) {
      return res.json({
        success: true,
        message: 'UID already exists in the admin list.',
        list: existingUids.map(id => `[ ${id} ]`)
      });
    } else {
      addAllowedID(uid, (err) => {
        if (err) {
          console.error("Error adding allowed ID", err);
          return res.status(500).json({ message: "Internal Server Error" });
        }

        res.json({
          success: true,
          message: `Successfully added the UID ${uid} to the admin list.`,
          list: [...existingUids, uid].map(id => `[ ${id} ]`)
        });
      });
    }
  });
};


async function testUrlStatus(url) {
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            return '✅';
        }
        return '❎';
    } catch (error) {
        return '❎';
    }
}

exports.testping = async (req, res) => {
    const allowedID = req.query.allowid;

    if (!allowedID || !allowedIDData.allowedIDs.includes(allowedID)) {
        return res.status(403).json({ message: 'Access denied. Invalid or missing allowedID.' });
    }

    getUptimerobotData(async (err, dataObj) => {
        if (err) {
            console.error("Error reading uptimerobot data", err);
            return res.status(500).json({ message: "Internal Server Error", author: 'Choru tiktokers' });
        }

        const data = dataObj.uptimerobot || {};
        const urls = [];

        for (let i = 1; i <= Object.keys(data).length / 2; i++) {
            const urlKey = `url${i}`;
            const userKey = `user${i}`;
            if (data[urlKey]) {
                const status = await testUrlStatus(data[urlKey]);
                const user = data[userKey] ? data[userKey] : 'User not found';
                urls.push({
                    user: user,
                    url: data[urlKey],
                    status: status === '✅' ? 'Online' : 'Offline',
                    emoji: status
                });
            }
        }

        if (urls.length > 0) {
            return res.json({ urls, author: 'Choru tiktokers' });
        } else {
            return res.json({ message: 'No URLs or users found in the list.', author: 'Choru tiktokers' });
        }
    });
};
