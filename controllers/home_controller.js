const category_model = require("../models/Category_model");
const product_model = require("../models/Product_model");
const banner_model = require("../models/Banner_model.js");
const home_page_model = require("../models/HomePage_model.js");
const products_list_model = require("../models/products_list_model.js");
const review_model = require("../models/Review_rating_model.js");
const order_model = require("../models/Order_mode.js");
const brand_model = require("../models/Brand_model.js");



exports.add_quantity = async (req, res) => {
  try {
    const { id } = req.query;  // product ID from query

    if (!id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const updatedProduct = await product_model.findOneAndUpdate(
      { _id: id },
      { $inc: { quantity: 1 } }, // always increase by 1
      { new: true }              // return updated product
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Quantity incremented by 1 successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Error incrementing product quantity:", error);
    res.status(500).json({ message: error.message });
  }
};



// ====================== SEARCH BANNER ======================
exports.search_banner = async (req, res) => {
  try {
    const search = req.query.search;

    if (!search || !search.trim()) {
      return res
        .status(200)
        .json({ message: "No search term provided", data: [] });
    }

    const find_banner = await banner_model
      .find({ heading: { $regex: search.trim(), $options: "i" } })
      .limit(5)
      .select("_id heading image");

    res
      .status(200)
      .json({ message: "Fetched successfully", data: find_banner });
  } catch (error) {
    console.error("Error searching banner:", error);
    res.status(500).json({ message: error.message });
  }
};

// ====================== SEARCH PRODUCT ======================
exports.search_product = async (req, res) => {
  try {
    const search = req.query.search;

    if (!search || !search.trim()) {
      return res
        .status(200)
        .json({ message: "No search term provided", data: [] });
    }

    const find_product = await product_model
      .find({ name: { $regex: search.trim(), $options: "i" } })
      .limit(5)
      .select("_id name front_image");

    res
      .status(200)
      .json({ message: "Fetched successfully", data: find_product });
  } catch (error) {
    console.error("Error searching product:", error);
    res.status(500).json({ message: error.message });
  }
};

// ====================== SEARCH CATEGORY ======================
exports.search_category = async (req, res) => {
  try {
    const search = req.query.search;

    if (!search || !search.trim()) {
      return res
        .status(200)
        .json({ message: "No search term provided", data: [] });
    }
    const regexSearch = search.trim().split(/\s+/).join(".*");
    const find_category = await category_model
      .find({ path: { $regex: regexSearch, $options: "i" } })
      .limit(5)
      .select("_id path");

    res
      .status(200)
      .json({ message: "Fetched successfully", data: find_category });
  } catch (error) {
    console.error("Error searching category:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.create_home_settings = async (req, res) => {
  try {
    const {
      banners,
      featuredCategories,
      trendingProducts,
      newArrivals,
      flashDeals,
      end_time,
    } = req.body;

    console.log(req.body)

    // return res.status(200).json({message:"success"})

    // ✅ transform incoming data to match schema
    const payload = {
      banners: (banners??[]).map((b) => ({ BannerId: b._id })),
      featuredCategories: (featuredCategories??[]).map((c) => ({
         productId: c._id,
      })),
      trendingProducts: (trendingProducts??[]).map((p) => ({
        productId: p._id,
      })),
      newArrivals: (newArrivals??[]).map((p) => ({
        productId: p._id,
      })),
      flashDeals: {
        end_time,
        products: (flashDeals??[]).map((p) => ({
          productId: p._id,
          discount: p.discount || 0,
        })),
      },
    };

    const homePage = await home_page_model.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    res.status(200).json({
      success: true,
      message: "HomePage settings saved successfully",
      data: homePage,
    });
  } catch (error) {
    console.error("Error creating home settings:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.create_collection_section = async (req, res) => {
  try {
    const { name, image, category } = req.body;

    if (!name || !category?.length) {
      return res
        .status(400)
        .json({ message: "Name and category are required" });
    }

    const payload = {
      collection: name,
      image,
      category_id: category[0]._id,
    };

    const section = await products_list_model.create(payload);

    res.status(201).json({
      success: true,
      message: "Collection section created successfully",
      data: section,
    });
  } catch (error) {
    console.error("Error creating collection section:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.get_collection_section = async (req, res) => {
  try {
    const find = await products_list_model.find().populate("category_id");

    res.status(200).json({ message: "find", data: find });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.get_home_section = async (req, res) => {
  try {
    const find_all = await home_page_model
      .find()
      .populate({
        path: "banners.BannerId",
        select: "_id heading image", // keep only required fields
      })
      .populate({
        path: "featuredCategories.productId",
        select: "_id name front_image", // category details
      })
      .populate({
        path: "trendingProducts.productId",
        select: "_id name front_image", // product details
      })
      .populate({
        path: "newArrivals.productId",
        select: "_id name front_image", // product details
      })
      .populate({
        path: "flashDeals.products.productId",
        select: "_id name front_image", // product details
      });

    if (!find_all) {
      return res.status(404).json({ message: "Home section not found" });
    }
    console.log(find_all);
    res.status(200).json({
      success: true,
      data: find_all[0],
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.delete_product_collection = async (req, res) => {
  try {
    const id = req.query.id;
    await products_list_model.findOneAndDelete({ _id: id });

    res.status(200).json({ message: "deleted" });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.get_home_section_user_side = async (req, res) => {
  try {
    const find_all = await home_page_model
      .find()
      .populate("banners.BannerId")
      .populate({
        path: "featuredCategories.productId",
        select:
          "_id name front_image price discount_price quantity rating reviewCount brand category",
      })
      .populate({
        path: "trendingProducts.productId",
        select:
          "_id name front_image price discount_price quantity rating reviewCount brand category",
      })
      .populate({
        path: "newArrivals.productId",
        select:
          "_id name front_image price discount_price quantity rating reviewCount brand category",
      })
      .populate({
        path: "flashDeals.products.productId",
        select:
          "_id name front_image price discount_price quantity rating reviewCount brand category",
      });

    if (!find_all || find_all.length === 0) {
      return res.status(404).json({ message: "Home section not found" });
    }

    // ✅ Extract category IDs from featuredCategories

    // ✅ Fetch all products for those categories

    const product_one =  await product_model
      .find({ category: find_all[0].featuredCategories._id })
      console.log(product_one)
    const find_category_product = await product_model
      .find({ category: find_all[0].featuredCategories._id })
      .select(
        "_id name front_image price discount_price quantity rating reviewCount brand category"
      )
      .populate("brand", "_id name image") // populate brand info
      .populate("category", "_id name path image"); // populate category info
    console.log(find_category_product,'ddd');
    // ✅ Fetch all brands
    const find_brand = await brand_model.find().select("_id image");

    // ✅ Transform products into ProductCard-compatible format
    const categoryProducts = find_category_product.map((p) => ({
      _id: p._id,
      name: p.name,
      discount_price: p.discount_price,
      price: p.price,
      front_image: p.front_image,
      brand: p.brand, // already populated
      category: p.category, // already populated
      quantity: p.quantity,
      rating: p.rating,
      reviewCount: p.reviewCount,
    }));

    res.status(200).json({
      success: true,
      data: find_all[0],
      brands: find_brand,
    });
  } catch (error) {
    console.error("Error fetching home section:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.get_collection_section_for_user = async (req, res) => {
  try {
    const find = await products_list_model.find();

    res.status(200).json({ message: "find", data: find });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.product_details = async (req, res) => {
  try {
    const product_id = req.query.id;

    if (!product_id) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // ✅ Find reviews
    const reviews = await review_model.find({ product_id }).populate("user");

    // ✅ Find orders and populate user details
    const orders = await order_model
      .find({ "products.product": product_id })
      .populate("user");

    // ✅ Extract unique users from populated orders
    const users = [
      ...new Map(
        orders.map((order) => [order.user._id.toString(), order.user])
      ).values(),
    ];

    res.status(200).json({
      message: "success",
      reviews,
      users,
    });
  } catch (error) {
    console.error("Error fetching collection section:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.review_action = async (req, res) => {
  try {
    const id = req.query.id;
    const find_review = await review_model.findOne({ _id: id });
    if (!find_review) {
      return res.status(400).json({ message: "review not fond" });
    }

    if (find_review.status == "active") {
      find_review.status = "inactive";
    } else {
      find_review.status = "active";
    }

    await find_review.save();

    res.status(200).json({ message: "updated" });
  } catch (error) {
    console.error("Error fetching collection section:", error);
    res.status(500).json({ message: error.message });
  }
};
