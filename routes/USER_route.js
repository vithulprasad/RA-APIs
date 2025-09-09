const express = require('express');
const router = express.Router();
const USER_controller = require('../controllers/USER_controller')
const Order_controller = require("../controllers/Order_controller")
const { authenticate } = require('../config/auth');
const home_controller = require('../controllers/home_controller.js')
const image = require('../controllers/image_con.js')

router.post('/api/log_in', USER_controller.user_login); 
router.post('/api/sign_up', USER_controller.user_sign_up); 
router.post('/api/verify_otp', USER_controller.verify_otp); 
router.post('/api/google_sign_in_login',USER_controller.google_sign_in_login)




router.get('/api/get_profile',authenticate,USER_controller.get_profile)
router.post('/api/create_address',authenticate,USER_controller.create_address)
router.post('/api/edit_address',authenticate,USER_controller.edit_address)
router.delete('/api/delete_address',authenticate,USER_controller.delete_address)
router.post('/api/profile_name_edit',authenticate,USER_controller.profile_name_edit)
router.post('/api/profile_password_edit',authenticate,USER_controller.profile_password_edit)
router.post('/api/forgot_password',USER_controller.forgot_password)
router.post('/api/forgot_password_email_verify',USER_controller.forgot_password_email_verify)


router.get('/api/fetch_all_collections',USER_controller.fetch_all_collections)
router.get('/api/search',USER_controller.search)
router.get('/api/home',home_controller.get_home_section_user_side)
router.get('/api/collections',home_controller.get_collection_section_for_user)
router.get('/api/fetch_collections_by_id',USER_controller.fetch_collections_by_main_id)

router.get('/api/fetch_products_by_collection',USER_controller.fetch_products_by_collection_id)
router.get('/api/fetch_filter_category_by_id',USER_controller.fetch_filter_category_by_id)
router.get('/api/fetch_product',USER_controller.fetch_product)


router.post('/api/add_to_cart',authenticate,USER_controller.add_to_cart)
router.post('/api/remove_cart_product',authenticate,USER_controller.remove_cart_product_by_id)
router.post('/api/update_cart_quantity',authenticate,USER_controller.update_cart_quantity)
router.get('/api/find_cart',authenticate,USER_controller.find_user_cart)
router.post('/api/liked_product',authenticate,USER_controller.liked_product)
router.get('/api/find_liked_products',authenticate,USER_controller.find_liked_products)
router.get('/api/collection_list',USER_controller.collection_list)
router.post('/api/create_review_rating',authenticate,USER_controller.create_review_rating)
router.get('/api/find_product_review',USER_controller.find_product_review)

router.post('/api/create_order',authenticate,Order_controller.createOrder)
router.post('/api/verify_order',authenticate,Order_controller.verifyPayment)
router.post('/api/update_status',authenticate,Order_controller.updateOrderStatus)
router.post('/api/webhook',Order_controller.razorpayWebhook)
router.get('/api/get_user_order',authenticate,Order_controller.getUserOrders)
router.get('/api/get_order_cart',authenticate,Order_controller.cart_find)
router.get('/api/get_order_product',authenticate,Order_controller.single_product)
router.get('/api/get_order_address',authenticate,Order_controller.get_address)
router.get('/api/get_order_single_by_id',authenticate,Order_controller.get_order_single_by_id)

const multer = require("multer");
const path = require("path");

// Configure Multer to store files locally
const storage = multer.diskStorage({
  destination: "./uploadss",
  filename: (req, file, cb) => {
    const suffix = Date.now() + "-" + `${Math.random()}`.substring(2);
    const name = path.parse(file.originalname).name;
    return cb(null, suffix + "-" + name + ".webp");
  },
});

// Create the Multer instance with the storage configuration
const upload = multer({ storage: storage });


router.post('/api/image_upload',upload.single('file'),image.create_media)


module.exports = router;