import express from "express";
import { connectDB } from "./utils/Features.js";
import dotenv from "dotenv"
import { errorMiddleware } from "./Middleware/Error.js"
import cookieParser from "cookie-parser";
// import { createUser } from "./Seeders/user.js";
import { Server } from "socket.io"; 
import { v4 as uuid } from "uuid";



import userRoute from "./Routes/User.js"
import chatRoute from "./Routes/Chat.js"
import adminRoute from "./Routes/Admin.js"
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./Constant/Events.js";
import { getSocket } from "./lib/Helper.js";
import { Message } from "./Models/Message.js";
import { createServer } from "http";

const app = express();

const server = createServer(app);
const io = new Server(server, {});


dotenv.config({
    path: "./.env",
})

const envMode = process.env.NODE_ENV.trim() || "PRODUCTION"
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "aksdEDTech"
const JWT_SECRET = process.env.JWT_SECRET
const PORT = process.env.PORT;

const userSocketIds = new Map();
app.use(express.json());
app.use(cookieParser())

connectDB(process.env.DATABASE_URL);
// createUser(10);

app.use('/User', userRoute);
app.use('/Chat', chatRoute);
app.use('/Admin', adminRoute);

app.get('/', (req, res) => {
    res.send("helo World")
})


io.on("connection", (socket) => {
    const user = {
        _id: "sasd",
        name: "anshul    ",
    };
    userSocketIds.set(user._id.toString(), socket.id);
    console.log("server connected", socket.id);

    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
        const messageForRealTime = {
            content: message,
            _id: uuid(),
            sender: {
                _id: user._id,
                name: user.name,
            },
            chat: chatId,
            createdAt: new Date().toISOString(),
        };
        const messageForDB = {
            content: message,
                    sender: user._id,
            chat: chatId,
        };
        const membersSocket = getSocket(members);

        io.to(membersSocket).emit(NEW_MESSAGE, {
            chatId,
            message: messageForRealTime,
        });

        io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });
        await Message.create(messageForDB)
    })
    socket.on("Disconnect", () => {
        console.log("User Disconnected");
        userSocketIds.delete(user._id.toString());
    });
})

app.use(errorMiddleware)

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} Mode`)
})


export { adminSecretKey, JWT_SECRET, userSocketIds, envMode }