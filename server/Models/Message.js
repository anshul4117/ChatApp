// import { model, models, Schema, } from "mongoose";
import mongoose, { model, Schema, Types } from "mongoose";
const MessageSchema = new Schema({
    content: {
        type:String,
    },
    attachements: [
        {
            publicId: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true
            },
        }
    ],
    sender: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
    chat: {
        type: Types.ObjectId,
        ref: "User",
        required: true
    },
}, {
    timestamps: true
});



export const Message = mongoose.models.Message || model("Message", MessageSchema);