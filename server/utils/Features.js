import mongoose from "mongoose"
import jwt from "jsonwebtoken"

const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    httpOnly: true,
    secure: true
};

const connectDB = (url) => {
    mongoose
        .connect(url, { dbName: "WebChat" })
        .then((data) => console.log(`connected to DB: ${data.connection.host} `))
        .catch((error) => {
            throw error
        })
}


const sendToken = (res, user, code, message) => {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    // console.log("Token : "+token)
    return res.status(code).cookie("chat-token", token, cookieOptions).json({
        success: true,
        message,
        user
    })
}

const emitEvent = async (req, event, users, data) => {
    console.log("Emiting event", event);
}

const deleteFilesFromCloudinary = async (public_id) => {
    // delete file from cloudinary
}

// sendToken("asd",{_id:"asddsa"},201,"User Created")


export { connectDB, sendToken, cookieOptions, emitEvent, deleteFilesFromCloudinary }