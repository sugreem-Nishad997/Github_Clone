import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi, repoApi } from "../api/client";
import {
  User,
  Mail,
  BookOpen,
  GitBranch,
  Lock,
  Globe,
  Edit3,
  Calendar,
  Check,
} from "lucide-react";

const UserProfile = () => {
  const { id } = useParams();
  const { user: authUser, refreshUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [userRepos, setUserRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updateMsg, setUpdateMsg] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profileId = id || authUser?._id || authUser?.id;
        if (!profileId) return;

        const res = await authApi.getUserProfile(profileId);
        setProfileUser(res.data);
        setNewEmail(res.data.email || "");

        // Fetch user's repos
        const reposRes = await repoApi.getUserRepos(profileId);
        setUserRepos(reposRes.data.repositories || []);
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, authUser]);

  const isCurrentAuthUser =
    authUser && profileUser && (authUser._id === profileUser._id || authUser.id === profileUser._id);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateMsg(null);
    try {
      const payload = {};
      if (newEmail) payload.email = newEmail;
      if (newPassword) payload.password = newPassword;

      await authApi.updateUserProfile(profileUser._id, payload);
      setUpdateMsg("Profile updated successfully!");
      setIsEditing(false);
      refreshUser();
    } catch (err) {
      console.error("Update failed:", err);
      setUpdateMsg("Failed to update profile.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gh-accent mb-3"></div>
        <p className="text-xs text-gh-muted">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: User Card */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-gh-surface border border-gh-border rounded-xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gh-accent/20 border-2 border-gh-accent/40 flex items-center justify-center text-gh-accent font-bold text-2xl mb-4 shadow-inner">
                {profileUser?.username ? profileUser.username.slice(0, 2).toUpperCase() : "U"}
              </div>

              <h1 className="text-xl font-bold text-gh-heading">
                {profileUser?.username || "User"}
              </h1>
              <p className="text-xs text-gh-muted mt-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {profileUser?.email || "No email available"}
              </p>
            </div>

            <div className="border-t border-gh-border my-5"></div>

            <div className="space-y-2 text-xs text-gh-muted">
              <div className="flex items-center justify-between">
                <span>Repositories</span>
                <span className="font-semibold text-gh-heading">{userRepos.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Stars</span>
                <span className="font-semibold text-gh-heading">0</span>
              </div>
            </div>

            {isCurrentAuthUser && (
              <div className="mt-6">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full bg-gh-subtle hover:bg-gh-border text-gh-heading text-xs font-semibold py-2 px-3 rounded-md border border-gh-border transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? "Cancel Edit" : "Edit Profile"}
                </button>
              </div>
            )}
          </div>

          {/* Edit form */}
          {isEditing && (
            <div className="bg-gh-surface border border-gh-border rounded-xl p-5 shadow-sm animate-in fade-in">
              <h3 className="text-sm font-semibold text-gh-heading mb-3">Edit Details</h3>
              {updateMsg && (
                <p className="text-xs text-gh-success mb-3 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {updateMsg}
                </p>
              )}
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gh-heading mb-1">
                    New Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-gh-bg border border-gh-border rounded px-3 py-1.5 text-xs text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gh-heading mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep same"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gh-bg border border-gh-border rounded px-3 py-1.5 text-xs text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gh-success hover:bg-gh-successHover text-white text-xs font-semibold py-1.5 rounded transition-colors"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right: Repositories List */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gh-border">
            <h2 className="text-base font-bold text-gh-heading flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gh-accent" />
              Repositories ({userRepos.length})
            </h2>

            {isCurrentAuthUser && (
              <Link
                to="/new"
                className="bg-gh-success hover:bg-gh-successHover text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
              >
                + New Repository
              </Link>
            )}
          </div>

          {userRepos.length === 0 ? (
            <div className="bg-gh-surface border border-gh-border rounded-xl p-12 text-center text-xs text-gh-muted">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-gh-heading">No repositories found</p>
              <p className="mt-1">This user hasn't created any repositories yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {userRepos.map((repo) => (
                <div
                  key={repo._id}
                  className="bg-gh-surface border border-gh-border rounded-xl p-4 hover:border-gh-muted transition-colors flex items-start justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/repo/${repo._id}`}
                        className="font-semibold text-sm text-gh-accent hover:underline flex items-center gap-1.5"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        {repo.name}
                      </Link>
                      <span className="text-[10px] bg-gh-subtle border border-gh-border px-1.5 py-0.5 rounded text-gh-muted">
                        {repo.visibility ? "Public" : "Private"}
                      </span>
                    </div>

                    <p className="text-xs text-gh-muted">
                      {repo.description || "No description provided."}
                    </p>
                  </div>

                  <Link
                    to={`/repo/${repo._id}`}
                    className="text-xs bg-gh-subtle hover:bg-gh-border text-gh-heading px-3 py-1.5 rounded border border-gh-border transition-colors flex-shrink-0"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
