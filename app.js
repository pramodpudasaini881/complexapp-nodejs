const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const markdown = require('marked')
const app = express()
const sanitizeHTML =require('sanitize-html')


app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use('/api', require("./router-api"))

let sessionOptions = session({
    secret: "Javascript is so cool",
    store: MongoStore.create({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true, sameSite: "strict"}
})

app.use(sessionOptions)
app.use(flash())

app.use(function(req, res, next) {
    //make our markdown function available for ejs templete
    res.locals.filterUserHTML = function(content) {
        return sanitizeHTML(markdown.parse(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'h1', 'h2', 'h3', 'bold','i','em', 'h4', 'h5', 'h6'], allowedAttributes: {}})
    }

    //make all error error and success flash messges available from all page
    res.locals.errors = req.flash("errors")
    res.locals.success = req.flash("success")

    //make current user id available on the req object
    if(req.session.user) {req.visitorId = req.session.user._id} else{req.visitorId = 0}

    // make user session data available from within view templetes
    res.locals.user = req.session.user
    next()
})

const router = require('./router')



app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')



app.use('/', router)

// app.listen(3000)
module.exports = app