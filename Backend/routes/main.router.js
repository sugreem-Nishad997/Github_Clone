import express from "express";

import userRouter from "./user.router.js";
import repoRouter from "./repo.routes.js";
import issueRouter from "./issue.routes.js";

const mainRouter = express.Router();

mainRouter.use(userRouter);
mainRouter.use(repoRouter);
mainRouter.use(issueRouter);

mainRouter.get("/", (req, res) => {
  res.send("Welcome");
});

export default mainRouter;
