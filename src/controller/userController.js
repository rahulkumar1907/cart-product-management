const userModel = require("../model/userModel")
const bcrypt = require("bcrypt")
const uploadFile = require("./awsController")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const {
  isValid,
  isValidObjectId,
  isValidRequestBody,
  isValidPassword,
  isValidFiles,
} = require("../validation/validate")
let saltRounds = 10

/*************Create User (1st Api)*******************************/
const userRegister = async (req, res) => {
  try {
    let data = req.body

    if (!isValidRequestBody(data))
      return res.status(400).send({
        status: false,
        message: "Request body can't be empty",
      })

    const { fname, lname, email, phone, password, address } = data

    const files = req.files
    if (!isValidFiles(files))
      return res.status(400).send({
        status: false,
        Message: "Please provide user's profile picture",
      })
      

    if (!isValid(fname)) return res.status(400).send({ status: false, Message: "Please provide your first name" })
    if (!fname.trim().match(/^[a-zA-Z ]{2,30}$/))
      return res.status(400).send({
        status: false,
        message: "Firstname should only contain alphabet",
      })

    if (!isValid(lname)) return res.status(400).send({ status: false, Message: "Please provide your last name" })
    if (!lname.trim().match(/^[a-zA-Z ]{2,30}$/))
      return res.status(400).send({
        status: false,
        message: "lastname should only contain alphabet",
      })

    if (!isValid(email)) return res.status(400).send({ status: false, Message: "Please provide your email address" })

    if (!isValid(phone))
      return res.status(400).send({
        status: false,
        Message: "Please provide your phone number",
      })

    if (!isValid(password)) return res.status(400).send({ status: false, Message: "Please provide your password" })

    if (!isValid(address)) return res.status(400).send({ status: false, Message: " Address must be provide" })

    let jsonAddress = JSON.parse(address)
    if (typeof jsonAddress != "object")
      return res.status(400).send({ status: false, message: "Address must be in object" })

    if (jsonAddress) {
      if (jsonAddress.shipping) {
        if (!isValid(jsonAddress.shipping.street))
          return res.status(400).send({
            status: false,
            Message: "Please provide your street name in shipping address",
          })

        if (!isValid(jsonAddress.shipping.city))
          return res.status(400).send({
            status: false,
            Message: "Please provide your city name in shipping address",
          })

        if (!isValid(jsonAddress.shipping.pincode))
          return res.status(400).send({
            status: false,
            Message: "Please provide your pin code in shipping address",
          })

        if (!/^\d{6}$/.test(jsonAddress.shipping.pincode))
          return res.status(400).send({
            status: false,
            message: "Pincode should in six digit Number",
          })
      } else {
        return res.status(400).send({ status: false, message: "please provide shipping address" })
      }

      if (jsonAddress.billing) {
        if (!isValid(jsonAddress.billing.street))
          return res.status(400).send({
            status: false,
            Message: "Please provide your street name in billing address",
          })

        if (!isValid(jsonAddress.billing.city))
          return res.status(400).send({
            status: false,
            Message: "Please provide your city name in billing address",
          })

        if (!isValid(jsonAddress.billing.pincode))
          return res.status(400).send({
            status: false,
            Message: "Please provide your pin code in billing address",
          })
        if (!/^\d{6}$/.test(jsonAddress.billing.pincode))
          return res.status(400).send({
            status: false,
            message: "Pincode should in six digit Number",
          })
      } else {
        return res.status(400).send({ status: false, message: "please provide billing address" })
      }
    }

    /***************************Email, Phone & Password Validations******************/

    let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/
    let phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/

    if (!email.trim().match(emailRegex))
      return res.status(400).send({ status: false, message: "Please enter valid email" })

    if (!phone.trim().match(phoneRegex))
      return res.status(400).send({ status: false, message: "Please enter valid phone number" })

    if (!isValidPassword(password))
      return res.status(400).send({
        status: false,
        message: "Please provide a valid password ,Password should be of 8 - 15 characters",
      })

    /************************************Check duplicity (Uniqueness)*****************/

    const isRegisterEmail = await userModel.findOne({ email: email })

    if (isRegisterEmail) return res.status(400).send({ status: false, message: "Email id already registered" })

    const isRegisterPhone = await userModel.findOne({ phone: phone })

    if (isRegisterPhone) return res.status(400).send({ status: false, message: "phone number is already registered" })

    /********************************************************************************/

    const profilePicture = await uploadFile(files[0])

    const encryptPassword = await bcrypt.hash(password, saltRounds)

    const userData = {
      fname: fname,
      lname: lname,
      profileImage: profilePicture,
      email: email,
      phone,
      password: encryptPassword,
      address: jsonAddress,
    }

    const createUser = await userModel.create(userData)

    res.status(201).send({
      status: true,
      message: `User registered successfully`,
      data: createUser,
    })
  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }
}

/*************Login User (2nd Api)*******************************/

//to login user
const userLogin = async (req, res) => {
  try {
    let data = req.body
    const { email, password } = data

    if (!isValidRequestBody(data))
      return res.status(400).send({ status: false, message: "please enter your email and password both" })

    if (!isValid(email)) return res.status(400).send({ status: false, message: "please enter your email address" })

    if (!email.trim().match(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/))
      return res.status(400).send({ status: false, message: "Please enter valid email" })

    if (!isValid(password)) return res.status(400).send({ status: false, message: "please enter your password" })

    const isEmailExists = await userModel.findOne({ email: email })
    if (!isEmailExists) return res.status(401).send({ status: false, message: "Email is Incorrect" })

    if (!isValidPassword(password))
      return res.status(400).send({
        status: false,
        message: "Please provide a valid password ,Password should be of 8 - 15 characters",
      })

    const isPasswordMatch = await bcrypt.compare(password, isEmailExists.password)

    if (!isPasswordMatch) return res.status(401).send({ status: false, message: "Password is Incorrect" })

    
    const token = jwt.sign(
      {userId: isEmailExists._id.toString()},
      "shoppingCart",   
      { expiresIn: '24h' }
    )

    let result = {
      userId: isEmailExists._id.toString(),
      token: token,
    }

    res.status(200).send({ status: true, message: "Login Successful", data: result })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}

/*************get User (3rd Api)*******************************/

//to get user information
const getUser = async (req, res) => {
  try {
    userId = req.params.userId

    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: " Invalid userId" })

    //check user is exist or not (changing)
    let checkUser = await userModel.findById(userId)
    if(!checkUser) return res.status(404).send({ status: false, message: "UserId doesn't exists" })

    if (req.userId !== userId) return res.status(403).send({ status: false, message: "unauthorized access" })

    let data = await userModel.findById({ _id: userId })
    if (!data) {
      return res.status(404).send({ status: false, message: "User profile not found" })
    }

    return res.status(200).send({ status: true, message: "User profile details", data: data })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}

/*************Update User (4th Api)*******************************/

//to update user information
const updateUser = async (req, res) => {
  try {
    let userId = req.params.userId
    let data = req.body
    let files = req.files

    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: " Invalid userId" })

    //check user is exist or not (changing)
    let checkUser = await userModel.findById(userId)
    if(!checkUser) return res.status(404).send({ status: false, message: "UserId doesn't exists" })

    if (userId !== req.userId) return res.status(403).send({ status: false, message: "Unauthorized access" })

    if (!(files && !Object.keys(data).length)) {
      if (!Object.keys(data).length)
        return res.status(400).send({ status: false, message: "It seems like Nothing to update" })
    }

    //if(!files.length) return res.status(400).send({status: false, message: "Please provide profileImage"})

    // Check fname is empty or not
    if (data.fname || data.fname === "") {
      if (!isValid(data.fname))
        return res.status(400).send({ status: false, Message: "Please provide your first name" })
      if (!data.fname.trim().match(/^[a-zA-Z ]{2,30}$/))
        return res.status(400).send({
          status: false,
          message: "FirstName should only contain alphabet",
        })
    }

    //check if lname is present or Not
    if (data.lname || data.lname === "") {
      if (!isValid(data.lname)) return res.status(400).send({ status: false, Message: "Please provide your last name" })
      if (!data.lname.trim().match(/^[a-zA-Z ]{2,30}$/))
        return res.status(400).send({
          status: false,
          message: "lastName should only contain alphabet",
        })
    }

    //check if email is present or not
    if (data.email || data.email === "") {
      if (!isValid(data.email))
        return res.status(400).send({ status: false, Message: "Please provide your email address" })
      if (!data.email.trim().match(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/))
        return res.status(400).send({ status: false, message: "Please enter valid email" })

      //Check email in DB
      let checkEmail = await userModel.findOne({ email: data.email })
      if (checkEmail) return res.status(400).send({ status: false, message: "Email already exists" })
    }

    if (data.phone || data.phone === "") {
      if (!isValid(data.phone))
        return res.status(400).send({
          status: false,
          Message: "Please provide your phone number",
        })
      if (!data.phone.trim().match(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/))
        return res.status(400).send({ status: false, message: "Please enter valid phone" })

        if (!isValidPassword(data.password))
      return res.status(400).send({
        status: false,
        message: "Please provide a valid password ,Password should be of 8 - 15 characters",
      })

      //Check phone in DB
      const isRegisterPhone = await userModel.findOne({ phone: data.phone })
      if (isRegisterPhone)
        return res.status(400).send({
          status: false,
          message: "phone number is already registered",
        })
    }

    if (isValidFiles(files)) {
      if (files.length === 0) return res.status(400).send({ status: false, message: "Please upload profileImage" })
      const profilePicture = await uploadFile(files[0])
      data.profileImage = profilePicture
    }

    if (data.password || data.password === "") {
      if (!isValid(data.password))
        return res.status(400).send({ status: false, Message: "Please provide your password" })
      let hash = await bcrypt.hash(data.password, saltRounds)
        data.password = hash
    }

    if (data?.address || data?.address === "") {
      if (!isValid(data.address)) return res.status(400).send({ status: false, Message: "Please provide your address" })

      //parse the address to the JSON
      data.address = JSON.parse(data.address)

      if (typeof data.address != "object")
        return res.status(400).send({ status: false, message: "Address must be in object" })

      if (data?.address?.shipping) {
        if (data?.address?.shipping?.street) {
          if (!isValid(data.address.shipping.street))
            return res.status(400).send({
              status: false,
              Message: "Please provide your street name in shipping address",
            })
        }
        if (data?.address?.shipping?.city) {
          if (!isValid(data.address.shipping.city))
            return res.status(400).send({
              status: false,
              Message: "Please provide your city name in shipping address",
            })
        }

        if (data?.address?.shipping?.pincode) {
          if (!isValid(data.address.shipping.pincode))
            return res.status(400).send({
              status: false,
              Message: "Please provide your pin code in shipping address",
            })
          if (!/^\d{6}$/.test(data.address.shipping.pincode))
            return res.status(400).send({
              status: false,
              message: "PinCode should in six digit Number",
            })
        }
      }

      if (data?.address?.billing) {
        if (data?.address?.billing?.street) {
          if (!isValid(data.address.billing.street))
            return res.status(400).send({
              status: false,
              Message: "Please provide your street name in billing address",
            })
        }
        if (data?.address?.billing?.city) {
          if (!isValid(data.address.billing.city))
            return res.status(400).send({
              status: false,
              Message: "Please provide your city name in billing address",
            })
        }
        if (data?.address?.billing?.pincode) {
          if (!isValid(data.address.billing.pincode))
            return res.status(400).send({
              status: false,
              Message: "Please provide your pin code in billing address",
            })
          if (!/^\d{6}$/.test(data.address.billing.pincode))
            return res.status(400).send({
              status: false,
              message: "PinCode should in six digit Number",
            })
        }
      }
    }

    let oldUserData = await userModel.findById(userId)
    let dataToBeUpdate = {
      fname: data.fname,
      lname: data.lname,
      email: data.email,
      phone: data.phone,
      password: data.password,
      profileImage: data.profileImage,
      address: {
        shipping: {
          street: data.address?.shipping?.street || oldUserData.address.shipping.street,
          city: data.address?.shipping?.city || oldUserData.address.shipping.city,
          pincode: data.address?.shipping?.pincode || oldUserData.address.shipping.pincode,
        },
        billing: {
          street: data.address?.billing?.street || oldUserData.address.billing.street,
          city: data.address?.billing?.city || oldUserData.address.billing.city,
          pincode: data.address?.billing?.pincode || oldUserData.address.billing.pincode,
        },
      },
    }

    const updateData = await userModel.findByIdAndUpdate({ _id: userId }, dataToBeUpdate, { new: true })
    return res.status(200).send({ status: true, message: "User profile updated", data: updateData })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}

module.exports = { userRegister, userLogin, getUser, updateUser }
