const { ObjectId } = require("bson");
const cartCollection = require("../model/collections/cart");
module.exports = {
  getCartCount: async (userId) => {
    const carData = await cartCollection.findOne({
      userId: new ObjectId(userId),
    });
    let cartCount = 0;
    if (carData) {
      cartCount = carData.products.length;
    }
    return cartCount;
  },
  getUserCartData: async (userId) => {
    let userCart = await cartCollection.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "cartData",
        },
      },
      {
        $unwind: "$cartData",
      },
    ]);
    
    return userCart;
  },
  getTotalAmount: async (userId) => {
    try {
      const userCart = await cartCollection.aggregate([
        { $match: { userId: new ObjectId(userId) } },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "cartData",
          },
        },
        {
          $unwind: "$cartData",
        },
      ]);

      if (!userCart || userCart.length === 0) {
        // Handle the case where the userCart is empty or null.
        return 0;
      }

      const getDiscount = userCart[0].getDiscount;
      let totalAmount = 0;

      userCart.forEach((cardata) => {
        console.log(JSON.stringify(cardata) + "____________c dat");
        if (
          cardata &&
          cardata.cartData.offer &&
          cardata.cartData.offer.offerprice
        ) {
          let deductPrice =
            cardata.cartData.price -
            (cardata.cartData.price * cardata.cartData.offer.offerprice) / 100;
          totalAmount = totalAmount + deductPrice * cardata.products.qty;
        } else if (cardata.cartData.discount) {
          totalAmount =
            totalAmount + cardata.cartData.discount * cardata.products.qty;
        } else {
          totalAmount =
            totalAmount + cardata.cartData.price * cardata.products.qty;
        }
      });

      // console.log(Number(totalAmount-getDiscount)+'    sd havi');
      totalAmount = totalAmount - totalAmount * (getDiscount / 100);
      console.log(totalAmount + " in cart total -_____)_))_");
      return Math.ceil(totalAmount);
    } catch (error) {
      console.error("Error in getTotalAmount:", error);
      return 0; // Handle the error gracefully, returning 0 or any other appropriate value.
    }
  },
  calculateSubtotal:(product, quantity) =>{
    let subtotal=0;
    if (product) {
      if (product.offer && product.offer.offerprice) {
        // Use the offer price if available
        subtotal = quantity * (product.price - (product.price * product.offer.offerprice) / 100);
      } else if (product.discount) {
        // Use the discount if available
        subtotal = quantity * product.discount;
      } else {
        // Use the original price
        subtotal = quantity * product.price;
      }
    }
    return subtotal
  }
};
// let userCartdata = await cartCollection.aggregate([
//   { $match: { userId: new ObjectId(userId) } },
//   {
//     $unwind: "$products",
//   },
//   {
//     $lookup: {
//       from: "products",
//       localField: "products.productId",
//       foreignField: "_id",
//       as: "cartData",
//     },
//   },
//   {
//     $unwind: "$cartData",
//   },
// ]);
