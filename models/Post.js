const postsCollection = require('../db').db().collection("posts")
const ObjectId = require('mongodb').ObjectId
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

let Post = function (data, userid, requestedPostId) {
    this.data = data
    this.errors = []
    this.userid = userid
    this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function () {
    if (typeof (this.data.title) != "string") { this.data.title = "" }
    if (typeof (this.data.body) != "string") { this.data.body = "" }


    // get rid of any bogus properties
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), { allowedTags: [], allowedAttributes: {} }),
        body: sanitizeHTML(this.data.body.trim(), { allowedTags: [], allowedAttributes: {} }),
        createdDate: new Date(),
        author: new ObjectId(this.userid)
    }
}

Post.prototype.validate = function () {
    if (this.data.title == "") { this.errors.push("you must provide a title") }
    if (this.data.body == "") { this.errors.push("you must provide a post content") }

}

Post.prototype.create = function () {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            //save post into database

            postsCollection.insertOne(this.data).then((info) => {
                resolve(info.insertedId)
            }).catch(() => {
                this.errors.push("plz try gain later")
                reject(this.errors)
            })
        } else {
            reject(this.errors)

        }
    })

}

Post.prototype.update = function () {
    return new Promise(async (resolve, reject) => {

        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userid)
            if (post.isVisitorOwner) {
                //actually update the db
                let status = await this.actuallyUpdate()
                resolve(status)

            } else {
                reject()
            }

        } catch {
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            await postsCollection.findOneAndUpdate({ _id: new ObjectId(this.requestedPostId) }, { $set: { title: this.data.title, body: this.data.body } })
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

Post.reusablePostQuery = function (uniqueOperations, visitorId) {
    return new Promise(async function (resolve, reject) {
        let aggOperations = uniqueOperations.concat([
            { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "authorDocument" } },
            {
                $project: {
                    title: 1,
                    body: 1,
                    createdDate: 1,
                    authorId: "$author",
                    author: { $arrayElemAt: ["$authorDocument", 0] }
                }
            }
        ])

        let posts = await postsCollection.aggregate(aggOperations).toArray()
        console.log(posts)


        //clean up author property in each object
        posts = posts.map(function (post) {
            let isOwner = false
            try {
                const visitorObjectId = ObjectId.isValid(visitorId) ? new ObjectId(visitorId) : null
                if (visitorObjectId) {
                    isOwner = post.authorId.equals(visitorObjectId)
                }
            } catch (e) {
                isOwner = false
            }
            post.isVisitorOwner = isOwner
            return {
                ...post,
                author: {
                    username: post.author.username,
                    avatar: new User(post.author, true).avatar
                }
            }
        })


        resolve(posts)
    })


}

Post.findSingleById = function (id, visitorId) {
    return new Promise(async function (resolve, reject) {
        if (typeof (id) != "string" || !ObjectId.isValid(id)) {
            reject()
            return
        }
        let posts = await Post.reusablePostQuery([
            { $match: { _id: new ObjectId(id) } }
        ], visitorId)
        if (posts.length) {
            console.log(posts[0])
            resolve(posts[0])
        } else {
            reject("Post not found")
        }
    })


}

Post.findByAuthorId = function (authorId) {
    return Post.reusablePostQuery([
        { $match: { author: new ObjectId(authorId) } },
        { $sort: { createdDate: -1 } }
    ])

}

Post.delete = function (postIdToDelete, currentUserId) {

    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(postIdToDelete, currentUserId)
            if (post.isVisitorOwner) {
                await postsCollection.deleteOne({ _id: new ObjectId(postIdToDelete) })
                resolve()
            } else {
                reject()
            }

        } catch {
            reject()

        }
    })
}


module.exports = Post