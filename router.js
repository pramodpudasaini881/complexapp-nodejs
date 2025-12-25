const express = require('express')
const router = express.Router()
const userController = require('./controllers/usercontroller')
const postController = require('./controllers/postController')


// User relate route
router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

//profile realated routes
router.get('/profile/:username', userController.ifUserExists, userController.profilePostsScreen)

//Post related routes
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen)
router.post('/create-post', userController.mustBeLoggedIn, postController.create)
router.get('/post/:id',  postController.viewSingle)
router.get('/post/:id/edit',userController.mustBeLoggedIn, postController.viewEditScreen)
router.post('/post/:id/edit',userController.mustBeLoggedIn, postController.edit)
router.post('/post/:id/delete',userController.mustBeLoggedIn, postController.delete)


// router.get('/about', function(req, res) {
//     res.send("this is our about page")
// })

module.exports = router