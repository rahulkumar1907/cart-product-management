const userModel = require("../model/userModel")
const cartModel = require("../model/cartModel")
const orderModel = require("../model/orderModel")
const ObjectId = require("mongoose").Types.ObjectId
const { isValid, isValidObjectId } = require("../validation/validate")

const createOrder = async function (req, res) {
  try {
    let userId = req.params.userId
    let data = req.body
    let { cartId, cancellable, status } = data

    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "user id is not valid" })
    }

    const isUserExits = await userModel.findById(userId)
    if (!isUserExits) {
      return res.status(404).send({ status: false, message: "User not present" })
    }

    //Authorisation
    if (req.userId !== userId) {
      return res.status(403).send({ status: false, message: "Unauthorized user" })
    }

    if (!Object.keys(data).length) {
      return   res.status(400).send({
        status: false,
        message: "Please Provide cartId,canellable,status",
      })
      
    }

    if (!isValid(cartId)) {
      return res.status(400).send({ status: false, message: "Please enter cartId" })
    }

    if (!isValidObjectId(cartId)) {
      return res.status(400).send({ status: false, message: "cart id is not valid" })
    }
    const findCart = await cartModel.findOne({ _id: cartId, userId: userId })
    if (!findCart) {
      return res.status(404).send({ status: false, message: "No cart found" })
    }
    let itemsArr = findCart.items
    if (itemsArr.length == 0) {
      return res.status(400).send({ status: false, message: "Cart is empty" })
    }

    let sum = 0
    for (let i of itemsArr) {
      sum += i.quantity
    }

    let newData = {
      userId: userId,
      items: findCart.items,
      totalPrice: findCart.totalPrice,
      totalItems: findCart.totalItems,
      totalQuantity: sum,
    }

    //is cancellable key available?
    if (cancellable) {
      if (!isValid(cancellable)) {
        return res.status(400).send({ status: false, message: "Please enter cancellable" })
      }

      //cancellable must be boolean
      if (![true, false].includes(cancellable)) {
        return res.status(400).send({
          status: false,
          message: "cancellable must be a boolean value",
        })
      }
    
    }
    newData.cancellable = cancellable


    if (data?.status) {
      if (!isValid(status)) {
        return res.status(400).send({ status: false, message: "Please enter status" })
      }
      if (!["pending", "completed", "canceled"].includes(status)) {
        return res.status(400).send({
          status: false,
          message: "status must be a pending,completed,canceled",
        })
      }
      newData.status = status
    }
    const orderCreated = await orderModel.create(newData)

    findCart.items = []
    findCart.totalItems = 0
    findCart.totalPrice = 0
    findCart.save()
    return res.status(201).send({ status: true, message: "Success", data: orderCreated })
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}

const updateOrder = async (req, res) => {
  try {
    let userId = req.params.userId
    let data = req.body

    //Authorization
    if (req.userId !== userId) {
      return res.status(403).send({ status: false, message: "Unauthorized user" })
    }

    if (!isValidObjectId(userId))
      return res.status(400).send({ status: false, message: "Enter a valid user-Id" })

    //checking for a valid user input
    if (!Object.keys(data).length)
      return res.status(400).send({
        status: false,
        message: "Data is required to cancel your order",
      })

    //checking for valid orderId
    if (!isValid(data.orderId))
      return res.status(400).send({
        status: false,
        message: "OrderId is required and should not be an empty string",
      })
    if (!isValidObjectId(data.orderId))
      return res.status(400).send({ status: false, message: "Enter a valid order-Id" })

      //checking if cart exists or not
    let findOrder = await orderModel.findOne({
      userId: userId,
      isDeleted: false,
    })
    if (!findOrder)
      return res.status(404).send({
        status: false,
        message: `No order found with this '${userId}' user-ID`,
      })

    //checking if orderId is same or not
    if (findOrder._id.toString() !== data.orderId)
      return res.status(404).send({
        status: false,
        message: `No order found with this '${findOrder._id}' order-Id`,
      })

    //checking if the order is cancellable or not
    if (!findOrder.cancellable) return res.status(400).send({ status: false, message: "You cannot cancel this order" })

    let orderUpdate = await orderModel.findOneAndUpdate({ _id: findOrder._id }, { status: "cancelled", isDeleted: true, deletedAt: Date.now() },{new: true})
    res.status(200).send({
      status: true,
      message: "Success",
      data: orderUpdate
    })
  } catch (err) {
    res.status(500).send({ status: false, error: err.message })
  }
}
module.exports = { createOrder, updateOrder }
