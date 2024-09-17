const GREETING = "Welcome to stayhere";

module.exports = async (req, res) => {
  res.send({
    greeting: GREETING,
  });
};
