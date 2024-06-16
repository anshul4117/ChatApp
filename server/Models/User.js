import mongoose, { model, Schema } from "mongoose";
import bcrypt from "bcrypt"
const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true
        },
    },
}, {
    timestamps: true
});


UserSchema.pre("save", async function () {

    if(!this.isModified("password")) next();
    this.password = await bcrypt.hash(this.password,10)
});


export const User = mongoose.models.User || model("User", UserSchema)