const express = require('express');
const router = express.Router();

const UserRoutes = require('./USER_route')
const AdminRoutes = require('./ADMIN_route')

// Use data-related routes
router.use('/',UserRoutes);
router.use('/admin',AdminRoutes);


module.exports = router;