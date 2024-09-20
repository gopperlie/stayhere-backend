const GREETING = "Welcome to stayhere";

const greetingHandler = async (req, res) => {
  res.send({
    greeting: GREETING,
  });
};

export default greetingHandler;
