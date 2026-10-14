import express from "express";
import {
  deleteUserProfile,
  getAllUsers,
  getUserProfile,
  login,
  signup,
  updateUserProfile,
  sendOtp,
  verifyOtpAndSignup,
  resendOtp,
} from "../controllers/userController.js";

const userRouter = express.Router();

// OTP-based registration routes
userRouter.post("/send-otp", sendOtp);
userRouter.post("/verify-otp", verifyOtpAndSignup);
userRouter.post("/resend-otp", resendOtp);

// Standard auth routes
userRouter.get("/allUsers", getAllUsers);
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/updateUser/:id", updateUserProfile);
userRouter.get("/userProfile/:id", getUserProfile);
userRouter.delete("/deleteUser/:id", deleteUserProfile);

export default userRouter;
