import express from "express";
import {addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMembers, renameGroup, sendAttachment} from "../Controllers/Chats.js"
import { isAuthenticated } from "../Middleware/Auth.js";
import { attachmentMulter } from "../Middleware/Multer.js";
import { addMemberValidator, chatIdValidator, newGroupValidator, removeMemberValidator, renameValidator, sendAttachmentValidator, validateHandler } from "../lib/Validator.js";

const app = express.Router();

app.use(isAuthenticated);

app.post("/new",newGroupValidator(),validateHandler, newGroupChat)

app.get("/my",getMyChats)

app.get("/my/groups",getMyGroups)

app.put("/addMembers",addMemberValidator(),validateHandler,addMembers)

app.put("/removeMember",removeMemberValidator(),validateHandler,removeMembers)

app.delete("/leave/:id",chatIdValidator(),validateHandler,leaveGroup);

// send Attachment
app.post("/message",attachmentMulter,sendAttachmentValidator(),validateHandler,sendAttachment);

app.get("/message/:id",chatIdValidator(),validateHandler,getMessages);


app.route("/:id",)
.get(chatIdValidator(),validateHandler,getChatDetails)
.put(renameValidator(),validateHandler,renameGroup)
.delete(chatIdValidator(),validateHandler,deleteChat);



export default app;
