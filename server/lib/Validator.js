import { body, check, param, validationResult,query } from "express-validator"
import { ErrorHandler } from "../utils/Utility.js";


const validateHandler = (req, res, next) => {

    const errors = validationResult(req);
    const errorMessages = errors
        .array()
        .map((errors) => errors.msg)
        .join(",");

    console.log(errorMessages);

    if (errors.isEmpty()) return next();

    else next(new ErrorHandler(errorMessages, 400));

};

const adminValidator = ()=>[
    body("secretKey","Please Enter Secret Key").notEmpty()
]

const registerValidator = () => [
    // body(["name","userName","password","bio"]).notEmpty()
    body("name", "Please Enter Name ").notEmpty(),
    body("userName", "Please Enter userName ").notEmpty(),
    body("bio", "Please Enter Bio ").notEmpty(),
    body("password", "Please Enter Password ").notEmpty(),
    check("avatar", "Please upload avatar ").notEmpty(),
]

const loginValidator = () => [

    body("userName", "Please Enter userName ").notEmpty(),
    body("password", "Please Enter Password ").notEmpty(),
]


const newGroupValidator = () => [

    body("name", "Please Enter name ").notEmpty(),
    body("members")
        .notEmpty().
        withMessage("please Enter members")
        .isArray({ min: 2, max: 100 })
        .withMessage("Members must be 2-100"),
]


const addMemberValidator = () => [
    body("chatId", "please Enter chat ID").notEmpty(),
    body("members")
        .notEmpty()
        .withMessage("please enter menbers")
        .isArray({ min: 2, max: 97 })
        .withMessage("Members must be 1-97")

]


const removeMemberValidator = () => [
    body("chatId", "please enter ChatId").notEmpty(),
    body("userId", "please enter userId").notEmpty()

]

const sendAttachmentValidator = () => [
    body("chatId", "Please Enter ChatId").notEmpty(),
]

const chatIdValidator=()=>[param("id","Please Enter chatId").notEmpty()]


const renameValidator =()=>[
    param("id","Please Enter chatId").notEmpty(),
    body("name","Please Enter name").notEmpty()
]


const sendRequestValidator=()=>[
    body("userId","Please Enter UserId").notEmpty(),
]


const acceptRequestValidator=()=>[
    body("requestId","Please enter Request Id"),
    body("accept")
    .notEmpty().withMessage("Please App Accept")
    .isBoolean()
    .withMessage("Accept must be a boolean"),
];


export { registerValidator, 
    validateHandler, 
    loginValidator, 
    newGroupValidator, 
    addMemberValidator, 
    removeMemberValidator, 
    sendAttachmentValidator,
    chatIdValidator,
    renameValidator,
    sendRequestValidator,
    acceptRequestValidator,
    adminValidator
 }