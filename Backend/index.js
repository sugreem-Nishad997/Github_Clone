#!/usr/bin/env node

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

import { initRepo, setRemoteRepo } from "./controllers/init.js";
import { addRepo } from "./controllers/add.js";
import { commitRepo } from "./controllers/commit.js";
import { pushRepo } from "./controllers/push.js";
import { pullRepo } from "./controllers/pull.js";
import { revertRepo } from "./controllers/revert.js";
import { loginCli, logoutCli, whoamiCli } from "./controllers/loginCli.js";

dotenv.config();

yargs(hideBin(process.argv))
  .command(
    "login",
    "Log in to your ApnaGit account",
    (yargs) => {
      yargs
        .option("email", { type: "string", describe: "User email" })
        .option("password", { type: "string", describe: "User password" })
        .option("server", { type: "string", describe: "Backend server URL (default: http://localhost:3000)" });
    },
    (argv) => {
      loginCli(argv);
    },
  )
  .command("logout", "Log out of your ApnaGit account", {}, logoutCli)
  .command("whoami", "Check current logged-in ApnaGit account", {}, whoamiCli)
  .command(
    "init [name]",
    "Initialize a new local ApnaGit repository",
    (yargs) => {
      yargs.positional("name", {
        describe: "Repository name (optional, defaults to current directory name)",
        type: "string",
      });
    },
    (argv) => {
      initRepo(argv.name);
    },
  )
  .command(
    "remote <name>",
    "Link local folder to a remote repository name",
    (yargs) => {
      yargs.positional("name", {
        describe: "Remote repository name",
        type: "string",
      });
    },
    (argv) => {
      setRemoteRepo(argv.name);
    },
  )
  .command("start", "Start the GitHub Clone REST & WebSocket server", {}, startServer)
  .command(
    "add <file>",
    "Add a file to the Repository staging area",
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
    "Commit the staged files",
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
  .command("push", "Push commits to AWS S3 remote & sync with web frontend", {}, pushRepo)
  .command("pull", "Pull commits from AWS S3 remote", {}, pullRepo)
  .command(
    "revert <commitID>",
    "Revert to a specific commit ID",
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
  .demandCommand(1, "You need at least one command")
  .help().argv;

function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(bodyParser.json());
  app.use(express.json());

  const mongoURL = process.env.MONGODB_URL;

  mongoose
    .connect(mongoURL, { dbName: "githubClone" })
    .then(() => console.log("Mongodb connected to githubClone database"))
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
      const user = userID;
      console.log("====");
      console.log(user);
      console.log("====");
      socket.join(userID);
    });
  });

  const db = mongoose.connection;

  db.once("open", async () => {
    console.log("CRUD operations called");
  });

  httpServer.listen(port, () => {
    console.log(`Server is listening at port ${port}`);
  });
}
