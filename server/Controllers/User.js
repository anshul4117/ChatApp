import { compare } from 'bcrypt';
import { User } from '../Models/User.js';
import { cookieOptions, emitEvent, sendToken } from '../utils/Features.js';
import { ErrorHandler } from '../utils/Utility.js';
import { Chat } from '../Models/Chat.js';
import { NEW_REQUEST, REFETCH_CHATS } from '../Constant/Events.js';
import { Request } from '../Models/Request.js';
import { getOtherMember } from "../lib/Helper.js"


// login user and send Token
const login = async (req, res, next) => {
    try {
        // console.log("login route")
        const { userName, password } = req.body;
        // console.log(userName)
        const user = await User.findOne({ userName }).select("+password");

        if (!user) return next(new ErrorHandler("Invalid UserName or Password", 404))

        // const isMatch = await compare(password, user.password);

        // if (!isMatch) return next(new ErrorHandler("Invalid Password", 404));

        sendToken(res, user, 200, `Welcome back ,${user.name}`)
        // res.send("login");
    } catch (error) {
        next(error);
    }
}

// new User
const newUser = async (req, res,next) => {

    try {
        const { name, userName, password, bio } = req.body
        console.log(req.body)

        const avatar = {
            public_id: "asgha",
            url: 'hjnkk',
        };

        const user = await User.create({
            name,
            userName,
            password,
            avatar,
        });

        sendToken(res, user, 201, "User created")
        res.status(201).json({
            success: true,
            message: "User Created Successfully"
        })
    } catch (error) {
        next(error)
    }
}

// get Prpfile
const getMyProfile = async (req, res) => {
    const user = await User.findById(req.user)
    res.status(200).json({
        success: true,
        user,
    })
}

// logout the page or profile
const logout = async (req, res) => {
    return res.status(200).cookie("chat-token", "", { cookieOptions, maxAge: 0 }).json({
        success: true,
        message: "Logged out successfully"
    });
}

const searchUser = async (req, res, next) => {

    const { name } = req.query;
    const myChats = await Chat.find({ groupChat: false, members: req.user })

    const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);


    const allUsersExpectMeAndFriends = await User.find({
        _id: { $nin: allUsersFromMyChats },
        name: { $regex: name, $options: "i" },
    })

    const users = allUsersExpectMeAndFriends.map(({ _id, name, avatar }) => ({
        _id,
        name,
        avatar: avatar.url,
    }));

    return res.status(200).json({
        success: true,
        users
    });
}


const sendFriendRequest = async (req, res, next) => {

    try {

        const { userId } = req.body;

        const request = await Request.findOne({
            $or: [
                { sender: req.user, receiver: userId },
                { sender: userId, receiver: req.user },
            ]
        });

        if (request) return next(new ErrorHandler("Request already sent"), 400);

        await Request.create({
            sender: req.user,
            receiver: userId
        })

        emitEvent(req, NEW_REQUEST, [userId]);

        res.status(200).json({
            success: true,
            message: "Friend request send"
        })


    } catch (error) {
        next(error)
    }
}

const acceptFriendRequest = async (req, res, next) => {
    const { requestId, accept } = req.body;

    const request = await Request.findById(requestId)
        .populate("sender", "name")
        .populate("receiver", "name")

    if (!request) return next(new ErrorHandler("Request Not found", 404));

    if (request.receiver._id.toString() !== req.user.toString()) {
        return next(new ErrorHandler("You are not authorized to accept this request"));
    }

    if (!accept) {
        await request.deleteOne();
        return res.status(200).json({
            success: true,
            message: "Friend Request Rejected"
        });
    }

    const members = [request.sender._id, request.receiver._id];
    await Promise.all([
        Chat.create({
            members,
            name: `${request.sender.name}-${request.receiver.name}`,
        }),
        request.deleteOne()
    ])
    console.log("request")

    emitEvent(req, REFETCH_CHATS, members);

    return res.status(200).json({
        success: true,
        message: "Friend Accept The Request ",
        senderId: request.sender._id,
    });
}


const getMyNotifications = async (req, res, next) => {
    try {
        const requests = await Request.find({ receiver: req.user }).populate(
            "sender",
            "name avatar"
        );

        const allRequests = requests.map(({ _id, sender }) => ({
            _id,
            sender: {
                _id: sender._id,
                name: sender.name,
                avatar: sender.avatar.url,
            }
        }));

        return res.status(200).json({
            success: true,
            allRequests,
        })

    } catch (error) {
        next(error)
    }


}


const getMyFriends = async (req, res, next) => {
    try {

        const chatId = req.query.chatId;

        const chats = await Chat.find({
            members: req.user,
            groupChat: false,
        }).populate("members", "name avatar");

        const friends = chats.map(({ members }) => {
            const otherUser = getOtherMember(members, req.user);
            return {
                _id: otherUser.user,
                name: otherUser.name,
                avatar: otherUser.avatar.url,
            };
        });

        if (chatId) {

            const chat = await Chat.findById(chatId);

            const availableFriends = friends.filter(
                (friend) => !chat.members.includes(friends._id)
            );

            return res.status(200).json({
                success: true,
                friends: availableFriends
            });

        } else {
            return res.status(200).json({
                success: true,
                friends,
            })
        }



    } catch (error) {
        next(error)
    }
}


export { login, newUser, getMyProfile, logout, searchUser, sendFriendRequest, acceptFriendRequest, getMyNotifications, getMyFriends }