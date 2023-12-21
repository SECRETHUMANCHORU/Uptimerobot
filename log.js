const axios = require("axios");
const chalk = require("chalk");
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./uptimerobot.sqlite', (err) => {
  if (err) {
    console.error("Error opening the SQLite database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

const colorCodes = [
  "#FF9900",
  "#FFFF33",
  "#33FFFF",
  "#FF99FF",
  "#FF3366",
  "#FFFF66",
  "#FF00FF",
  "#66FF99",
  "#00CCFF",
  "#FF0099",
  "#FF0066",
  "#996633",
  "#669933",
  "#339966",
  "#0066CC",
  "#336699",
  "#663399",
  "#993366",
  "#CC0066",
  "#660033",
  "#FF8C00",
  "#FFFF00",
  "#00FFFF",
  "#FF69B4",
  "#FF4500",
  "#FFFF80",
  "#FF00FF",
  "#98FB98",
  "#00BFFF",
  "#FF6961",
  "#FF7F50",
  "#FFFF99",
  "#FF1493",
  "#66CDAA",
  "#00FFFF",
  "#7B68EE",
  "#9370DB",
  "#ADFF2F",
  "#F0E68C",
  "#DAA520",
  "#006400",
  "#8B008B",
  "#556B2F",
  "#FF8C69",
  "#9932CC",
  "#8B0000",
  "#E9967A",
  "#8FBC8F",
  "#483D8B",
  "#2F4F4F",
  "#00CED1",
  "#9400D3",
  "#FF1493",
  "#00BFFF",
  "#696969",
  "#1E90FF",
  "#B22222",
  "#228B22"
];

class UptimeMonitor {
  constructor(link, user, index) {
    this.link = link;
    this.user = user;
    this.index = index;
    this.startMonitoring();
  }

  startMonitoring() {
    const randomColor = colorCodes[Math.floor(Math.random() * colorCodes.length)];

    this.intervalId = setInterval(async () => {
      try {
        await axios.get(this.link);
        console.log(chalk.bold.hex(randomColor)(`[ ${this.user} ] ❯ `) + chalk.bold.hex(randomColor)(`ONLINE STATUS ✓\nLink: ${this.link}`));
      } catch (error) {
        //console.log(chalk.bold.red(`[ ${this.user} ] ❯ `) + chalk.red(`${this.link} - ${error.message}`));
      }
    }, 5000);
  }
}

function pairUsersWithUrls(data) {
  let pairedData = [];

  for (let i = 1; i <= Object.keys(data).length / 2; i++) {
    if (data[`user${i}`] && data[`url${i}`]) {
      pairedData.push({ 
        user: { key: `user${i}`, value: data[`user${i}`] },
        url: { key: `url${i}`, value: data[`url${i}`] }
      });
    }
  }

  return pairedData;
}

function startMonitoringWithPairedData() {
  db.get("SELECT data FROM uptimerobot LIMIT 1", [], (err, row) => {
    if (err) {
      console.error(chalk.bold.red(`Error fetching from uptimerobot database: ${err.message}`));
      return;
    }

    let data = JSON.parse(row.data).uptimerobot;
    const pairedData = pairUsersWithUrls(data);

    pairedData.forEach(pair => {
      try {
        new UptimeMonitor(pair.url.value, pair.user.value, parseInt(pair.user.key.substring(4)));
      } catch (error) {
        console.error(`Error creating UptimeMonitor instance for User: ${pair.user.value}, URL: ${pair.url.value}`);
        delete data[pair.user.key];
        delete data[pair.url.key];
      }
    });
  });
}

startMonitoringWithPairedData();
