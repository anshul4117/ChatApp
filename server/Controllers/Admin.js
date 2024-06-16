import { User } from "../Models/User.js"
import { Chat } from "../Models/Chat.js";
import { Message } from "../Models/Message.js";
import { ErrorHandler } from "../utils/Utility.js";
import jwt from "jsonwebtoken"
import { cookieOptions } from "../utils/Features.js";
import { adminSecretKey } from "../app.js";


const adminLogin = async (req, res, next) => {
    try {
        const { secretKey } = req.body;

        // const adminSecretKey = "aksdsolution";

        const isMatched = secretKey === adminSecretKey;

        if (!isMatched) return next(new ErrorHandler("Invalid Admin Key"), 401);
        const key = process.env.ADMIN_SECRET_KEY;
        // console.log(key)
        const token = jwt.sign(secretKey, key);

        return res.status(200)
            .cookie("chattu-token-admin", token, { ...cookieOptions, maxAge: 1000 * 60 * 15 })
            .json({
                success: true,
                message: "Admin logged in successfully",
            })
    } catch (error) {
        next(error)
    }

}

const adminLogout = async (req, res, next) => {
    try {


        return res.status(200)
            .cookie("chattu-token-admin", "", { ...cookieOptions, maxAge: 0 })
            .json({
                success: true,
                message: "Logged Out successfully",
            })
    } catch (error) {
        next(error)
    }

}


const getAdminData = async (req, res, next) => {

    try {
        return res.status(200).json({
            admin:true,
        })

    } catch (error) {
        next(error);
    }
}

const getAllUsers = async (req, res, next) => {
    try {

        const users = await User.find({});

        const transformedUsers = await Promise.all(users.map(async ({ name, userName, avatar, _id }) => {
            const [groups, friends] = await Promise.all([
                Chat.countDocuments({ groupChat: true, members: _id },),
                Chat.countDocuments({ groupChat: false, members: _id })
            ]);

            return {
                name,
                userName,
                avatar: avatar.url,
                _id,
                groups,
                friends,
            };
        })
        );


        return res.status(200).json({
            success: true,
            users: transformedUsers,
        })
    } catch (error) {
        next(error)
    }
}


const getAllChats = async (req, res, next) => {
    try {
        const chats = await Chat.find({})
            .populate("members", "name avatar")
            .populate("creator", "name avatar")

        const transformedChats = await Promise.all(
            chats.map(async ({ members, name, _id, groupChat, creator }) => {

                const totalMessages = await Message.countDocuments({ chat: _id });
                return {
                    _id,
                    name,
                    avatar: members.slice(0, 3).map((member) => member.avatar.url),
                    members: members.map(({ _id, name, avatar }) => ({
                        _id,
                        name,
                        avatar: avatar.url,
                    })),
                    creator: {
                        name: creator?.name || "None",
                        avatar: creator?.avatar.url || ""
                    },
                    totalMembers: members.length,
                    totalMessages,
                };
            })
        );

        return res.status(200).json({
            success: true,
            chats: transformedChats
        })
    } catch (error) {
        next(error);
    }
}


const getAllMessages = async (req, res, next) => {
    const messages = await Message.find({})
        .populate("sender", "name avatar")
        .populate("chat", "groupChat");

    const transformedMessages = messages.map(
        ({ content, attachements, _id, sender, createdAt, chat }) => ({
            _id,
            content,
            attachements,
            createdAt,
            sender: {
                _id: sender._id,
                name: sender.name,
                avatar: sender.avatar,
            },
            chat: chat._id,
            groupChat: chat.groupChat,
        })
    );

    return res.status(200).json({
        success: true,
        messages: transformedMessages
    });
}

const getDashboardStats = async (req, res, next) => {
    try {

        const [groupCount, userCount, messageCount, totalChatsCount] = await Promise.all([
            Chat.countDocuments({ groupChat: true }),
            User.countDocuments(),
            Message.countDocuments(),
            Chat.countDocuments()
        ])

        const today = new Date();
        const lastSevenDays = new Date();
        lastSevenDays.setDate(lastSevenDays.getDate() - 7);

        const lastSevenDaysMessages = await Message.find({
            createdAt: {
                $gte: lastSevenDays,
                $lt: today,
            },
        }).select("createdAt")

        const messages = new Array(7).fill(0);

        const dayInMiliseconds = 1000 * 60 * 60 * 24;

        lastSevenDaysMessages.forEach((message) => {
            const indexApprox = (today.getTime() - message.createdAt.getTime()) / dayInMiliseconds;

            const index = Math.floor(indexApprox);

            messages[6 - index]++;
        })

        const stats = {
            groupCount,
            userCount,
            messageCount,
            totalChatsCount,
            messagesChart: messages
        }

        return res.status(200).json({
            success: true,
            stats
        })
    } catch (error) {
        next(error)
    }
}

export { getAllUsers, getAllChats, getAllMessages, getDashboardStats, adminLogin, adminLogout, getAdminData }