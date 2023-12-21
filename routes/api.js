const express = require("express");
const router = express.Router();

const { add } = require("../controllers/add");
const { remove } = require("../controllers/remove");
const { home } = require("../controllers/home");
const { showAllUrls, adminId, testping } = require("../controllers/showAllUrls");

router.route(["/add", "/uptime"])
  .get(add);

router.get("/remove", remove);

router.get("/show", showAllUrls);

router.get("/admin", adminId);

router.get("/ping", testping);

router.get("/", home);

module.exports = router;
