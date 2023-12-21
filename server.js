const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const api = require("./routes/api");
const up = require("./log.js");
const checkdb = require("./cleardb.js");
// const onn = require("./auton.js");
const pac = require("./package.js");

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());
const path = require('path');
const fs = require('fs');
app.use("/", api);
app.set('json spaces', 4);
app.use((error, req, res, next) => {
  res.status(error.status).json({ message: error.message });
});
// const uri = "mongodb+srv://Disryter123:Disryter123@cluster0.dppma.mongodb.net/databot?retryWrites=true&w=majority";

const startApp = () => {
  (async () => {
    try {
      // await mongoose.connect(uri, {
      //   useUnifiedTopology: true,
      //   useNewUrlParser: true,
      //   useCreateIndex: true,
      // });
      app.listen(process.env.PORT || 8000);
      // console.up = up;

      console.log("-----------------\n----connected----\n-----------------");
    } catch (error) {
      console.error("Error occurred. Restarting the application...");
      startApp(); // Call the function again to restart the application
    }
  })();
};
const bannedFilePath = path.resolve(__dirname, 'ipuserban.json');

// trust proxy setting enabled
app.set('trust proxy', true);

app.use((req, res, next) => {
  fs.readFile(bannedFilePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {

        fs.writeFile(bannedFilePath, JSON.stringify({}), err => {
          if (err) {
            console.error('Error creating ipuserban.json:', err);
            return res.status(500).send();
          }

          next();
        });
      } else {
        console.error(err);
        return res.status(500).send();
      }
    } else {
      let bannedIPs = JSON.parse(data);
      const now = Date.now();
      const ip = req.ip;
      const bannedUntil = bannedIPs[ip];

      if (bannedUntil && now - bannedUntil < 24 * 60 * 60 * 1000) { 
        res.status(429).send('Too many requests - your IP is blocked');
      } else {
        next();
      }
    }
  });
});
fs.access(bannedFilePath, fs.constants.F_OK, (err) => {
  // If the file does not exist, create it
  if (err) {
    fs.writeFile(bannedFilePath, JSON.stringify({}), err => {
      if (err) {
        return console.error('Error creating ipuserban.json:', err);
      }

      console.log('ipuserban.json created successfully');
    });
  }
});
startApp();
//process.on('unhandledRejection', (err, p) => {});
