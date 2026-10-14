import express from "express";
import {
  createRepository,
  deleteRepoByID,
  fetchRepositoryByID,
  fetchRepositoryByName,
  fetchRepositoryForCurrentUser,
  getAllRepositories,
  toggleVisibilityByID,
  updateRepositoryByID,
  syncPushData,
  fetchRepositoryForSync,
  fetchFileContent,
} from "../controllers/repoControllers.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const repoRouter = express.Router();

repoRouter.post("/repo/create", createRepository);
repoRouter.post("/repo/sync-push", authMiddleware, syncPushData);
repoRouter.get("/repo/sync-pull/:name", authMiddleware, fetchRepositoryForSync);
repoRouter.get("/repo/all", getAllRepositories);
repoRouter.get("/repo/:id", fetchRepositoryByID);
repoRouter.get("/repo/:id/file/*fileName", fetchFileContent);
repoRouter.get("/repo/:id/file/:fileName", fetchFileContent);
repoRouter.get("/repo/name/:name", fetchRepositoryByName);
repoRouter.get("/repo/user/:userID", authMiddleware, fetchRepositoryForCurrentUser);
repoRouter.put("/repo/update/:id", authMiddleware, updateRepositoryByID);
repoRouter.delete("/repo/delete/:id", authMiddleware, deleteRepoByID);
repoRouter.patch("/repo/toggle/:id", authMiddleware, toggleVisibilityByID);

export default repoRouter;
