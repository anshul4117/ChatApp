import { ALTER, NEW_ATTACHMENTS, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../Constant/Events.js";
import { ErrorHandler } from "../utils/Utility.js";
import { Chat } from "../Models/Chat.js"
import { User } from "../Models/User.js"
import { deleteFilesFromCloudinary } from "../utils/Features.js";
import { Message } from "../Models/Message.js"
import { emitEvent } from "../utils/Features.js";
import { getOtherMember } from "../lib/Helper.js";

// new group chat
const newGroupChat = async (req, res, next) => {
    try {

        const { name, members } = req.body;

        // if (members.length < 2)
        //     return next(
        //         new ErrorHandler("Group Chat must have at least 3 Members", 400)
        //     );

        const allMembers = [...members, req.user];
        await Chat.create({
            name,
            groupChat: true,
            creator: req.user,
            members: allMembers
        });

        emitEvent(req, ALTER, allMembers, `Welcome to ${name} group`);
        emitEvent(req, REFETCH_CHATS, members, `Welcome to ${name} group`);

        return res.status(201).json({
            success: true,
            message: "Group chat created"
        })



    } catch (error) {
        next(error)
    }
}

// getMyChats
const getMyChats = async (req, res, next) => {
    try {

        const chats = await Chat.find({ members: req.user }).populate("members", "name avatar");

        const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
            const otherMember = getOtherMember(members, req.user);
            return {
                _id, groupChat,
                avatar: groupChat
                    ? members.slice(0, 3).map(({ avatar }) => avatar.url)
                    : [otherMember.avatar.url],
                name: groupChat ? name : otherMember.name,
                members: members.reduce((prev, curr) => {
                    if (curr._id.toString() !== req.user.toString()) {
                        prev.push(curr._id);
                    }
                    return prev
                }, []),
            }
        });
        return res.status(201).json({
            success: true,
            message: transformedChats
        })


    } catch (error) {
        next(error)
    }
}

// get my Groups
const getMyGroups = async (req, res, next) => {
    try {

        const chats = await Chat.find({
            members: req.user,
            groupChat: true,
            creator: req.user
        }).populate("members", "name avatar")

        const groups = chats.map(({ members, _id, name, groupChat }) => ({
            _id,
            groupChat,
            name,
            avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
        }));

        return res.status(201).json({
            success: true,
            chats,
        })

    } catch (error) {
        next(error)
    }
}

// add Members
const addMembers = async (req, res, next) => {
    try {

        const { chatId, members } = req.body;
        const chat = await Chat.findById(chatId);

        if (!chat) return next(new ErrorHandler("Chat is not found", 404));

        if (!chat.groupChat) return next(new ErrorHandler("This is not group Chat", 400));

        if (chat.creator.toString() !== req.user.toString()) {
            return next(new ErrorHandler("You are not allowed to add Members", 403));
        }

        const allNewMemberPromise = members.map((i) => User.findById(i, "name"));

        const allNewMembers = await Promise.all(allNewMemberPromise);

        const uniqueMembers = allNewMembers
            .filter((i) => !chat.members.includes(i._id.toString()))
            .map((i) => i._id);

        chat.members.push(...uniqueMembers);


        if (chat.members.length > 100) {
            return next(new ErrorHandler("Group members limit reached", 400));
        }

        await chat.save();
        const allUserName = allNewMembers.map((i) => i.name).join(",");

        emitEvent(req, ALTER, chat.members, `${allUserName} has been in the group`);

        emitEvent(req, REFETCH_CHATS, chat.members);

        return res.status(200).json({
            success: true,
            message: "Member added Successfully",
        })


    } catch (error) {
        next(error)
    }
}

// remove Member in group
const removeMembers = async (req, res, next) => {
    try {
        const { userId, chatId } = req.body;

        const [chat, userThatWillBeRemoved] = await Promise.all([
            Chat.findById(chatId),
            User.findById(userId),
        ]);

        if (!chat) return next(new ErrorHandler("Chat is not found", 404));

        if (!chat.groupChat) return next(new ErrorHandler("This is not a group chat", 400));
        if (chat.creator.toString() !== req.user.toString())
            return next(new ErrorHandler("You are not allowed to add members", 403));

        if (chat.members.length <= 3) {
            return next(new ErrorHandler("Group must have at least 3 members"), 400);
        }

        chat.members = chat.members.filter(
            (member) => member.toString() !== userId.toString()
        );

        await chat.save();

        emitEvent(req, ALTER, chat.members, `${userThatWillBeRemoved} has been removed from the group`);

        emitEvent(req, REFETCH_CHATS, chat.members);

        return res.status(200).json({
            success: true,
            message: "Member Removed Successfully",
        })


    } catch (error) {
        next(error)
    }
}

const leaveGroup = async (req, res, next) => {
    try {

        const chatId = req.params.id;

        const chat = await Chat.findById(chatId);

        if (!chat) return next(new ErrorHandler("Chat not found ", 404));

        if (!chat.groupChat) return next(new ErrorHandler("This is not a group chat", 400));

        const remainingMembers = chat.members.filter(
            (member) => member.toSting() !== req.user.toString()
        );

        if (chat.creator.toSting() === req.user.toSting()) {
            const randomElement = Math.floor(Math.random() * remainingMembers.length);
            const newCreator = remainingMembers[randomElement];
            chat.creator = newCreator;
        }
        chat.members = remainingMembers;

        const user = await Promise.all([
            User.findById(req.user, "name"),
            chat.save(),
        ]);
        // await chat.save();

        emitEvent(req, ALTER, chat.members, `User ${user.name} has left the group`);

        return res.status(200).json({
            success: true,
            message: "Member removed successfully",
        })

    } catch (error) {
        next(error)
    }
}


const sendAttachment = async (req, res, next) => {
    try {

        const { chatId } = req.body;
        const files = req.files || [];

        if(files.length < 1){
            return next(ErrorHandler("Please Upload Attachements",400))
        }

        if(files.length>5){
            return next(ErrorHandler("Files can't more than 5",400))
        }

        const [chat, me] = await Promise.all([
            Chat.findById(chatId),
            User.findById(req.user, "name")
        ]);

        if (!chat) return next(new ErrorHandler("Chat not found", 404));


        if (files.length < 1) return next(new ErrorHandler("Please provide Attachment"), 400);

        // Upload files here
        const attachments = [];

        const messageForDB = { content: "", attachments, sender: me._id, chat: chatId }

        const messageForRealtime = {
            ...messageForDB,
            sender: {
                _id: me._id,
                name: me.name,
            }
        }

        const message = await Message.create(messageForDB)

        emitEvent(req, NEW_ATTACHMENTS, chat.members, {
            message: messageForRealtime,
            chatId
        })

        emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });


        return res.status(201).json({
            success: true,
            message,
        })

    } catch (error) {
        next(error)
    }
}


const getChatDetails = async (req, res, next) => {
    try {

        if (req.query.populate === "true") {

            const chat = await Chat.findById(req.params.id)
                .populate("members", "name avatar")
                .lean();

            if (!chat) return next(new ErrorHandler("chat Not found", 400));

            chat.members = chat.members.map(({ _id, name, avatar }) =>
            ({
                _id,
                name,
                avatar: avatar.url,
            }))

            console.log("here")

            return res.status(200).json({
                success: true,
                message: "Data fetched Successfully",
                chat,
            })
        } else {
            const chat = await Chat.findById(req.params.id);
            if (!chat) return next(new ErrorHandler("chat not found", 404));

            return res.status(200).json({
                success: true,
                chat,
            })
        }



    } catch (error) {
        next(error)
    }
}


const renameGroup = async (req, res, next) => {
    try {
        const chatId = req.params.id;
        const { name } = req.body;

        const chat = await Chat.findById(chatId);
        if (!chat) return next(new ErrorHandler("Chat not found", 404));

        if (!chat.groupChat) return next(new ErrorHandler("This is not a groip Chat", 400));

        if (chat.creator.toString() !== req.user.toString())
            return next(new ErrorHandler("You are not allowed to rename this group", 401));

        chat.name = name;
        await chat.save();

        emitEvent(req, REFETCH_CHATS, chat.members);

        return res.status(200).json({
            success: true,
            message: "Group renamed successfully",
        })


    } catch (error) {
        next(error)
    }
}


const deleteChat = async (req, res, next) => {
    try {

        const chatId = req.params.id;

        const chat = await Chat.findById(chatId);
        if (!chat) return next(new ErrorHandler("Chat not found", 404));

        const members = chat.members;

        if (!chat.groupChat && chat.creator.toString() !== re.user.toString())
            return next(new ErrorHandler("You are not allowed to delete this group", 403));

        if (!chat.groupChat && !chat.members.includes(req.user.toString()))
            return next(new ErrorHandler("You are not allowed to delete this chat", 403));

        // here we have to delete messages and attachements files

        const messagesWithAttachements = await Message.find({
            chatId: chatId,
            attachments: { $exists: true, $ne: [] },
        })

        const public_ids = [];

        messagesWithAttachements.forEach(({ attachments }) =>
            attachments.forEach(({ public_id }) => public_ids.push(public_id))
        );

        await Promise.all([
            deleteFilesFromCloudinary(public_ids),
            chat.deleteOne(),
            Message.deleteMany({ chat: chatId }),
        ]);

        emitEvent(req, REFETCH_CHATS, members);

        return res.status(200).json({
            success: true,
            message: "Chat Deleted successfully"
        })


    } catch (error) {
        next(error)
    }
}


const getMessages = async (req, res, next) => {
    try {

        const chatId = req.params.id;
        // const chat = await Chat.findById(chatId);
        // if (!chat) return next(new ErrorHandler("Chat not found", 404));

        const { page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;
        const [messages, totalMessageCount] = await Promise.all([
            Message.find({ chat: chatId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("sender", "name")
                .lean(),
            Message.countDocuments({ chat: chatId }),

        ]);

        const totalPages = Math.ceil(totalMessageCount / limit);

        return res.status(200).json({
            success: true,
            message:messages.reverse(),
            totalPages,
        })

    } catch (error) {
        next(error)
    }
}

export {
    newGroupChat,
    getMyChats,
    getMyGroups,
    addMembers,
    removeMembers,
    leaveGroup,
    sendAttachment,
    getChatDetails,
    renameGroup,
    deleteChat,
    getMessages
};

