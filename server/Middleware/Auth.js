import jwt from "jsonwebtoken"
import { ErrorHandler } from "../utils/Utility.js";
import { JWT_SECRET, adminSecretKey } from "../app.js";


const isAuthenticated = async (req, res, next) => {
  try {
    // console.log("cookies : ", req.cookies["chat-token"]);
    const token = req.cookies["chat-token"];
    // check token
    if (!token) return next(new ErrorHandler("Please login to access this route", 401));
    // console.log(process.env.JWT_SECRET);

    // decode Data 
    const decodedData = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decodedData._id;
    next();

  } catch (error) {
    next(error)
  }
}

// const adminOnly = (req, res, next) => {


//   try {
//     const token = req.cookies["chattu-token-admin"];
//     // console.log("token : ", token)
//     if (!token) return next(new ErrorHandler("Only Admin access this route", 401));

//     // console.log(JWT_SECRET)
//     console.log("here")
//     const secretKey = jwt.verify(token, process.env.JWT_SECRET);
//     console.log(secretKey)

//     const isMatched = secretKey === adminSecretKey;
//     console.log(isMatched)

//     if (!isMatched) return next(new ErrorHandler("Only Admin access this route", 401));

//     next();
//   } catch (error) {
//     next(error)
//   }


// }

// const adminOnly = (req, res, next) => {
//     const token = req.cookies["chattu-token-admin"];

//     if (!token)
//       return next(new ErrorHandler("Only Admin can access this route", 401));

//     const secretKey = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("secret :",process.env.JWT_SECRET)

//     const isMatched = secretKey === adminSecretKey;

//     if (!isMatched)
//       return next(new ErrorHandler("Invalid Admin key ", 401));
//     next();
//   };


export { isAuthenticated }