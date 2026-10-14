import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import { sendOtpEmail } from "../config/mailer.js";

dotenv.config();

const url = process.env.MONGODB_URL;

let client;

async function connectClient() {
  if (!client) {
    client = new MongoClient(url);
    await client.connect();
  }
}

/**
 * Sends a 6-digit verification OTP to user's email before registration
 */
const sendOtp = async (req, res) => {
  const { username, email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required!" });
    }

    const emailNormalized = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
      return res.status(400).json({ message: "Invalid email format!" });
    }

    await connectClient();
    const db = client.db("githubClone");
    const usersCollection = db.collection("users");
    const otpsCollection = db.collection("otps");

    // Check if email already registered
    const existingEmail = await usersCollection.findOne({ email: emailNormalized });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already in use!" });
    }

    // Check if username already taken (if provided)
    if (username) {
      const usernameNormalized = username.toLowerCase().trim();
      const existingUser = await usersCollection.findOne({ username: usernameNormalized });
      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken!" });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any previous OTPs for this email and save new one
    await otpsCollection.deleteMany({ email: emailNormalized });
    await otpsCollection.insertOne({
      email: emailNormalized,
      otp,
      createdAt: new Date(),
    });

    // Send OTP email
    await sendOtpEmail(emailNormalized, otp, username || "");

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${emailNormalized}`,
    });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res.status(500).json({
      message: "Failed to send verification code. Please check your email configuration or try again.",
      error: error.message,
    });
  }
};

/**
 * Verifies OTP and completes user registration
 */
const verifyOtpAndSignup = async (req, res) => {
  const { username, email, password, otp } = req.body;

  try {
    if (!username || !email || !password || !otp) {
      return res.status(400).json({ message: "All fields (username, email, password, OTP) are required!" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const emailNormalized = email.toLowerCase().trim();
    const usernameNormalized = username.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    await connectClient();
    const db = client.db("githubClone");
    const usersCollection = db.collection("users");
    const otpsCollection = db.collection("otps");

    // Verify OTP record
    const storedOtpRecord = await otpsCollection.findOne({ email: emailNormalized });
    if (!storedOtpRecord) {
      return res.status(400).json({ message: "OTP not found or expired. Please request a new code." });
    }

    // Check if expired (10 minutes)
    const otpAge = new Date() - new Date(storedOtpRecord.createdAt);
    if (otpAge > 10 * 60 * 1000) {
      await otpsCollection.deleteMany({ email: emailNormalized });
      return res.status(400).json({ message: "OTP has expired. Please request a new code." });
    }

    if (storedOtpRecord.otp !== cleanOtp) {
      return res.status(400).json({ message: "Invalid verification code. Please enter the correct 6-digit OTP." });
    }

    // Double check uniqueness
    const userExists = await usersCollection.findOne({ username: usernameNormalized });
    if (userExists) {
      return res.status(400).json({ message: "Username already exists!" });
    }

    const emailExists = await usersCollection.findOne({ email: emailNormalized });
    if (emailExists) {
      return res.status(400).json({ message: "Email already in use!" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username: usernameNormalized,
      hashedPassword,
      email: emailNormalized,
      repository: [],
      followedUsers: [],
      starRepos: [],
    };

    const result = await usersCollection.insertOne(newUser);

    // Clean up OTP record
    await otpsCollection.deleteMany({ email: emailNormalized });

    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      success: true,
      message: "Account verified and registered successfully!",
      token,
      userId: result.insertedId,
    });
  } catch (error) {
    console.error("Error in verifyOtpAndSignup:", error);
    return res.status(500).json({ message: "Server error during registration", error: error.message });
  }
};

/**
 * Resends a new OTP code to user's email
 */
const resendOtp = async (req, res) => {
  const { email, username } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required!" });
    }

    const emailNormalized = email.toLowerCase().trim();

    await connectClient();
    const db = client.db("githubClone");
    const otpsCollection = db.collection("otps");

    // Check rate limit (prevent spamming resend within 30 seconds)
    const existingOtp = await otpsCollection.findOne({ email: emailNormalized });
    if (existingOtp) {
      const timeSinceLast = new Date() - new Date(existingOtp.createdAt);
      if (timeSinceLast < 30 * 1000) {
        const waitSec = Math.ceil((30000 - timeSinceLast) / 1000);
        return res.status(429).json({
          message: `Please wait ${waitSec} seconds before requesting a new code.`,
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await otpsCollection.deleteMany({ email: emailNormalized });
    await otpsCollection.insertOne({
      email: emailNormalized,
      otp,
      createdAt: new Date(),
    });

    await sendOtpEmail(emailNormalized, otp, username || "");

    return res.status(200).json({
      success: true,
      message: `A fresh verification code has been sent to ${emailNormalized}`,
    });
  } catch (error) {
    console.error("Error in resendOtp:", error);
    return res.status(500).json({
      message: "Failed to resend verification code.",
      error: error.message,
    });
  }
};

// Legacy signup method (preserved for backward compatibility if needed)
const signup = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    await connectClient();
    const db = client.db("githubClone");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const userByEmail = await usersCollection.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ message: "Email already in use!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      hashedPassword,
      email,
      repository: [],
      followedUsers: [],
      starRepos: [],
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" },
    );

    res.json({ token, userId: result.insertedId });
  } catch (e) {
    console.error("Error during signup : ", e);
    res.status(500).send("Server error");
  }
};

const singup = signup;

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    await connectClient();
    const db = client.db("githubClone");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.send({ token, userId: user._id });
  } catch (error) {
    console.error("Error during fetching login : ", error);
    res.status(500).send("Server error");
  }
};

const getUserProfile = async (req, res) => {
  const currrentId = req.params.id;
  try {
    await connectClient();
    const db = client.db("githubClone");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      _id: new ObjectId(currrentId),
    });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error during fetching profile : ", error);
    res.status(500).send("Server error");
  }
};

const getAllUsers = async (req, res) => {
  try {
    await connectClient();
    const db = client.db("githubClone");
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}).toArray();

    res.json(users);
  } catch (error) {
    console.error("Error during fetching users : ", error);
    res.status(500).send("Server error");
  }
};

const updateUserProfile = async (req, res) => {
  const currentId = req.params.id;
  const { email, password } = req.body;

  try {
    await connectClient();

    const db = client.db("githubClone");
    const usersCollection = db.collection("users");

    let updateFields = {};

    if (email) {
      updateFields.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.hashedPassword = hashedPassword;
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(currentId) },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    if (!result) {
      return res.status(404).json({ message: "User not found!" });
    }

    const { hashedPassword, ...safeUser } = result;

    res.json(safeUser);
  } catch (error) {
    console.error("Error during updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUserProfile = async (req, res) => {
  const currrentId = req.params.id;
  try {
    await connectClient();
    const db = client.db("githubClone");
    const usersCollection = db.collection("users");

    const result = await usersCollection.deleteOne({
      _id: new ObjectId(currrentId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error during deletion : ", error);
    res.status(500).send("Server error");
  }
};

export {
  sendOtp,
  verifyOtpAndSignup,
  resendOtp,
  getAllUsers,
  signup,
  singup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
