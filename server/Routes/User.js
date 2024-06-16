import express from "express";
import { acceptFriendRequest, getMyFriends, getMyNotifications, getMyProfile, login, logout, newUser, searchUser, sendFriendRequest } from "../Controllers/User.js"
import { singleAvatar } from "../Middleware/Multer.js";
import { isAuthenticated } from "../Middleware/Auth.js";
import { acceptRequestValidator, loginValidator, registerValidator, sendRequestValidator, validateHandler } from "../lib/Validator.js";
const app = express.Router();

app.post('/new', singleAvatar, registerValidator(), validateHandler, newUser);
app.post('/login',loginValidator(),validateHandler, login);

app.use(isAuthenticated);
app.get('/me', getMyProfile);
app.get('/logout', logout);
app.get('/search', searchUser);
app.put('/sendrequest',sendRequestValidator(),validateHandler, sendFriendRequest);
app.put('/acceptrequest',acceptRequestValidator(),validateHandler, acceptFriendRequest);
app.get('/notifications',getMyNotifications)
app.get('/friends',getMyFriends)


export default app;
