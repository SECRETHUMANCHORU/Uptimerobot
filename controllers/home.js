const { errorHandler } = require("../utils");

exports.home = async (req, res, next) => {
  res.json({"Owner":"Choru TikTokers"});
};
