import User from "../models/User.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Resume from "../models/Resume.js";

const generateToken = (userId)=>{
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: '7d'})
    return token
}

//controller for the user registration
//POST: /api/users/register
export const registerUser = async (req ,res) => {
    try {
        const {name, email, password} = req.body;

        //check if required fields are present
        if(!name || !email || !password){
            return res.status(400).json({message: 'missing required fields'})
        } 

        //check if user already exists
        const user=await User.findOne({email})
        if(user){
            return res.status(400).json({message: 'user already exists'})
        }

        //create new user
        const hasedPassword = await bcrypt.hash(password ,10)
        const newUser = await User.create({
            name, email, password: hasedPassword
        })

        //return success message
        const token = generateToken(newUser._id)
            newUser.password = undefined;

            return res.status(201).json({message: 'User created successfully', token, user: newUser})

    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}


//controller for the user registration
//POST: /api/users/register
export const loginUser = async (req ,res) => {
    try {
        const {email, password} = req.body;

        //check if user exists
        const user=await User.findOne({email})
        if(!user){
            return res.status(400).json({message: 'invalid email or password'})
        }

        //check if password is correct
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(400).json({message: 'invalid email or password'})
        }

        //return success message
        const token = generateToken(user._id)
        user.password = undefined;

            return res.status(200).json({message: 'login successfully', token, user})

    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}

//controller for getting user by id
//GET: /api/user/data
export const getUserById = async (req ,res) => {
    try {

        const userId = req.userId;

        //check if user exists
        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({message: 'user not found'})
        }
        //return user
        user.password = undefined;
        return res.status(200).json({user})

    } catch (error) {
        return res.status(400).json({message: error.message})
    }
}

//controller for getting resumes
//GET: /api/user/resumes
export const getUserResumes = async (req, res) => {
    try {
        const userId = req.userId;

        //return user resumes
        const resumes = await Resume.find({userId})
        return res.status(200).json({resumes})
    } catch (error) {
         return res.status(400).json({message: error.message})
    }
}