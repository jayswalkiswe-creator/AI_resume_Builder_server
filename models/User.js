import mongoose from "mongoose";
import bcrypt from 'bcrypt'

const UserSchema = new mongoose.Schema({
    name:{type: String, required: true},
    email:{type: String, required: true, unique: true},
    password:{type: String, required: true},
},{timestamps: true})

UserSchema.methods.comparePassword = function (passowrd){
    return bcrypt.compareSync(passowrd, this.passowrd)
}

const User = mongoose.model("User", UserSchema)

export default User;