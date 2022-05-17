const mongoose = require('mongoose')


const UserSchema = new mongoose.Schema(
  {
    title: { 
       type: String,
       required: true,
       enum: ['Mr', 'Mrs', 'Miss'] 
      },
    name: { 
       type: String,
       required: true,
       lowercase: true 
      },
    phone: { 
       type: String, 
       required: true, 
       unique: true, 
       lowercase: true 
    },
    email: { 
       type: String, 
       required: true, 
       unique: true, 
       lowercase: true 
    },
    password: {
       type: String, 
       required: true,
       minLength: 8, 
       maxLength: 15 },
    address: {
       street: { 
         type: String, 
         lowercase: true 
        },
       city: { 
         type: String, 
         lowercase: true 
        },
       pincode: { 
         type: String, 
         lowercase: true 
        }
    },
  }, 
  { timestamps: true })

module.exports = mongoose.model("User", UserSchema)