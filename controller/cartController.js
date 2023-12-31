const UserCollection = require("../model/collections/UserDb");
const productsCollection = require("../model/collections/products");
const cartCollection = require("../model/collections/cart");
const { ObjectId } = require("bson");
const {
  getCartCount,
  getUserCartData,
  getTotalAmount,
  calculateSubtotal,
} = require("../helper/cart-helper");
const { getWhishLIstCount } = require("../helper/whish-helper");

// Addto Cart Functionality
async function addTocart(req, res) {
  try {
    let productId = req.params.id;
    const currentProduct = await productsCollection.findOne({
      _id: new ObjectId(productId),
    });

    if (currentProduct && currentProduct.stock <= 0) {
      return res.redirect(`/products/product-detail/${productId}/mainimage`);
    }
    let userId = await UserCollection.findOne({ email: req.session.userEmail });
    let userCartExistStatus = await cartCollection.findOne({
      userId: new ObjectId(userId._id),
    });
    if (!userCartExistStatus) {
      await new cartCollection({
        userId: new ObjectId(userId._id),
        products: [
          {
            productId: new ObjectId(productId),
            qty: 1,
          },
        ],
      }).save();
    } else {
      const productExist = await cartCollection.aggregate([
        {
          $match: { userId: new ObjectId(userId) },
        },
        {
          $unwind: "$products",
        },
        {
          $match: { "products.productId": new ObjectId(productId) },
        },
      ]);

      if (productExist.length <= 0) {
        await cartCollection.updateOne(
          {
            userId: new ObjectId(userId),
          },
          {
            $push: {
              products: {
                productId: new ObjectId(productId),
                qty: 1,
              },
            },
          }
        );
      } else {
        // res.json({status:false})
        let data = await cartCollection.updateOne(
          {
            userId: new ObjectId(userId),
            "products.productId": new ObjectId(productId),
          },
          { $inc: { "products.$.qty": 1 } }
        );
      }
    }
    res.json({ status: true });
  } catch (err) {
    res.json({ status: false, err });
    console.log("error in add to cart" + err);
  }
}

// Show Cart Page
async function getCartPage(req, res) {
  try {
    const userData = await UserCollection.findOne({
      email: req.session.userEmail,
    });
    const userId = userData._id;
    const cartCount = await getCartCount(userId);
    const whishCount = await getWhishLIstCount(userId);
    let userCartdata = await getUserCartData(userId);
    let totalAmount = await getTotalAmount(userId);
    let couponExistStatus;
    let cart = await cartCollection.findOne({ userId: new ObjectId(userId) });
    if (cart && cart.getDiscount <= 0) {
      couponExistStatus = false;
    } else {
      couponExistStatus = true;
    }
    if (userCartdata.length <= 0) {
      res.render("users/cart", {
        profile: true,
        id: req.params.id,
        cartCount,
        userCartdata,
        totalAmount,
        empty: false,
        couponExistStatus,
        whishCount,
      });
    } else {
      res.render("users/cart", {
        profile: true,
        id: req.params.id,
        cartCount,
        userCartdata,
        totalAmount,
        empty: true,
        couponExistStatus,
        whishCount,
      });
    }
  } catch (err) {
    console.log("Error found in User cart " + err);
  }
}

// Quantity Increase whil Clicking Increase Button
async function increaseQuantity(req, res) {
  const userId = req.params.userId;
  const productId = req.params.productId;
  const qtyChange = req.query.qty;
  const currentData = await productsCollection.findOne({
    _id: new ObjectId(productId),
  });
  if (currentData && currentData.stock) {
    if (qtyChange > currentData.stock) {
      return;
    }
    // if(qtyChange<1){
    //   return
    // }
  }

  let data = await cartCollection.findOne({
    userId: new ObjectId(userId),
    "products.productId": new ObjectId(productId),
  });
  let updated = data.products[0].qty + Number(qtyChange);
  await cartCollection.updateOne(
    {
      userId: new ObjectId(userId),
      "products.productId": new ObjectId(productId),
    },
    {
      $inc: { "products.$.qty": Number(qtyChange) },
    }
  );
  const totalAmount = await getTotalAmount(userId);
  console.log(qtyChange, "updated");
  let qtyofuser = await cartCollection.aggregate([
    {
      $match: { userId: new ObjectId(userId) },
    },
    {
      $unwind: "$products",
    },
    {
      $match: { "products.productId": new ObjectId(productId) },
    },
    {
      $project: {
        qty: "$products.qty",
      },
    },
  ]);
  const subtotal = calculateSubtotal(currentData, qtyofuser[0].qty);

  console.log(subtotal + "sub total");
  // res.redirect(`/users/product/cart/showcart/${userId}`);
  res.json({ status: true, stock: currentData.stock, totalAmount, subtotal });
  // res.status(200).json({message:"su"})
}

async function deleteItemFromCart(req, res) {
  try {
    const userId = req.params.userId;
    const productId = req.params.productId;
    await cartCollection.updateOne(
      {
        userId: new ObjectId(userId),
        "products.productId": new ObjectId(productId),
      },
      {
        $pull: {
          products: {
            productId: new ObjectId(productId),
          },
        },
      }
    );
    const totalAmount = await getTotalAmount(userId);
    res.json({ status: true, totalAmount });
  } catch (err) {
    console.log("error in removing item from cart " + err);
  }
}

module.exports = {
  addTocart,
  getCartPage,
  increaseQuantity,
  deleteItemFromCart,
};
