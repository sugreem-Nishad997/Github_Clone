import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { repoApi } from "../api/client";
import { BookOpen, Lock, Globe, AlertCircle } from "lucide-react";

const CreateRepo = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true); // true = public, false = private
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim().toLowerCase().replace(/[^a-z0-9-_.]/g, "-");
    if (!trimmedName) {
      setError("Please provide a valid repository name.");
      return;
    }

    setLoading(true);

    try {
      const res = await repoApi.create({
        owner: user?._id || user?.id,
        name: trimmedName,
        description: description.trim(),
        visibility,
        content: [],
        issues: [],
      });

      const repoId = res.data.repositoryID || res.data.repository?._id;
      navigate(`/repo/${repoId}`);
    } catch (err) {
      console.error("Failed to create repo:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to create repository"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="border-b border-gh-border pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gh-heading tracking-tight">
          Create a new repository
        </h1>
        <p className="text-xs text-gh-muted mt-1">
          A repository contains all project files, including the revision history.
        </p>
      </div>

      {error && (
        <div className="bg-gh-danger/10 border border-gh-danger/30 rounded-md p-3.5 text-xs text-gh-dangerHover flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Owner & Repo Name */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-gh-heading mb-1">
              Owner
            </label>
            <div className="bg-gh-surface border border-gh-border rounded-md px-3 py-2 text-sm text-gh-heading font-medium flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-gh-accent/30 flex items-center justify-center text-[10px]">
                {user?.username ? user.username.slice(0, 1).toUpperCase() : "U"}
              </span>
              <span>{user?.username || "user"}</span>
            </div>
          </div>

          <div className="hidden sm:block text-gh-muted text-xl pt-5">/</div>

          <div className="w-full flex-1">
            <label className="block text-xs font-semibold text-gh-heading mb-1">
              Repository name <span className="text-gh-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. awesome-project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-2 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all font-mono"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gh-heading mb-1">
            Description <span className="text-gh-muted font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="Short description of your project..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gh-bg border border-gh-border rounded-md px-3 py-2 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all"
          />
        </div>

        <div className="border-t border-gh-border pt-4"></div>

        {/* Visibility */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gh-heading">
            Repository Visibility
          </label>

          <label
            onClick={() => setVisibility(true)}
            className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
              visibility
                ? "bg-gh-accent/5 border-gh-accent/40"
                : "bg-gh-surface border-gh-border hover:border-gh-muted"
            }`}
          >
            <input
              type="radio"
              name="visibility"
              checked={visibility === true}
              onChange={() => setVisibility(true)}
              className="mt-1 text-gh-accent focus:ring-gh-accent"
            />
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gh-accent" />
                <span className="text-sm font-semibold text-gh-heading">Public</span>
              </div>
              <p className="text-xs text-gh-muted mt-0.5">
                Anyone on the internet can see this repository. You choose who can commit.
              </p>
            </div>
          </label>

          <label
            onClick={() => setVisibility(false)}
            className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
              !visibility
                ? "bg-gh-warning/5 border-gh-warning/40"
                : "bg-gh-surface border-gh-border hover:border-gh-muted"
            }`}
          >
            <input
              type="radio"
              name="visibility"
              checked={visibility === false}
              onChange={() => setVisibility(false)}
              className="mt-1 text-gh-warning focus:ring-gh-warning"
            />
            <div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gh-warning" />
                <span className="text-sm font-semibold text-gh-heading">Private</span>
              </div>
              <p className="text-xs text-gh-muted mt-0.5">
                You choose who can see and commit to this repository.
              </p>
            </div>
          </label>
        </div>

        <div className="border-t border-gh-border pt-4"></div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-gh-success hover:bg-gh-successHover text-white font-semibold text-xs px-5 py-2.5 rounded-md border border-gh-border transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                <span>Creating repository...</span>
              </>
            ) : (
              <span>Create repository</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRepo;
