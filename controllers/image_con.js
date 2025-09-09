const cloudinary = require("cloudinary").v2;
require('dotenv').config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload an image to Cloudinary
const uploadImageToCloudinary = async (filePath, folderName) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folderName,
    });
    return result.secure_url; 
  } catch (error) {
    console.error("Failed to upload image to Cloudinary:", error);
    throw error;
  }
};




exports.create_media = async (req, res) => {
  try {
    console.log(req.body)
    if (req.file) {
      const file = req.file;

      if (!file) {
        return res
          .status(400)
          .send({ message: "Image is required", statusCode: 400 });
      }

      // give and Get the image URL from Cloudinary response
      const imageURL = await uploadImageToCloudinary(
        file.path,
        "media"
      );

      if (!imageURL) {
        return res
          .status(500)
          .send({ message: "File upload failed", statusCode: 500 });
      }
     

      res.status(200).send({
        message: "image is ready",
        statusCode: 200,
        data: imageURL,
      });
    } else {
      res
        .status(200)
        .send({ message: "failed to create media", statusCode: 400 });
    }
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).send({ message: error.message, statusCode: 400 });
  }
};