const userModel = require('../models/UserModel')
const validator = require('../validator/validator')
const jwt = require("jsonwebtoken")

const createUser = async function (req, res) {
    try {
        let data = req.body
        let passwordregex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/

        let { title, name, phone, email, password, address } = data
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "EMPTY INPUT" })
        }
        // VALIDATION FOR TITLE-----
        if (!title) {
            return res.status(400).send({ status: false, message: "TITLE CANT BE EMPTY" })
        }
        if (!validator.isTitleValid(title)) {
            return res.status(400).send({ status: false, message: "TITLE IS NOT VALID" })
        }
        // VALIDATION FOR NAME-----
        if (!name) {
            return res.status(400).send({ status: false, message: "NAME CANT BE EMPTY" })
        }
        if (!validator.isValid(name)) {
            return res.status(400).send({ status: false, message: "NAME IS NOT VALID" })
        }
        // VALIDATION FOR PHONE NUMBER-----
        if (!phone) {
            return res.status(400).send({ status: false, message: "NUMBER CANT BE EMPTY" })
        }
        if (!validator.isPhoneValid(phone)) {
            return res.status(400).send({ status: false, message: "PHONE NUMBER IS NOT VALID" })
        }
        // CHECK UNIQUENESS OF PHONE NUMBER-----
        const isUniquePhone = await userModel.findOne({ phone: phone })
        if (isUniquePhone) {
            return res.status(400).send({ status: true, message: "PHONE No. ALRADY REGISTER" })
        }
        // VALIDATION FOR PASSWORD-----
        if (!password) {
            return res.status(400).send({ status: false, message: "PASSWORD CAN NOT BE EMPTY" })
        }
        if (!password.match(passwordregex)) {
            return res.status(400).send({
                message: "Password should include atleast one special character, one uppercase, one lowercase, one number and should be mimimum 8 character long",
            });

        }
        // VALIDATION FOR EMAIL------
        if (!email) {
            return res.status(400).send({ status: false, message: "Email can not be empty" })
        }
        if (!validator.isEmailValid(email)) {
            return res.status(400).send({ status: false, message: "Email IS NOT VALID" })
        }
        // CHEECK UNIQUENESS OF EMAIL-----
        const isUniqueEmail = await userModel.findOne({ email: email })
        if (isUniqueEmail) {
            return res.status(400).send({ status: true, message: "EMAIL ALRADY REGISTER" })
        }
        // VALIDATION FOR ADDRESS------

        function validatePIN(pincode) {
            return /^(\d{4}|\d{6})$/.test(pincode)
        }
        if (address) {
            if (address.pincode) {
                if (!validatePIN(address.pincode)) {
                    return res.status(400).send({ status: true, message: "IN INVALID PIN CODE" })
                }
            }
        }

        // IF GIVEN DATA IS ERROR FREE THEN IT CREATE USER IN DB-----
        let user = await userModel.create(data)
        res.status(201).send({ status: true, message: "Success", data: user })
    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

const loginUser = async function (req, res) {
    try {
        let { email, password } = req.body
        // CHECK THE INPUT OF EMAIL-----
        if (!email) {
            return res.status(400).send({ status: false, message: "Email can not be empty" })
        }
        // CHECK THE INPUT OF PASSWORD----
        if (!password) {
            return res.status(400).send({ status: false, message: "PASSWORD CAN NOT BE EMPTY" })
        }
        // FIND DOCUMNET WITH THE HELP OF EMAIL-----
        const user = await userModel.findOne({ email: email })
        if (!user) {
            return res.status(400).send({ status: false, message: "User not found" })
        }
        if (user.password != password) {
            return res.status(400).send({ status: false, message: "Password is incorrect" })
        }
        // IF DOCUMENT FOUND THEN CREATE JWT TOKEN-----
        const token = jwt.sign({ userId: user._id.toString() }, process.env.SECRET_KEY, { expiresIn: "2h" })

        // SET TOKEN IN RESPONSE HEADER----
        res.setHeader("x-auth-token", token);

        res.status(200).send({ status: true, message: "you are Logged in!", token: token })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}
// MAKE MODULE PUBLIC AND EXPORT FRON HERE-----
module.exports = { createUser, loginUser }