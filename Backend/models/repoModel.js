import mongoose from "mongoose";
import { Schema } from "mongoose";

const RepositorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  content: [
    {
      type: String,
    },
  ],
  visibility: {
    type: Boolean,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  issues: [
    {
      type: Schema.Types.ObjectId,
      ref: "Issue",
    },
  ],
  commits: [
    {
      commitID: {
        type: String,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      author: {
        type: String,
        default: "User",
      },
      date: {
        type: Date,
        default: Date.now,
      },
      files: [
        {
          type: String,
        },
      ],
    },
  ],
});

const Repository = mongoose.model("Repository", RepositorySchema);

export default Repository;
