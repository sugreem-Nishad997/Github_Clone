import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient, ReturnDocument } from "mongodb";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";

dotenv.config();

const url = process.env.MONGODB_URL;

let client;

async function connectClient() {
  if (!client) {
    client = new MongoClient(url);

    await client.connect();
  }
}

const singup = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    await connectClient();
    const db = client.db("githubClone");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "User already exists!" });
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
      { id: result.insertId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" },
    );

    res.json({ token });
  } catch (e) {
    console.error("Error during signup : ", e);
    res.status(500).send("Server error");
  }
};

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
      expiresIn: "1h",
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

    // Update email only if provided
    if (email) {
      updateFields.email = email;
    }

    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.hashedPassword = hashedPassword;
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(currentId) },
      { $set: updateFields },
      { returnDocument: "after" }, // return updated document
    );

    if (!result) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Remove password before sending response
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

    if (result.deleteCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error during deletion : ", error);
    res.status(500).send("Server error");
  }
};

export {
  getAllUsers,
  singup,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
