const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")

const { isValid, isValidObjectId, isValidRequestBody } = require("../validation/validate")

/**********************Tenth Api***********************/

const createCart = async function (req, res) {
  try {
    const requestBody = req.body
    const userId = req.params.userId
    const jwtUserId = req.userId
    let { productId, cartId } = requestBody

    //  authroization

    if (!(userId === jwtUserId)) {
      return res.status(403).send({ status: false, msg: "unauthorized access" })
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).send({
        status: true,
        message: "Invalid userId",
      })
    }
    if (!isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: false, message: "Please provide cart details" })
    }

    if (cartId) {
      if (!isValid(cartId)) {
        return res.status(400).send({
          status: true,
          message: "cartId is required in the request body",
        })
      }
      if (!isValidObjectId(cartId)) {
        return res.status(400).send({
          status: true,
          message: "cartId is in  valid",
        })
      }
    }

    if (!isValid(productId)) {
      return res.status(400).send({
        status: true,
        message: "productId is required in the request body",
      })
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).send({
        status: true,
        message: "productId is invalid",
      })
    }

    const checkProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    })
    if (!checkProduct) {
      return res.status(404).send({ status: true, message: "product not exist or already deleted" })
    }

    const checkCartExist = await cartModel.findOne({
      userId: userId,
    })

    if (!checkCartExist) {
      if (cartId) return res.status(404).send({ status: false, message: "Cart not exist for this user" })
      let createCartObject = {
        userId: userId,
        items: [{ productId: productId, quantity: 1 }],
        totalPrice: checkProduct.price,
        totalItems: 1,
      }
      const createCart = await cartModel.create(createCartObject)
      return res.status(201).send({
        status: true,
        message: "Success",
        data: createCart,
      })
    }

    if (checkCartExist) {
      if (!cartId) return res.status(400).send({ status: true, message: "Cart id is required" })
      if (checkCartExist._id.toString() !== cartId)
        return res.status(404).send({ status: true, message: "Cart not found" })
    }
    let array = checkCartExist.items
    for (let i = 0; i < array.length; i++) {
      if (array[i].productId == productId) {
        array[i].quantity = array[i].quantity + 1
        const updateCart = await cartModel.findOneAndUpdate(
          { userId: userId },
          {
            items: array,
            totalPrice: checkCartExist.totalPrice + checkProduct.price,
          },
          { new: true }
        )
        //changing status code to 201
        return res.status(201).send({
          status: true,
          message: "Success",
          data: updateCart,
        })
      }
    }
    let updateCartObject = {
      $addToSet: { items: { productId: productId, quantity: 1 } },
      totalPrice: checkCartExist.totalPrice + checkProduct.price,
      totalItems: checkCartExist.totalItems + 1,
    }
    const updateCart = await cartModel.findOneAndUpdate({ userId: userId }, updateCartObject, { new: true })

    //changing status code to 201
    res.status(201).send({
      status: true,
      message: "Success",
      data: updateCart,
    })
  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }
}

/**********************Eleventh Api***********************/
const updateCart = async (req, res) => {
  try {
    const { userId } = req.params
    const data = req.body
    const { cartId, productId, removeProduct } = data

    // * 📌VALIDATION
    //is ObjectId valid?
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "invalid User Id" })

    //Authorization of user
    // if (req.userId !== userId)
    //   return res.status(403).send({
    //     status: false,
    //     message: "You are not authorized to update your cart",
    //   })

    // if empty body
    if (!Object.keys(data).length) {
      return res.status(400).send({
        status: false,
        message: "Please provide cartId and productId and removeProduct detail",
      })
    }

    //if cartId is validation
    if (!isValid(cartId)) return res.status(400).send({ status: false, message: "Please provide cartId" })
    if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "invalid cart Id" })

    //productId is valid or not
    if (!isValid(productId)) return res.status(400).send({ status: false, message: "Please provide productId" })
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "invalid product Id" })
    if (!isValid(removeProduct))
      return res.status(400).send({
        status: false,
        message: "Please provide removeProduct",
      })

    //to accept only 0-1 number

    if (!/^(1|0)$/.test(removeProduct))
      return res.status(400).send({
        status: false,
        message: "removeProduct must be NUMBER and only 0,1 accepted",
      })

    // * END OF VALIDATION

    //*📌LOGIC
    let isProductExits = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    })
    if (!isProductExits) return res.status(404).send({ status: false, message: "product is not available" })

    //changing
    const isCart = await cartModel.findOne({
      _id: cartId,
      "items.productId": productId,
    })

    if (!isCart)
      return res.status(404).send({
        status: false,
        message: "product is not available in cart or cartId doesn't exist",
      })

    //to reduce quantity of product
    if (removeProduct == 1) {
      let productPrice = isProductExits.price
      //to decrease quantity of product by one

      let updateCart = await cartModel.findOneAndUpdate(
        { cartId: cartId, "items.productId": productId },
        { $inc: { "items.$.quantity": -1, totalPrice: -productPrice } },
        { new: true }
      )

      //to check if product quantity is 0 or note
      let qty = updateCart.items.filter((item) => item.productId.toString() === productId)[0].quantity
      if (qty == 0) {
        let result = await cartModel.findOneAndUpdate(
          { cartId: cartId, "items.productId": productId },
          {
            $inc: { totalItems: -1 },
            $pull: { items: { productId: productId } },
          },
          { new: true }
        )
        return res.status(200).send({
          status: true,
          message: "Success",
          data: result,
        })
      }
      return res.status(200).send({
        status: true,
        message: "Success",
        data: updateCart,
      })
    }

    // * to delete product from cart
    if (removeProduct == 0) {
      let qty = isCart.items.filter((item) => item.productId.toString() === productId)[0].quantity

      let productPrice = isProductExits.price
      let result = await cartModel.findOneAndUpdate(
        { cartId: cartId, "items.productId": productId },
        {
          $inc: { totalPrice: -(productPrice * qty), totalItems: -1 },
          $pull: { items: { productId: productId } },
        },
        { new: true }
      )
      return res.status(200).send({
        status: true,
        message: "Success",
        data: result,
      })
    }
  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }
}

/**********************twelve's Api***********************/
const getCart = async (req, res) => {
  try {
    const userId = req.params.userId

    /****************************Validation of UserId***********************/
    if (!isValidObjectId(userId))
      return res.status(400).send({ status: false, message: "Please provide a valid userId" })

    // Authorization Field
    if (req.userId !== jwtUserId) return res.status(403).send({ status: false, message: "Unauthorized access" })

    //Checking cart in DB
    const checkingCart = await cartModel.findOne({ userId: userId })
    if (!checkingCart) return res.status(404).send({ status: false, message: "Cart not exist for this user" })

    res.status(200).send({
      status: true,
      message: "Success",
      data: checkingCart,
    })
  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }
}

/**********************Thirteenth Api***********************/
const deleteCart = async (req, res) => {
  try {
    const userId = req.params.userId

    /****************************Validation of UserId***********************/
    if (!isValidObjectId(userId))
      return res.status(400).send({ status: false, message: "Please provide a valid userId" })

    //Authorization Field
    if (req.userId !== userId) return res.status(403).send({ status: false, message: "Unauthorized access" })

    //Checking cart in DB
    const checkingCart = await cartModel.findOne({ userId: userId })
    if (!checkingCart) return res.status(404).send({ status: false, message: "Cart not exist for this user" })

    const deletedCart = await cartModel.findOneAndUpdate(
      { userId: userId },
      { items: [], totalItems: 0, totalPrice: 0 },
      { new: true }
    )
    // status code 204 for No Content (Here we just do the content empty) .... (changing)----> response structure will vanishing.
    res.status(204).send({
      status: true,
      message: "Cart has been deleted successfully",
      data: deletedCart,
    })
  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }
}

module.exports = { createCart, updateCart, getCart, deleteCart }

// const createCart = async (req, res) => {
//   try {
//     let data = req.body
//     let userId = req.params.userId
//     let item = data.items
//     let cartId = data.cartId

//     // access of productId and quantity from request body items key
//     for (let i = 0; i < item.length; i++) {
//       var findProductId = item[i].productId
//       var findQuantity = item[i].quantity
//     }

//     // valid user or not
//     if (!isValidObjectId(userId))
//       return res.status(400).send({ status: false, message: " Invalid userId" })

//     //  authorized user or not
//     // if (userId !== req.userId)
//     //   return res
//     //     .status(403)
//     //     .send({ status: false, message: "Unauthorized access" })

//     // valid request body
//     if (!Object.keys(data).length)
//       return res.status(400).send({
//         status: false,
//         message: "Invalid request. please provide details.",
//       })
//     // validation for items key
//     if (!item)
//       return res.status(400).send({
//         status: false,
//         message: "Invalid request. please provide items",
//       })
//     // validation for product id present in items
//     if (!findProductId)
//       return res.status(400).send({
//         status: false,
//         message: "Invalid request. please provide productId in items ",
//       })
//     // validation for quantity present in items
//     if (!findQuantity)
//       return res.status(400).send({
//         status: false,
//         message: "Invalid request. please provide quantity in items ",
//       })

//     // finding product by productId whose isDeleted false
//     const checkProduct = await productModel
//       .find({ _id: findProductId, isDeleted: false })
//       .populate()

//     // checking product exist or not
//     if (!checkProduct)
//       return res.status(404).send({
//         status: false,
//         message: "Product is not found or Already deleted",
//       })

//     // checking cart exist or not if not exist then creating the cart
//     let checkExistingCart = await cartModel.findOne({ userId: userId })

//     // finding product price from cart
//     if (!checkExistingCart) {
//       for (let i = 0; i < checkProduct.length; i++) {
//         var productPrice = checkProduct[i].price
//       }

//       //  create object
//       let newCart = {
//         userId: userId,
//         items: [{ productId: findProductId, quantity: findQuantity }],
//         totalPrice: productPrice,
//         totalItems: 1,
//       }

//       let createCart = await cartModel.create(newCart)
//       return res.status(201).send({
//         status: true,
//         message: "Cart created successfully",
//         data: createCart,
//       })
//     }

//     let array = checkExistingCart.items

//     for (let i = 0; i < array.length; i++) {
//       if (array[i].productId == findProductId) {
//         array[i].quantity = array[i].quantity + item[0].quantity

//         const updateCart = await cartModel.findOneAndUpdate(
//           { userId: userId },
//           {
//             items: array,
//             totalPrice: checkExistingCart.totalPrice + checkProduct[0].price,
//           },
//           { new: true }
//         )

//         return res.status(200).send({
//           status: true,
//           msg: "successfully add product quantity",
//           data: updateCart,
//         })
//       }
//     }

//     let updateCartObject = {
//       $addToSet: {
//         items: { productId: findProductId, quantity: item[0].quantity },
//       },
//       totalPrice: checkExistingCart.totalPrice + checkProduct[0].price,
//       totalItems: checkExistingCart.totalItems + 1,
//     }
//     const updateCart = await cartModel.findOneAndUpdate(
//       { userId: userId },
//       updateCartObject,
//       { new: true }
//     )
//     res.status(200).send({
//       status: true,
//       msg: "successfully add  new product",
//       data: updateCart,
//     })
//   } catch (error) {
//     res.status(500).send({ status: false, message: error.message })
//   }
// }
