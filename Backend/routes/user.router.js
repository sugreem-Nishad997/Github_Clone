import express from "express";
import {
  deleteUserProfile,
  getAllUsers,
  getUserProfile,
  login,
  singup,
  updateUserProfile,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/allUsers", getAllUsers);
userRouter.post("/signup", singup);
userRouter.post("/login", login);
userRouter.put("/updateUser/:id", updateUserProfile);
userRouter.get("/userProfile/:id", getUserProfile);
userRouter.delete("/deleteUser/:id", deleteUserProfile);

export default userRouter;
