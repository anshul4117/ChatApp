import express from 'express';
import { adminLogin, adminLogout, getAdminData, getAllChats, getAllMessages, getAllUsers, getDashboardStats } from '../Controllers/Admin.js';
import { adminValidator, validateHandler } from '../lib/Validator.js';


const app = express.Router();

app.post('/verify',adminValidator(),validateHandler,adminLogin);
app.get('/logout',adminLogout);

// app.use(adminOnly);  creating problem

app.get('/',getAdminData);

app.get('/users',getAllUsers);
app.get('/chats',getAllChats);
app.get('/messages',getAllMessages);

app.get('/stats',getDashboardStats);

export default app