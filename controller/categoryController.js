const categoryCollection = require("../model/collections/CategoryDb");
const { ObjectId } = require("mongodb");
const UserCollection = require("../model/collections/UserDb");
const productsCollection = require("../model/collections/products");
const CategoryDb = require("../model/collections/CategoryDb");
const {
  getCartCount,
  getUserCartData,
  getTotalAmount,
} = require("../helper/cart-helper");
const { getWhishLIstCount } = require("../helper/whish-helper");
async function ManageCategory(req, res) {
  let categories = await categoryCollection.find().sort({ addedDate: -1 });
  res.render("admins/category", { categories, err: false });
}
async function addCategory(req, res) {
  try {
    if (!req.body.category) {
      return res.redirect("/admin/category/add-category/nullfield");
    }
    let categoryExist = await categoryCollection.findOne({
      categoryname: req.body.category,
    });
    if (!categoryExist) {
      await new categoryCollection({
        categoryname: req.body.category,
        addedDate: Date.now(),
      }).save();
      res.redirect("/admin/category");
    } else {
      return res.redirect("/admin/category/add-category/duplicate");
    }
  } catch (err) {
    console.log("error in add cate" + err);
  }
}

// Edit category Page Get
async function editCategoryGet(req, res) {
  const id = req.params.id;
  const categories = await categoryCollection.findById(id);
  res.render("admins/categoryedit", { categories });
}

// Edit Category Post
async function editCategoryPost(req, res) {
  const id = req.params.id;
  await categoryCollection.findByIdAndUpdate(new ObjectId(id), {
    categoryname: req.body.category,
  });
  res.redirect("/admin/category");
}

// Delete Or Unlisting Category
async function unListCategory(req, res) {
  const id = req.params.id;
  await categoryCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { categorystatus: false } }
  );
  res.redirect("/admin/category");
}

// Recover Deleted Category
async function recoverCategory(req, res) {
  const id = req.params.id;
  await categoryCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { categorystatus: true } }
  );
  res.redirect("/admin/category");
}

// Searching Category
async function serchCategory(req, res) {
  const searchData = req.body.search;
  const categories = await categoryCollection.find({
    categoryname: { $regex: "^" + searchData, $options: "i" },
  });
  res.render("admins/category", { categories, err: false });
}

// Filtering and Sorting category
async function filteringandSortingcategory(req, res) {
  const filterorder = req.params.filterOrder;
  let categories;
  if (filterorder == "listed") {
    categories = await categoryCollection.find({ categorystatus: true });
  } else if (filterorder == "unlisted") {
    categories = await categoryCollection.find({ categorystatus: false });
  } else if (filterorder == "latest") {
    categories = await categoryCollection.find().sort({ addedDate: -1 });
  } else if (filterorder == "oldest") {
    categories = await categoryCollection.find().sort({ addedDate: 1 });
  }
  res.render("admins/category", { categories, err: false });
}

//for User Start

async function filteredbyCategory(req, res) {
  const categoryId = req.params.categoryId;

  const productData = await productsCollection.aggregate([
    {
      $match: {
        category: new ObjectId(categoryId), 
      },
    },
    {
      $lookup: {
        from: "categories", 
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    {
      $unwind: "$categoryInfo",
    },
    {
      $project: {
        productName: 1,
        price: 1,
        image: 1,
        discount: 1,
        brand: 1,
        description: 1,
        addedDate: 1,
        currentStatus: 1,
        specification: 1,
        deletionStatus: 1,
        stock: 1,
        category: "$categoryInfo.categoryname",
        categoryId: "$categoryInfo._id",
        categorySales: "$categoryInfo.sales",
        categoryStock: "$categoryInfo.stock",
        categoryAddedDate: "$categoryInfo.addedDate",
        categoryImage: "$categoryInfo.categoryImage",
      },
    },
  ]);
  const userStatus = await UserCollection.find({
    email: req.session.userEmail,
  });

  const categories = await CategoryDb.find();
  if (req.session.userAuth && userStatus[0].status) {
    const userData = await UserCollection.findOne({
      email: req.session.userEmail,
    });
    const userId = userData._id;
    var cartCount = await getCartCount(userId);
    let whishCount = await getWhishLIstCount(userId);

    res.render("users/filteredcategory", {
      profile: true,
      productData,
      cartCount,
      id: userStatus[0]._id,
      err: false,
      categories,
      whishCount,
    });
  } else {
    res.render("users/filteredcategory", {
      profile: false,
      productData,
      id: false,
      err: false,
      categories,
    });
  }
}
const CategoryControllforUser = {
  filteredbyCategory,
};
// user controlling end
module.exports = {
  ManageCategory,
  addCategory,
  editCategoryGet,
  editCategoryPost,
  unListCategory,
  recoverCategory,
  serchCategory,
  filteringandSortingcategory,
  CategoryControllforUser,
};
