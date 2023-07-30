const express= require("express")
const router= express.Router()
const auth = require('../middleware/auth')
const {userRegister,userLogin,getUser,updateUser} = require("../controller/userController") 
const {createProduct,getProduct,getProductById,updateProduct, deleteProduct} = require('../controller/productController')
const {createCart,updateCart, getCart, deleteCart} = require('../controller/cartController')
const {createOrder,updateOrder}= require('../controller/orderController')

/*********************For User**************************************************************/
router.post('/register', userRegister)

router.post('/login',userLogin)

router.get('/user/:userId/profile', auth, getUser)

router.put('/user/:userId/profile',auth, updateUser)

/************************For products******************************************************/

router.post('/products', createProduct);

router.get('/products', getProduct);

router.get('/products/:productId', getProductById);

router.put('/products/:productId', updateProduct);

router.delete('/products/:productId', deleteProduct);

/************************For carts******************************************************/

router.post('/users/:userId/cart',auth, createCart);

router.put('/users/:userId/cart',auth, updateCart);

router.get('/users/:userId/cart',auth, getCart);

router.delete('/users/:userId/cart',auth,deleteCart);


/************************For Order******************************************************/
router.post('/users/:userId/orders',auth,createOrder);

router.put('/users/:userId/orders',auth,updateOrder);



module.exports = router;