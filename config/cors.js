const cors = require('cors');

const corsOptions = {
  origin: "*", 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

module.exports = cors(corsOptions);