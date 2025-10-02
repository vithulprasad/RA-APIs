const OTP_model = require("../models/OTP_model");
const Admin_model = require("../models/Admin_model");
const product_model = require("../models/Product_model");
const category_model = require("../models/Category_model");
const banner_model = require("../models/Banner_model");
const brand_model = require("../models/Brand_model");
const cart_model = require("../models/Cart_model");
const mongoose = require("mongoose");
const review_model = require("../models/Review_rating_model");
const { sendEmail } = require("../config/mailer");
const bcrypt = require("bcrypt");
const jwt = require("../config/jwt");
const validator = require("validator");
const user_model = require("../models/User_model");
const RANDOM_OTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

exports.admin_login = async (req, res) => {
  try {
    const { Email, password } = req.body;
    const find_admin = await Admin_model.findOne({ Email: Email });
    if (!find_admin) {
      return res.status(400).json({ message: "email is incorrect" });
    }
    const passwordMatch = await bcrypt.compare(password, find_admin.password);

    if (!passwordMatch) {
      return res
        .status(400)
        .json({ message: "password is incorrect", data: [] });
    }

    await OTP_model.deleteMany({ FROM: Email });
    const create_otp = await new OTP_model({
      OTP: RANDOM_OTP(),
      FROM: Email,
    }).save();
    const response = sendEmail(
      Email,
      "otp for real admin",
      `Your OTP is ${create_otp.OTP}`
    );

    res.status(200).json({
      message: "Otp sent to your email",
      data: response,
      code: create_otp.OTP,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.admin_sign_up = async (req, res) => {
  try {
    console.log("admin sign up");
    const { name, Email, password } = req.body;

    if (!name || !Email || !password) {
      return res.status(400).json({
        message: "Please provide name, Email, and password",
      });
    }

    const find_admin_exist = await Admin_model.find();
    if (find_admin_exist.length > 0) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const create_admin = new Admin_model({
      name,
      Email,
      password: passwordHash,
    });

    await create_admin.save();

    res.status(201).json(create_admin);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.admin_sign_in_otp = async (req, res) => {
  try {
    const { Email, OTP } = req.body;

    const find_otp = await OTP_model.findOne({ FROM: Email });

    const find_email = await Admin_model.findOne({ Email: Email });

    if (!find_email) {
      return res.status(400).json({ message: "email not exists" });
    }

    if (!find_otp) {
      return res
        .status(400)
        .json({ message: "otp not registered to email please try again" });
    }

    if (find_otp.OTP != OTP) {
      return res.status(400).json({ message: "otp not matching" });
    }

    await OTP_model.deleteMany({ FROM: Email });

    const token = jwt.generateToken({ user_id: find_email._id });

    res.status(200).json({ message: "otp verified", token: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verify = async (req, res) => {
  try {
    const find_verified = jwt.verifyTokenCheck(req.query?.token);
    console.log(find_verified);
    if (find_verified.user_id) {
      res.status(200).json({ message: "ok" });
    } else {
      res.status(400).json({ message: "token expired" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.user_login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    const find_email = await user_model.findOne({ email: email });
    if (!find_email) {
      return res.status(400).json({ message: "email is incorrect" });
    }

    if (find_email.flag == false) {
      return res.status(400).json({ message: "user access removed" });
    }

    const passwordMatch = await bcrypt.compare(password, find_email.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "password is incorrect" });
    }

    const token = jwt.generateToken({ user_id: find_email._id });

    const find_cart = await cart_model.findOne({ user: find_email._id });
    res.status(200).json({
      message: `welcome back ${find_email.name}`,
      data: {
        name: find_email.name,
        token: token,
        email: find_email.email,
        cart_count: find_cart ? find_cart.items.length : 0,
        like_count: find_email.liked_products.length,
        liked_product: find_email.liked_products,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.user_sign_up = async (req, res) => {
  try {
    console.log("user sign up", req.body);

    const { fullName, email, password, confirmPassword } = req.body;

    const find_email = await user_model.findOne({ email: email });
    if (find_email) {
      return res.status(400).json({ message: "Email already taken" });
    }
    // Email validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Email is not valid" });
    }

    // Password length & complexity check
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and contain both letters and numbers",
      });
    }

    if (password.split("").some((val) => val == " ")) {
      return res
        .status(400)
        .json({ message: "please don't use space in password" });
    }

    // Confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    await OTP_model.deleteMany({ FROM: email });
    const create_otp = await new OTP_model({
      OTP: RANDOM_OTP(),
      FROM: email,
    }).save();

    const htmlContent = `
  <div style="background-color:#f5f8fa; padding:20px; font-family:Arial, sans-serif; text-align:center;">

    <div style="background-color:white; padding:20px; display:inline-block; text-align:left;">
      <img src="https://www.logoai.com/api/proxy?url=https:%2F%2Ftempfile.aiquickdraw.com%2Fs%2F6f99adf9130fd9222ec7fcfb3605d75c_0_1754416431_8402.png" 
           alt="Real Accessories" width="150" style="display:block; margin-bottom:10px;" />
      <p><strong>Verify Email by OTP</strong></p>
      <p>Thank you for Using Real accessories </p>
      <p><strong>Your OTP:</strong> ${create_otp.OTP}</p>
    </div>

  </div>
  `;
    const response = await sendEmail(
      email,
      "Real Accessories OTP for User Registration",
      htmlContent
    );
    console.log(response, "dfdfd");
    res.status(200).json({ message: "Otp sent to your email" });
    // Continue your logic (e.g., save user to DB)
  } catch (error) {
    console.log(error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.verify_otp = async (req, res) => {
  try {
    console.log(req.body);

    const { fullName, email, password, confirmPassword, otp } = req.body;
    const find_otp = await OTP_model.findOne({ FROM: email });

    if (!find_otp) {
      return res
        .status(400)
        .json({ message: "otp not registered to email please try again" });
    }

    if (find_otp.OTP != otp) {
      return res.status(400).json({ message: "otp not matching" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Email is not valid" });
    }

    // Password length & complexity check
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and contain both letters and numbers",
      });
    }

    if (password.split("").some((val) => val == " ")) {
      return res
        .status(400)
        .json({ message: "please don't use space in password" });
    }

    // Confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const find_email = await user_model.findOne({ email: email });
    if (find_email) {
      return res.status(400).json({ message: "Email already taken" });
    }

    await OTP_model.deleteMany({ FROM: email });
    const passwordHash = await bcrypt.hash(password, 10);

    const create_user = new user_model({
      name: fullName,
      email: email,
      password: passwordHash,
    });
    const new_user = await create_user.save();
    const token = jwt.generateToken({ user_id: new_user._id });
    res.status(200).json({
      message: `welcome ${fullName}`,
      data: { name: fullName, token: token, email: email },
    });
  } catch (error) {
    console.log(error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.get_profile = async (req, res) => {
  try {
    const user = req.user;

    const find_user = await user_model.findOne({ _id: user.user_id });
    console.log(user);
    return res.status(200).json({ message: "dfadf", data: find_user });
  } catch (error) {
    console.log(error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.create_address = async (req, res) => {
  try {
    const {
      phone,
      pin_code,
      locality,
      address,
      town,
      state,
      landmark,
      alternate_phone,
      flag,
    } = req.body;

    // 1️⃣ VALIDATIONS
    if (!phone || phone.toString().length !== 10) {
      return res
        .status(400)
        .json({ message: "Phone is required and must be 10 digits" });
    }

    if (!pin_code) {
      return res.status(400).json({ message: "Pincode is required" });
    }

    if (!address || address.trim() === "") {
      return res.status(400).json({ message: "Address is required" });
    }

    if (alternate_phone && alternate_phone.toString().length !== 10) {
      return res
        .status(400)
        .json({ message: "Alternate phone must be 10 digits" });
    }

    const find_address = await user_model.findOne({ _id: req.user.user_id });

    if (!find_address) {
      return res.status(400).json({ message: "user not found" });
    }

    if (find_address.address.length > 4) {
      return res
        .status(400)
        .json({ message: "address creation limit reached" });
    }
    // 2️⃣ FIND USER AND UPDATE
    const updatedUser = await user_model.findByIdAndUpdate(
      req.user.user_id,
      {
        $push: {
          address: {
            phone,
            pin_code,
            locality,
            address,
            town,
            state,
            landmark,
            alternate_phone,
            flag: flag ?? false,
          },
        },
      },
      { new: true } // return updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Address added successfully",
      data: updatedUser.address,
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};
exports.delete_address = async (req, res) => {
  try {
    const user = req.user;
    const find_user = await user_model.findOne({ _id: user.user_id });

    if (!find_user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the address list by removing the given ID
    const data = find_user.address.filter(
      (val) => val._id.toString() !== req.query.id
    );

    find_user.address = data;
    await find_user.save();

    res.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.edit_address = async (req, res) => {
  try {
    const user = req.user;
    const {
      _id,
      phone,
      pin_code,
      locality,
      address,
      town,
      state,
      landmark,
      alternate_phone,
    } = req.body;

    const find_user = await user_model.findOne({ _id: user.user_id });

    if (!find_user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the address object
    const addressObj = find_user.address.find(
      (val) => val._id.toString() === _id
    );

    if (!addressObj) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Update fields
    addressObj.phone = phone;
    addressObj.pin_code = pin_code;
    addressObj.locality = locality;
    addressObj.address = address;
    addressObj.town = town;
    addressObj.state = state;
    addressObj.landmark = landmark;
    addressObj.alternate_phone = alternate_phone;

    await find_user.save();

    res.status(200).json({
      message: "Address updated successfully",
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.profile_name_edit = async (req, res) => {
  try {
    const find_user = await user_model.findOne({ _id: req.user.user_id });
    if (!find_user) {
      return res.status(400).json({ message: "user not found" });
    }

    console.log(req.body.name);
    if (req.body.name == "") {
      return res.status(400).json({ message: "please add something" });
    }

    find_user.name = req.body.name;

    await find_user.save();

    res.status(200).json({
      message: "user name updated successfully",
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.profile_password_edit = async (req, res) => {
  try {
    const { current_password, new_password, confirm_new_password } = req.body;
    const find_user = await user_model.findOne({ _id: req.user.user_id });

    const passwordMatch = await bcrypt.compare(
      current_password,
      find_user.password
    );
    if (!passwordMatch) {
      return res.status(400).json({ message: "password is incorrect" });
    }
    console.log(new_password, "dfd", confirm_new_password);
    if (new_password != confirm_new_password) {
      return res.status(400).json({ message: "confirm password not matching" });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (!passwordRegex.test(new_password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and contain both letters and numbers",
      });
    }

    if (new_password.split("").some((val) => val == " ")) {
      return res
        .status(400)
        .json({ message: "please don't use space in password" });
    }
    const passwordHash = await bcrypt.hash(new_password, 10);

    find_user.password = passwordHash;
    await find_user.save();

    res.status(200).json({
      message: "password updated successfully",
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.forgot_password_email_verify = async (req, res) => {
  try {
    console.log(req.body);
    const email = req.body.email;
    const find_email = await user_model.findOne({ email: req.body.email });
    if (!find_email) {
      return res
        .status(400)
        .json({ message: "email not exist please sign up" });
    }

    await OTP_model.deleteMany({ FROM: email });
    const create_otp = await new OTP_model({
      OTP: RANDOM_OTP(),
      FROM: email,
    }).save();

    const htmlContent = `
  <div style="background-color:#f5f8fa; padding:20px; font-family:Arial, sans-serif; text-align:center;">

    <div style="background-color:white; padding:20px; display:inline-block; text-align:left;">
      <img src="https://www.logoai.com/api/proxy?url=https:%2F%2Ftempfile.aiquickdraw.com%2Fs%2F6f99adf9130fd9222ec7fcfb3605d75c_0_1754416431_8402.png" 
           alt="Real Accessories" width="150" style="display:block; margin-bottom:10px;" />
      <p><strong>Verify Email by OTP</strong></p>
      <p>Thank you for Using Real accessories </p>
       <p>happy to sent you forgot password otp </p>
      <p><strong>Your OTP:</strong> ${create_otp.OTP}</p>
    </div>

  </div>
  `;
    const response = await sendEmail(
      email,
      "Real Accessories OTP for Forgot Password",
      htmlContent
    );

    res.status(200).json({ message: "Otp sent to your email" });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};
exports.forgot_password = async (req, res) => {
  try {
    console.log(req.body);

    const { email, password, confirm_password, otp } = req.body;
    const find_otp = await OTP_model.findOne({ FROM: email });
    if (!find_otp) {
      return res
        .status(400)
        .json({ message: "otp not registered to email please try again" });
    }

    if (find_otp.OTP != otp) {
      return res.status(400).json({ message: "otp not matching" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Email is not valid" });
    }

    // Password length & complexity check
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and contain both letters and numbers",
      });
    }

    if (password.split("").some((val) => val == " ")) {
      return res
        .status(400)
        .json({ message: "please don't use space in password" });
    }

    // Confirm password match
    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const find_email = await user_model.findOne({ email: email });
    if (!find_email) {
      return res.status(400).json({ message: "email not exist" });
    }

    await OTP_model.deleteMany({ FROM: email });
    const passwordHash = await bcrypt.hash(password, 10);
    if (find_email.password == "google") {
      return res.status(400).json({ message: "account is google login only" });
    }
    find_email.password = passwordHash;
    await find_email.save();
    res.status(200).json({ message: "New password was set Happy shopping" });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.google_sign_in_login = async (req, res) => {
  try {
    const credential = req.body.credential;

    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      return res
        .status(401)
        .json({ message: "Google token verification failed" });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: "Invalid Google token payload" });
    }

    if (!payload.email_verified) {
      return res.status(401).json({ message: "Google email not verified" });
    }

    const { sub, email, name, picture } = payload;

    const find_user = await user_model.findOne({ email: email });

    if (find_user) {
      if (find_user.flag == false) {
        return res.status(401).json({ message: "user access removed" });
      }

      if (find_user.password == "google") {
        const token = jwt.generateToken({ user_id: find_user._id });

        const find_cart = await cart_model.findOne({ user: find_user._id });

        return res.status(200).json({
          message: `welcome back ${find_user.name}`,
          data: {
            name: find_user.name,
            token: token,
            email: email,
            cart_count: find_cart ? find_cart.items.length : 0,
            like_count: find_user.liked_products.length,
            liked_products: find_user.liked_products,
          },
        });
      } else {
        find_user.password = "google";
        await find_user.save();
        const token = jwt.generateToken({ user_id: find_user._id });
        return res.status(200).json({
          message: `welcome back ${find_user.name}`,
          data: { name: find_user.name, token: token, email: email },
        });
      }
    } else {
      const create_user = new user_model({
        name: name,
        email: email,
        password: "google",
      });
      const new_user = await create_user.save();
      const token = jwt.generateToken({ user_id: new_user._id });
      return res.status(200).json({
        message: `welcome ${name}`,
        data: { name: name, token: token, email: email },
      });
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong during Google sign-in" });
  }
};

exports.fetch_all_collections = async (req, res) => {
  try {
    const find_main_collection = await category_model.find({ type: "main" });
    res
      .status(200)
      .json({ message: "data fetched", data: find_main_collection });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.fetch_collections_by_main_id = async (req, res) => {
  try {
    const id = req.query.id;

    const categories = await category_model.aggregate([
      {
        $match: { parent: new mongoose.Types.ObjectId(id) }, // Find categories under main ID
      },
      {
        $lookup: {
          from: "categories", // collection name in MongoDB
          localField: "_id",
          foreignField: "parent",
          as: "items", // subcategories
        },
      },
    ]);
    console.log(categories);
    res.status(200).json({ message: "fetched", data: categories });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.fetch_products_by_collection_id = async (req, res) => {
  try {
    console.log(req.query);
    const { collection, brand, category, page } = req.query;
    const limit = 9;

    let collection_name = "";
    if (collection == "all") {
      collection_name = "";
    } else {
      const find_collection_name = await category_model
        .findOne({ _id: collection })
        .select("name");
      collection_name = find_collection_name.name;
    }

    if (category == "all") {
      collection_name += "";
    } else {
      collection_name += " " + category;
    }

    const regexPattern = collection_name
      .split(/\s+/) // split by spaces
      .map((word) => word) // keep words
      .join(".*"); // allow anything in between

    const results = await category_model
      .find({
        path: { $regex: regexPattern, $options: "i" },
      })
      .select("name");

    let brandFilter = {};

    if (brand && brand !== "all") {
      const find_brand = await brand_model
        .findOne({ name: brand })
        .select("_id");
      if (find_brand) {
        brandFilter = { brand: find_brand._id };
      }
    }

    const products = await product_model
      .find({
        category: { $in: results.map((val) => val._id) },
        ...brandFilter,
      })
      .select(
        "name _id front_image price discount_price brand quantity rating reviewCount"
      )
      .skip((parseInt(page) - 1) * limit)
      .limit(limit);

    const total_document = await product_model.countDocuments({
      category: { $in: results.map((val) => val._id) },
      ...brandFilter,
    });

    const brandsIds = await product_model.distinct("brand");
    const find_brands =
      brandsIds.length > 0
        ? await brand_model.find({ _id: { $in: brandsIds } }).select("_id name")
        : [];

    res.status(200).json({
      message: "your product list found",
      data: products,
      brands: find_brands,
      total_products: total_document,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.fetch_filter_category_by_id = async (req, res) => {
  try {
    if (req.query.id == "all") {
      const find_main_ = await category_model.find({parent:null})
      res.status(200).json({message:'collection find',data:find_main_})
    } else {
      if (!mongoose.Types.ObjectId.isValid(req.query.id)) {
        return res.status(400).json({ message: "url is invalid" });
      } else {
        const parentId = new mongoose.Types.ObjectId(req.query.id);

        const result = await category_model.aggregate([
          {
            $match: { _id: parentId },
          },
          {
            $graphLookup: {
              from: "categories",
              startWith: "$_id",
              connectFromField: "_id",
              connectToField: "parent",
              as: "allChildren",
              depthField: "level",
            },
          },
          { $unwind: "$allChildren" },
          { $match: { "allChildren.type": "part" } },
          {
            $lookup: {
              from: "categories",
              localField: "allChildren._id",
              foreignField: "parent",
              as: "childCheck",
            },
          },
          { $match: { childCheck: { $size: 0 } } },
          {
            // Keep both _id and name
            $project: {
              _id: "$allChildren._id",
              name: "$allChildren.name",
            },
          },
          // Group by name, keep first _id for uniqueness
          {
            $group: {
              _id: "$name",
              id: { $first: "$_id" },
            },
          },
          // Project final output with both id and name
          {
            $project: {
              _id: "$id",
              name: "$_id",
            },
          },
        ]);

        res.status(200).json({ message: "fetched", data: result });
      }
    }
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.fetch_product = async (req, res) => {
  try {
    const find_product = await product_model
      .findOne({ _id: req.query.id })
      .populate("category")
      .populate("brand");

    if (!find_product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Extract categories separately
    const categories = find_product.category ? find_product.category : [];

    // Convert to plain object and remove category from data
    const productData = find_product.toObject();
    delete productData.category;

    const result = categories.map((cat) => {
      if (cat.path.startsWith("Shop by Bike")) {
        const parts = cat.path.split(" > ");
        return parts[2] ?? null; // return third value if exists
      }
      return null;
    });

    res.status(200).json({
      message: "Product fetched successfully",
      data: productData,
      categories: result,
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.add_to_cart = async (req, res) => {
  try {
    const { product_id } = req.body;
    const userId = req.user.user_id;

    // 1. Find product
    const product = await product_model.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Find or create cart
    let cart = await cart_model.findOne({ user: userId });

    if (!cart) {
      // create new cart
      cart = new cart_model({
        user: userId,
        items: [],
        total: 0,
        grand_total: 0,
      });
    }

    // 3. Check if product already in cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === product_id
    );

    if (existingItem) {
      // Check stock
      if (existingItem.quantity + 1 > product.quantity) {
        return res
          .status(400)
          .json({ message: "Requested quantity exceeds available stock" });
      }

      existingItem.quantity += 1;
    } else {
      // Add new product to cart
      if (product.quantity < 1) {
        return res.status(400).json({ message: "Product is out of stock" });
      }

      cart.items.push({
        product: product._id,
        quantity: 1,
        price: product.price,
        discount_price: product.discount_price,
      });
    }

    // 4. Recalculate totals
    let total = 0;
    let grand_total = 0;

    cart.items.forEach((item) => {
      total += item.price * item.quantity;
      grand_total += item.discount_price * item.quantity;
    });

    cart.total = total;
    cart.grand_total = grand_total;

    // 5. Save
    await cart.save();

    res.status(200).json({
      message: "product added to cart",
      cart_count: cart.items.length,
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.remove_cart_product_by_id = async (req, res) => {
  try {
    const { product_id } = req.body; // or req.params.product_id
    const userId = req.user.user_id;

    // 1. Find cart
    const cart = await cart_model.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // 2. Find product index in items
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === product_id
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // 3. Remove product from cart
    cart.items.splice(itemIndex, 1);

    // 4. Recalculate totals
    let total = 0;
    let grand_total = 0;

    cart.items.forEach((item) => {
      total += item.price * item.quantity;
      grand_total += item.discount_price * item.quantity;
    });

    cart.total = total;
    cart.grand_total = grand_total;

    // 5. Save
    await cart.save();

    res.status(200).json({
      message: "Product removed from cart",
      cart_count: cart.items.length,
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.find_user_cart = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const find_cart = await cart_model
      .findOne({ user: user_id })
      .populate("items.product");
    if (find_cart) {
      return res.status(200).json({ message: "cart finded", data: find_cart });
    } else {
      return res.status(200).json({ message: "cart not fond", data: null });
    }
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.update_cart_quantity = async (req, res) => {
  try {
    const { product_id, action } = req.body; // action: 'increment' or 'decrement'
    const userId = req.user.user_id;

    // Validate input
    if (!product_id || !action) {
      return res
        .status(400)
        .json({ message: "Product ID and action are required" });
    }

    if (!["increment", "decrement"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Action must be either 'increment' or 'decrement'" });
    }

    // 1. Find cart
    const cart = await cart_model
      .findOne({ user: userId })
      .populate("items.product");
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // 2. Find product in cart items
    const itemIndex = cart.items.findIndex(
      (item) => item.product._id.toString() === product_id
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const item = cart.items[itemIndex];

    // 3. Update quantity based on action
    if (action === "increment") {
      item.quantity += 1;
    } else if (action === "decrement") {
      item.quantity = Math.max(1, item.quantity - 1); // Prevent quantity below 1
    }
    if (action === "increment") {
      if (item.quantity > item.product.quantity) {
        console.log("working");
        return res
          .status(404)
          .json({ message: "requesting for too much quantity" });
      }
    }

    // 4. Recalculate totals
    let total = 0;
    let grand_total = 0;

    cart.items.forEach((item) => {
      total += item.price * item.quantity;
      grand_total += item.discount_price * item.quantity;
    });

    cart.total = total;
    cart.grand_total = grand_total;

    // 5. Save updated cart
    await cart.save();

    res.status(200).json({
      message: `One Quantity ${action == "increment" ? "added" : "removed"} `,
      cart,
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.liked_product = async (req, res) => {
  try {
    const id = req.body.id;
    const find_user = await user_model.findOne({ _id: req.user.user_id });

    if (!find_user) {
      return res.status(400).json({ message: "user not found" });
    }

    const find_product_exist = await product_model.findOne({ _id: id });
    if (!find_product_exist) {
      return res.status(400).json({ message: "product not exist" });
    }
    let mess = "";
    const find_liked_product = find_user.liked_products.some(
      (val) => val.toString() === id.toString()
    );

    if (find_liked_product) {
      find_user.liked_products = find_user.liked_products.filter(
        (val) => val.toString() !== id.toString()
      );
      mess = "like removed";
    } else {
      find_user.liked_products.push(id);
      mess = "like added";
    }

    await find_user.save();

    res.status(200).json({
      message: mess,
      liked_products: find_user.liked_products,
      liked_count: find_user.liked_products.length,
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.find_liked_products = async (req, res) => {
  try {
    const find_user = await user_model
      .findOne({ _id: req.user.user_id })
      .populate("liked_products");

    res.status(200).json({
      message: "products fond",
      data: find_user.liked_products.map((val) => val),
    });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};
exports.resend_otp = async (req, res) => {
  try {
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.collection_list = async (req, res) => {
  try {
    const find_all_collection = await category_model.find({
      parent: "689ebf79374137762522f193",
    });

    res
      .status(200)
      .json({ message: "collection find", data: find_all_collection });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.create_review_rating = async (req, res) => {
  try {
    const { rating, text, images, product } = req.body;

    if (rating == 0) {
      return res
        .status(400)
        .json({ message: "Please add at least one star rating" });
    }

    // ✅ Check if user already reviewed this product
    const existingReview = await review_model.findOne({
      $and: [{ user: req.user.user_id }, { product_id: product }],
    });

    if (existingReview) {
      return res.status(400).json({
        message: "Sorry, you already added a review for this product",
      });
    }

    // ✅ Create new review
    const newReview = new review_model({
      user: req.user.user_id,
      product_id: product,
      rating,
      description: text,
      images,
    });
    await newReview.save();

    // ✅ Get all active reviews for this product
    const activeReviews = await review_model.find({
      product_id: product,
      status: "active",
    });

    // ✅ Calculate average rating
    const totalRating = activeReviews.reduce(
      (acc, curr) => acc + curr.rating,
      0
    );
    const averageRating = totalRating / activeReviews.length;

    // ✅ Update product stats
    const productDoc = await product_model.findById(product);
    if (!productDoc) {
      return res.status(404).json({ message: "Product not found" });
    }

    productDoc.reviewCount = (productDoc.reviewCount || 0) + 1;
    productDoc.rating = averageRating;
    await productDoc.save();

    res
      .status(200)
      .json({ message: "Review added to the product. Thank you!" });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.find_product_review = async (req, res) => {
  try {
    const id = req.query.id;
    const find = await review_model
      .find({ product_id: id, status: "active" })
      .populate("user")
      .limit(20);

    res.status(200).json({ message: "collection find", data: find });
  } catch (error) {
    console.error(error.message);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: error.message });
  }
};

exports.search = async (req, res) => {
  try {
    const search = req.query.search;
    let limit = 1;

    if (!search) {
      return res.status(200).json({
        data: [],
        products: [],
      });
    }

    if (search.length == 1) {
      limit = 2;
    } else if (search.length == 2) {
      limit = 4;
    } else if (search.length == 3) {
      limit = 5;
    } else {
      limit = 6;
    }

    const regexSearch = search.trim().split(/\s+/).join(".*");

    const categories = await category_model
      .find({
        path: { $regex: regexSearch, $options: "i" },
      })
      .select("_id path")
      .limit(limit);

    const products = await product_model
      .find({ name: { $regex: regexSearch, $options: "i" } })
      .select("_id name front_image")
      .limit(limit);

    // Clean up path
    const formattedCategories = categories.map((cat) => {
      let parts = cat.path.split(" > "); // split by >

      if (parts.length >= 2) {
        parts.shift(); // remove the first element
      }

      let formattedPath = parts.join(" ").toLowerCase(); // join rest with space + lowercase

      return {
        _id: cat._id,
        path: formattedPath,
      };
    });

    let find_products_watch = [];

    if (formattedCategories.length === 0) {
      // No categories → fallback to direct product search
      find_products_watch = products;
    } else {
      if (products.length === 0) {
        // Categories found but no direct product match → find by category
        const categoryIds = categories.map((cat) => cat._id);
        if (categoryIds.length > 0) {
          find_products_watch = await product_model
            .find({
              category: { $in: categoryIds },
            })
            .select("_id name front_image")
            .limit(limit);
        }
      } else {
        find_products_watch = products;
      }
    }

    res.status(200).json({
      data: formattedCategories,
      products: find_products_watch,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
