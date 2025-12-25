const User = require('../models/User')
const Post = require('../models/Post')
const jwt = require('jsonwebtoken')

exports.apiGetPostsByUsername = async function(req, res) {
    try{
        let authorDoc = await User.findByUsername(req.params.username)
        console.log(authorDoc)
        let posts = await Post.findByAuthorId(authorDoc._id)
        res.json(posts)

    }catch{
        res.json("Sorry, invalid user requested.")
    }
}

exports.apiMustBeLoggedIn = function (req, res, next) {
  try{
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET)
    next()
  }catch {
    res.json("sorry,you must provide a valid token.")

  }
}


exports.mustBeLoggedIn = function (req, res, next) {
    if (req.session.user) {
        next()
    } else {
        req.flash("errors", "you must be logged in to perform the task")
        req.session.save(function () {
            res.redirect('/')
        })
    }
}


exports.login = function (req, res) {
    let user = new User(req.body)
    user.login().then(function (result) {
        req.session.user = { avatar: user.avatar, username: user.data.username, _id: user.data._id }
        req.session.save(function () {
            res.redirect('/')
        })
    }).catch(function (e) {
        req.flash('errors', e)
        req.session.save(function () {
            res.redirect('/')


        })
        // res.send(e)
    })
}


//api login 
exports.apiLogin = function (req, res) {
    let user = new User(req.body)
    user.login().then(function (result) {
        res.json(jwt.sign({_id: user.data._id}, process.env.JWTSECRET, {expiresIn: '7d'}))
        
    }).catch(function (e) {
        res.json("sorry, your values are not correct")


        
        // res.send(e)
    })
}



exports.logout = function (req, res) {
    req.session.destroy(function () {
        res.redirect('/')
    })


}

exports.register = function (req, res) {
    let user = new User(req.body)
    user.register().then(() => {
        req.session.user = { username: user.data.username, avatar: user.avatar, _id: user.data._id }
        req.session.save(function () {
            res.redirect('/')
        })
    }).catch((regErrors) => {
        regErrors.forEach(function (error) {
            req.flash('regErrors', error)
        })
        req.session.save(function () {
            res.redirect('/')
        })
    })


}

exports.home = function (req, res) {
    if (req.session.user) {
        res.render('home-dashboard')
    } else {
        res.render('home-guest', { regErrors: req.flash('regErrors') })

    }
}


exports.ifUserExists = function (req, res, next) {
    User.findByUsername(req.params.username).then(function (userDocument) {
        req.profileUser = userDocument
        next()
    }).catch(function () {
        res.render("404")
    })

}

exports.profilePostsScreen = function (req, res) {
    //ask our post model for posts by a certian author id
    Post.findByAuthorId(req.profileUser._id).then(function (posts) {
        res.render('profile', {
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar
        })
        // console.log(posts)

    }).catch(function () {
        res.render("404")
    })


}

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGE1YTM1MGViYjI2NmQyMTcwNjFmNDUiLCJpYXQiOjE3NTY3MjIwNjgsImV4cCI6MTc1NzMyNjg2OH0.zdKdi-pH3acWk9XQFZigf74a43bRFNol2bBQkoVkJx8