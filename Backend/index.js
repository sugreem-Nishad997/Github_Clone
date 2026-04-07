import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import http from "http";
import { Server } from "socket.io";
import mainRouter from "./routes/main.router.js";

import yargs from "yargs";

import { hideBin } from "yargs/helpers";
import { initRepo } from "./controllers/init.js";
import { addRepo } from "./controllers/add.js";
import { commitRepo } from "./controllers/commit.js";
import { pushRepo } from "./controllers/push.js";
import { pullRepo } from "./controllers/pull.js";
import { revertRepo } from "./controllers/revert.js";

dotenv.config();

yargs(hideBin(process.argv))
  .command("init", "Initialise a new repository", {}, initRepo)
  .command("start", "Initialise a new repository", {}, startServer)
  .command(
    "add <file>",
    "Add a file to the Repository",
    (yargs) => {
      yargs.positional("file", {
        describe: "File to add to the staging area",
        type: "string",
      });
    },
    (argv) => {
      addRepo(argv.file);
    },
  )
  .command(
    "commit <message>",
    "Commit the Staged files",
    (yargs) => {
      yargs.positional("message", {
        describe: "Commit message",
        type: "string",
      });
    },
    (argv) => {
      commitRepo(argv.message);
    },
  )
  .command("push", "Push commits to S3", {}, pushRepo)
  .command("pull", "Pull commits to S3", {}, pullRepo)
  .command(
    "revert <commitID>",
    "Revet to a specific commit",
    (yargs) => {
      yargs.positional("commitID", {
        describe: "Commit ID to revert to",
        type: "string",
      });
    },
    (argv) => {
      revertRepo(argv.commitID);
    },
  )
  .demandCommand(1, "You need at leat one command")
  .help().argv;

function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(bodyParser.json());
  app.use(express.json());

  const mongoURL = process.env.MONGODB_URL;

  mongoose
    .connect(mongoURL)
    .then(() => console.log("Mongodb connected"))
    .catch((err) => console.error("Unable to connect", err));

  app.use(cors({ origin: "*" }));
  app.use("/", mainRouter);

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", (userID) => {
      user = userID;
      console.log("====");
      console.log(user);
      console.log("====");
      socket.join(userID);
    });
  });

  const db = mongoose.connection;

  db.once("open", async () => {
    console.log("CRUD operations called");
    //CRUD operations
  });
  httpServer.listen(port, () => {
    console.log(`Server is listening at port ${port}`);
  });
}
