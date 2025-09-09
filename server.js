const express = require('express');
const mongoose = require('mongoose');
const cors = require('./config/cors');
const routes = require('./routes');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middlewares/errorHandler');

// Load environment variables
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors);
app.use(express.json());

// Routes
app.use(routes);

// Error handling middleware
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});