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
router.post('/api/create_category',authenticate, PC_controller.create_category); 
router.get('/api/list_category',authenticate, PC_controller.list_category); 
router.get('/api/list_category_main',authenticate, PC_controller.list_category_main); 
router.get('/api/list_collection_main',authenticate, PC_controller.list_collections_main); 
router.get('/api/category_single',authenticate,PC_controller.category_single)
router.delete('/api/delete_category',authenticate, PC_controller.category_delete)
router.post('/api/edit_category',authenticate, PC_controller.category_edit); 

// product routes

router.post('/api/create_product',authenticate,PC_controller.product_create)
router.post('/api/edit_product',authenticate,PC_controller.product_update)
router.get('/api/get_product_by_id',authenticate,PC_controller.get_product_by_id)
router.get('/api/product_list',authenticate,PC_controller.product_list) // pagination
router.get('/api/product_delete',authenticate,PC_controller.product_delete) 
router.get('/api/product_recover',authenticate,PC_controller.product_recover) 
router.get('/api/search_product',authenticate,PC_controller.search_product)


router.get('/product_dummy_inserter',PC_controller.product_dummy_insert)



//brand routes
router.post('/api/create_brand',authenticate,Brand_controller.create_brand)
router.post('/api/edit_brand',authenticate,Brand_controller.edit_brand)
router.get('/api/single_brand',authenticate,Brand_controller.single_brand)
router.get('/api/list_brands',authenticate,Brand_controller.list_brand)
router.delete('/api/delete_brand',authenticate,Brand_controller.delete_brand)
router.get('/api/brand_products',authenticate,Brand_controller.brand_products)





//banner routes
router.post("/api/create_banner",authenticate, bannerController.createBanner);
router.put("/api/edit_banner/:id",authenticate, bannerController.updateBanner);
router.get("/api/single_banner/:id",authenticate, bannerController.getBannerById);
router.get("/api/all_banners",authenticate, bannerController.getBanners);
router.delete("/api/delete_banner/:id",authenticate, bannerController.deleteBanner);


//orders
router.get("/api/orders",authenticate, orderController.getAllOrders_admin);
router.get("/api/search_orders", authenticate,orderController.search_orders);
router.get("/api/get_order_admin_single",authenticate, orderController.get_order_admin_single);
router.post("/api/order_action",authenticate, orderController.order_action);
router.get("/api/get_customers",authenticate, orderController.get_customers);
router.get("/api/get_customer_profile",authenticate, orderController.get_customer_profile);
router.post("/api/send_customer_email",authenticate, orderController.send_customer_email);


// common image uploader
router.get('/api/search_banner',authenticate,home_controller.search_banner);
router.get('/api/search_category',authenticate,home_controller.search_category);
router.get('/api/search_product_for',authenticate,home_controller.search_product);
router.post("/api/create_home_settings", authenticate,home_controller.create_home_settings);
router.post("/api/create_collection_section",authenticate, home_controller.create_collection_section);
router.get('/api/get_home_section',authenticate,home_controller.get_home_section);
router.get('/api/get_collection_section',authenticate,home_controller.get_collection_section);
router.get('/api/product_details',authenticate,home_controller.product_details);
router.get('/api/review_action',authenticate,home_controller.review_action);
router.get('/api/add_quantity',authenticate,home_controller.add_quantity);

router.delete('/api/delete_product_collection',authenticate,home_controller.delete_product_collection);



module.exports = router;