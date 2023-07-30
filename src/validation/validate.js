const mongoose = require("mongoose")
//to check validation
const isValid = (value) => {
  if (typeof value === "undefined" ||  value === null) return false
  if (typeof value === "string" && value.trim().length === 0) return false
  return true
}

const isValidRequestBody = (requestBody) => {
  return Object.keys(requestBody).length 
}


const isValidPassword = (password) => {
  if (password.length > 7 && password.length < 16) return true
}

const isValidFiles = (files) => {
  if (files && files.length > 0) return true
}

//to check validation of objectId
const isValidObjectId = (objectId) => {
  return mongoose.isValidObjectId(objectId)
}

module.exports = {isValid,isValidObjectId,isValidRequestBody,isValidPassword,isValidFiles}