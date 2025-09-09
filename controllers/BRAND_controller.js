const brand_model = require("../models/Brand_model");
const product_model = require("../models/Product_model")
exports.create_brand = async (req, res) => {
  try {
    console.log(req.body);
    const find_brand_name_exist = await brand_model.findOne({
      name: req.body.name,
    });
    if (find_brand_name_exist) {
      return res.status(400).json({ message: "brand name is already used" });
    }

    const create_brand_new = new brand_model({
      name: req.body.name,
      image: req.body.image,
      status: req.body.status,
    });

    await create_brand_new.save();
    res
      .status(200)
      .json({ message: "brand created successfully", data: create_brand_new });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.edit_brand = async (req, res) => {
  try {
    console.log(req.body);
    const { _id, name, image, status } = req.body;

    const find_name = await brand_model.findOne({ name: name });
    if (find_name) {
      return res.status(400).json({ message: "name already exist" });
    }
    const find_brand = await brand_model.findOne({ _id: _id });

    if (!find_brand) {
      return res.status(400).json({ message: "brand not found" });
    }

    find_brand.name = name;
    find_brand.image = image || "";
    find_brand.status = status;

    await find_brand.save()
    res.status(200).json({message:'edited'})
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.single_brand = async (req, res) => {
  try {
    console.log(req.query.id);
    const find_one = await brand_model.findOne({ _id: req.query.id });
    if (!find_one) {
      return res.status(400).json({ message: "brand not found" });
    }

    res.status(200).json({ message: "brand founded" ,data:find_one});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.delete_brand = async (req, res) => {
  try { 
   
    const find_one = await brand_model.findOneAndDelete({ _id: req.query.id });
    if (!find_one) {
      return res.status(400).json({ message: "brand not found" });
    }

    res.status(200).json({ message: "brand deleted" ,data:find_one});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


exports.list_brand = async (req, res) => {
  try {
    const find_brands = await brand_model.find();
    res.status(200).json({ message: "find", data: find_brands });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


exports.brand_products =async(req,res)=>{
    try {
        const _id = req.query.id

        const find_brand = await brand_model.findOne({_id:_id})

        if(!find_brand){
            return res.status(400).json({message:'brand not find'})
        }

        const find_products  = await product_model.find({brand:_id,status:'active'})
        res.status(200).json({message:'product finded',data:find_products})
    } catch (error) {
            console.error(error);
    res.status(500).json({ message: error.message });
    }
}