const bookModel = require("../models/BookModel")
const UserModel = require("../models/UserModel")
const reviewModel = require('../models/ReviewModel')
const validator = require("../validator/validator")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const isValidObjectId = (objectId) => { return mongoose.Types.ObjectId.isValid(objectId) }

const createBook = async function (req, res) {
    try {
        const data = req.body
        let { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = data
        let decodedToken = jwt.verify(req.headers["x-auth-token" || "X-Auth-Token"], process.env.SECRET_KEY)
        let dateregex = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "EMPTY INPUT" })
        }
        // ALL VALIDATION IF REQUEST IS EMPTY----
        if (!title) {
            return res.status(400).send({ status: false, message: "TITLE IS REQUIRED" })
        }
        if (!excerpt) {
            return res.status(400).send({ status: false, message: "EXCERPT IS REQUIRED" })
        }
        if (!userId) {
            return res.status(400).send({ status: false, message: "USER-ID IS REQUIRED" })
        }
        if (!ISBN) {
            return res.status(400).send({ status: false, message: "ISBN IS REQUIRED" })
        }
        if (!category) {
            return res.status(400).send({ status: false, message: "CATEGORY IS REQUIRED" })
        }
        if (!subcategory) {
            return res.status(400).send({ status: false, message: "SUBCATEGORY IS REQUIRED" })
        }
        if (!releasedAt) {
            return res.status(400).send({ status: false, message: "RELEASED DATE IS REQUIRED" })
        }
        // VALIDATION IF INPUT IS INVALID TYRPE-----
        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "TITLE IS NOT VALID" })
        }
        if (!validator.isValid(excerpt)) {
            return res.status(400).send({ status: false, message: "EXCERPT IS NOT VALID" })
        }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "NOT A VALID USER ID" });
        }

        if (decodedToken.userId != userId) {
            return res.status(403).send({ status: false, message: 'YOU ARE NOT AUTHORISED' })
        }

        if (!releasedAt.match(dateregex)) {
            return res.status(400).send({ status: false, message: "INVALID DATE OR KINDLY ADD DATE IN YYYY-MM-DD FORMAT" })
        }

        if (!validator.isValid(ISBN)) {
            return res.status(400).send({ status: false, message: "ISBN IS NOT VALID" })
        }
        if (!validator.isValid(category)) {
            return res.status(400).send({ status: false, message: "CATEGORY IS NOT VALID" })
        }
        // IF SUB CATEGORY IS IN ARRAY -----
        if (typeof (subcategory) == "object") {
            for (let i = 0; i < subcategory.length; i++) {
                if (!validator.isValid(subcategory[i]))
                    return res.status(400).send({ status: false, message: "SUB-CATEGORY IS NOT VALID" })
            }
            if (subcategory.length == 0)
                return res.status(400).send({ status: false, message: "SUB-CATEGORY IS NOT VALID" })

        }
        if (!validator.isValid(subcategory)) {
            return res.status(400).send({ status: false, message: "SUB-CATEGORY IS NOT VALID" })
        }
        //CHECK UNIQUENESS------

        const isValidTitle = await bookModel.findOne({ title: title })
        if (isValidTitle) {
            return res.status(400).send({ status: false, message: "TITLE ALREADY EXISTS" })
        }

        const isUniqueISBN = await bookModel.findOne({ ISBN: ISBN })
        if (isUniqueISBN) {
            return res.status(400).send({ status: false, message: "ISBN ALREADY EXISTS" })
        }
        // CHECK USER-ID IS PRESENT OR NOT IN USER COLLECTION-----
        const userid = await UserModel.findOne({ _id: userId })
        if (!userid) {
            return res.status(404).send({ status: false, message: "USER NOT FOUND" })
        }
        const result = await bookModel.create(data)
        res.status(201).send({ status: true, message: "Success", data: result })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}





const getBooks = async function (req, res) {
    try {
        const { userId, category, subcategory } = req.query
        // CHECK DATA PRESENT OR NOT IN BODY----
        if (Object.keys(req.query).length == 0) {
            let find = await bookModel.find({ isDeleted: false })
            res.status(200).send({ status: true, message: "BooksList", data: find })

        }
        // CHECK USER ID VALIDATION------
        else if (userId || category || subcategory) {
            if (userId) {
                let isValid = mongoose.Types.ObjectId.isValid(userId);
                if (!isValid) { return res.status(400).send({ status: false, message: " USER-Id is Not Valid" }) }
            }
            if (userId)
                obj.userId = userId.trim();

            const obj = {}
            if (category) {
                obj.category = category
            }
            if (subcategory)
                obj.subcategory = subcategory
            // MAKE A FOR LOOP FOR SPLITING AND TRIMING GIVEN FILTERS------
            for (let key in obj) {
                if (typeof (obj[key]) == "string") {
                    obj[key] = obj[key].split(",")

                }
                for (let i = 0; i < obj[key].length; i++)
                    obj[key][i] = obj[key][i].toLowerCase().trim()
                obj[key] = { $all: obj[key] }
            }
            //FIND BOOK WITH THE HELP OF GIVEN FILTERS------
            const data = await bookModel.find({ ...obj, isDeleted: false }).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 })

            // IF  NO BOOK FOUND WITH GIVEN FILTERS-----
            if (data.length == 0) {
                return res.status(404).send({ status: false, message: "Book Not found" })
            }
            res.status(200).send({ status: true, message: "BooksList", data: data })
        }
        else {
            res.status(400).send({ status: false, message: "Invalid filters" })
        }
    }
    catch (err) {
        res.status(500).send({ status: true, message: err.message })
    }
}




const getBooksById = async function (req, res) {
    try {
        // TAKE BOOK ID FROM PARAMS----
        let bookId = req.params.bookId.trim()

        //IF BOOK ID IS NOT INPUT----
        if (!bookId) {
            return res.status(400).send({ status: false, message: " BOOK ID REQUIRED" })
        }

        // BOOK ID VALIDATION-----
        let isValid = mongoose.Types.ObjectId.isValid(bookId);
        if (!isValid) {
            return res.status(400).send({ status: false, message: "Id is Not Valid" })
        }

        // FIND BOOKS BY BOOK ID-----
        const result = await bookModel.findOne({ _id: bookId })

        //IF BOOK NOT FOUND-----
        if (!result) {
            return res.status(404).send({ status: false, message: " BOOK Not found" })
        }
        //FIND REVIEWS BY BOOK ID-----
        let getreview = await reviewModel.find({ bookId: bookId })

        res.status(200).send({ status: false, message: "BooksList", data: { ...result.toObject(), reviewsData: getreview } })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}




const updateBook = async function (req, res) {
    try {
        // TAKE BOK ID FROM PARAMS----
        let getId = req.params.bookId
        let data = req.body

        // VALIDATION OF BOOK ID----
        if (!isValidObjectId(getId)) {
            return res.status(400).send({ status: false, message: "NOT A VALID ID" });
        }
        // IF TRY TO UPDATE WITH EMPTY DATA-----
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "KINDLY ADD SOMETHING TO UPDATE" })
        let { title, excerpt, ISBN, releasedAt } = data

        // FIND BOOK BY BOOK ID----
        let Book = await bookModel.findById(getId)
        if (Book) {
            if (Book.isDeleted === false) {
                let isDuplicateTitle = await bookModel.findOne({ title: title })
                if (isDuplicateTitle) {
                    return res.status(400).send({ status: false, message: "TITLE IS ALREADY PRESENT" })
                }
                let isDuplicateISBN = await bookModel.findOne({ ISBN: ISBN })
                if (isDuplicateISBN) {
                    return res.status(400).send({ status: false, message: "ISBN IS ALREADY PRESENT" })
                }
                if (!releasedAt.match(dateregex)) {
                    return res.status(400).send({ status: false, message: "INVALID DATE OR KINDLY ADD DATE IN YYYY-MM-DD FORMAT" })
                }

                // UPDATE GIVEN DATA PRESENT IN BODY-----
                if (title || excerpt || ISBN || releasedAt) {
                    let Book = await bookModel.findByIdAndUpdate(
                        getId,
                        {
                            title: title,
                            excerpt: excerpt,
                            ISBN: ISBN,
                            releasedAt: releasedAt
                        },
                        { new: true }
                    );
                    // UPDATE SUCCESSFULL----
                    return res.status(200).send({ status: true, data: Book });
                }
                else
                    res.status(400).send({ status: false, message: "CANT UPDATE THESE DETAILS" })
            } else {
                res.status(404).send({ status: false, msg: "CANT UPDATE , IT IS DELETED" });
            }
        } else {
            res.status(404).send({ status: false, message: "Please enter valid Book id" });
        }

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}




const deleteBook = async function (req, res) {
    try {
        // TAKE BOO ID BY PARAMS----
        let bookId = req.params.bookId

        // VALIDATE BOOK ID ----
        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "NOT A VALID ID" })
        }
        // FIND BOOK BY BOOK ID----
        let book = await bookModel.findById(bookId)

        if (!book) {
            return res.status(404).send({ status: false, message: "BOOK does not found" })
        }

        // ANOTHER CONDTION FOR FINDING BOOK----
        if (book.isDeleted == true) {
            return res.status(400).send({ status: false, message: "BOOK ALREADY DELETED" })
        }

        // DELETE BOOK SUCCESSFULLY-----
        let updatedBook = await bookModel.findByIdAndUpdate(bookId, { isDeleted: true, deletedAt: Date.now() }, { new: true })
        res.status(200).send({ status: true, data: updatedBook })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}
module.exports = { createBook, getBooks, updateBook, getBooksById, deleteBook }