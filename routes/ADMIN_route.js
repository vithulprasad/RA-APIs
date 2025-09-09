const express = require('express');
const router = express.Router();
const UserController = require('../controllers/USER_controller')
const PC_controller = require('../controllers/PC_controller')
const Brand_controller = require('../controllers/BRAND_controller')
const bannerController = require('../controllers/BANNER_controller')
const orderController = require('../controllers/Order_controller')
const home_controller = require("../controllers/home_controller")

const { authenticate } = require('../config/auth');

router.post('/api/log_in', UserController.admin_login); 
router.post('/api/sign_up', UserController.admin_sign_up); 
router.post('/api/check_otp', UserController.admin_sign_in_otp); 
router.get('/api/verify_admin',UserController.verify);


// category routes
router.post('/api/create_category', PC_controller.create_category); 
router.get('/api/list_category', PC_controller.list_category); 
router.get('/api/list_category_main', PC_controller.list_category_main); 
router.get('/api/list_collection_main', PC_controller.list_collections_main); 
router.get('/api/category_single',PC_controller.category_single)
router.delete('/api/delete_category', PC_controller.category_delete)
router.post('/api/edit_category', PC_controller.category_edit); 

// product routes

router.post('/api/create_product',PC_controller.product_create)
router.post('/api/edit_product',PC_controller.product_update)
router.get('/api/get_product_by_id',PC_controller.get_product_by_id)
router.get('/api/product_list',PC_controller.product_list) // pagination
router.get('/api/product_delete',PC_controller.product_delete) 
router.get('/api/product_recover',PC_controller.product_recover) 
router.get('/api/search_product',PC_controller.search_product)


router.get('/product_dummy_inserter',PC_controller.product_dummy_insert)



//brand routes
router.post('/api/create_brand',Brand_controller.create_brand)
router.post('/api/edit_brand',Brand_controller.edit_brand)
router.get('/api/single_brand',Brand_controller.single_brand)
router.get('/api/list_brands',Brand_controller.list_brand)
router.delete('/api/delete_brand',Brand_controller.delete_brand)
router.get('/api/brand_products',Brand_controller.brand_products)





//banner routes
router.post("/api/create_banner", bannerController.createBanner);
router.put("/api/edit_banner/:id", bannerController.updateBanner);
router.get("/api/single_banner/:id", bannerController.getBannerById);
router.get("/api/all_banners", bannerController.getBanners);
router.delete("/api/delete_banner/:id", bannerController.deleteBanner);


//orders
router.get("/api/orders", orderController.getAllOrders_admin);
router.get("/api/search_orders", orderController.search_orders);
router.get("/api/get_order_admin_single", orderController.get_order_admin_single);
router.post("/api/order_action", orderController.order_action);
router.get("/api/get_customers", orderController.get_customers);
router.get("/api/get_customer_profile", orderController.get_customer_profile);
router.post("/api/send_customer_email", orderController.send_customer_email);


// common image uploader
router.get('/api/search_banner',home_controller.search_banner);
router.get('/api/search_category',home_controller.search_category);
router.get('/api/search_product_for',home_controller.search_product);
router.post("/api/create_home_settings", home_controller.create_home_settings);
router.post("/api/create_collection_section", home_controller.create_collection_section);
router.get('/api/get_home_section',home_controller.get_home_section);
router.get('/api/get_collection_section',home_controller.get_collection_section);
router.get('/api/product_details',home_controller.product_details);
router.get('/api/review_action',home_controller.review_action);

router.delete('/api/delete_product_collection',home_controller.delete_product_collection);




module.exports = router;