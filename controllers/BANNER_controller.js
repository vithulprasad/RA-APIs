const Banner = require("../models/Banner_model");
const home_page_model = require("../models/HomePage_model")

// Create Banner
exports.createBanner = async (req, res) => {
  try {
    const banner = new Banner(req.body);
    const savedBanner = await banner.save();
    res.status(200).json({ message: "Banner created successfully", data: savedBanner });
  } catch (error) {
        if (error.name === "ValidationError") {
      // Collect all validation error messages
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }

    res.status(500).json({ message: error.message });
  }
};

// Get All Banners
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.status(200).json({ message: "Banners fetched successfully", data: banners });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Banner
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.status(200).json({ message: "Banner fetched successfully", data: banner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Banner
exports.updateBanner = async (req, res) => {
  try {
    const updatedBanner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updatedBanner) return res.status(404).json({ message: "Banner not found" });
    res.status(200).json({ message: "Banner updated successfully", data: updatedBanner });
  } catch (error) {
        if (error.name === "ValidationError") {
      // Collect all validation error messages
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }

    res.status(500).json({ message: error.message });
  }
};

// Delete Banner
exports.deleteBanner = async (req, res) => {
  try {
    const deletedBanner = await Banner.findByIdAndDelete(req.params.id);
    if (!deletedBanner) return res.status(404).json({ message: "Banner not found" });
    res.status(200).json({ message: "Banner deleted successfully", data: deletedBanner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





exports.getHomePage = async (req, res) => {
  try {
    const homeData = await home_page_model.findOne()
      .populate("featuredCategories.categoryId")
      .populate("trendingProducts.productId")
      .populate("newArrivals.productId")
      .populate("flashDeals.products.productId");

    res.json(homeData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.createHomePage = async (req, res) => {
  try {
    // check if homepage already exists (only one allowed)
    const exists = await HomePage.findOne();
    if (exists) {
      return res
        .status(400)
        .json({ message: "HomePage already exists, use update instead." });
    }

    const homePage = new HomePage(req.body);
    const saved = await homePage.save();

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update HomePage
exports.updateHomePage = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await HomePage.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("featuredCategories.categoryId")
      .populate("trendingProducts.productId")
      .populate("newArrivals.productId")
      .populate("flashDeals.products.productId");

    if (!updated) {
      return res.status(404).json({ message: "HomePage not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};