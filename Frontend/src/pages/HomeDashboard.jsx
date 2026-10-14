import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { repoApi } from "../api/client";
import {
  BookOpen,
  Plus,
  Search,
  Lock,
  Globe,
  Terminal,
  Clock,
  Sparkles,
  GitBranch,
  Star,
} from "lucide-react";

const HomeDashboard = () => {
  const { user } = useAuth();
  const [userRepos, setUserRepos] = useState([]);
  const [publicRepos, setPublicRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch user repos if logged in
        if (user && (user._id || user.id)) {
          const userRepoRes = await repoApi.getUserRepos(user._id || user.id);
          setUserRepos(userRepoRes.data.repositories || []);
        }

        // Fetch all public repos for feed
        const allRepoRes = await repoApi.getAll();
        setPublicRepos(
          (allRepoRes.data.repositories || []).filter(
            (repo) => repo.visibility === true
          )
        );
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const filteredUserRepos = userRepos.filter((repo) =>
    repo.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: User Repositories */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gh-surface border border-gh-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gh-heading text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gh-accent" />
                Top Repositories
              </h2>
              <Link
                to="/new"
                className="flex items-center gap-1 bg-gh-success hover:bg-gh-successHover text-white text-xs font-semibold px-2.5 py-1 rounded-md transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </Link>
            </div>

            {/* Filter input */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gh-muted" />
              <input
                type="text"
                placeholder="Find a repository..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-gh-bg border border-gh-border rounded-md pl-8 pr-3 py-1.5 text-xs text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent"
              />
            </div>

            {/* List */}
            {loading ? (
              <div className="space-y-2 py-4">
                <div className="h-4 bg-gh-subtle rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gh-subtle rounded animate-pulse w-1/2"></div>
                <div className="h-4 bg-gh-subtle rounded animate-pulse w-2/3"></div>
              </div>
            ) : filteredUserRepos.length === 0 ? (
              <div className="text-center py-6 text-xs text-gh-muted">
                <p>No repositories found.</p>
                <Link
                  to="/new"
                  className="text-gh-accent hover:underline mt-1.5 inline-block font-semibold"
                >
                  Create your first repository
                </Link>
              </div>
            ) : (
              <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                {filteredUserRepos.map((repo) => (
                  <Link
                    key={repo._id}
                    to={`/repo/${repo._id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gh-subtle/70 transition-colors group text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-5 h-5 rounded-full bg-gh-accent/20 flex items-center justify-center text-gh-accent flex-shrink-0">
                        <GitBranch className="w-3 h-3" />
                      </div>
                      <span className="font-medium text-gh-heading group-hover:text-gh-accent truncate">
                        {repo.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {repo.visibility ? (
                        <span className="text-[10px] bg-gh-subtle border border-gh-border px-1.5 py-0.5 rounded text-gh-muted">
                          Public
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gh-warning/10 text-gh-warning border border-gh-warning/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Private
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick CLI Reference Box */}
          <div className="bg-gh-surface border border-gh-border rounded-xl p-4 text-xs">
            <h3 className="font-semibold text-gh-heading flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-gh-purple" />
              CLI Quick Commands
            </h3>
            <p className="text-gh-muted mb-3 text-[11px]">
              Use our custom version control tool locally in any terminal:
            </p>
            <div className="bg-gh-bg border border-gh-border rounded p-2.5 font-mono text-[11px] space-y-1 text-gh-text">
              <div><span className="text-gh-accent">$</span> apnagit init</div>
              <div><span className="text-gh-accent">$</span> apnagit add &lt;file&gt;</div>
              <div><span className="text-gh-accent">$</span> apnagit commit "msg"</div>
              <div><span className="text-gh-accent">$</span> apnagit push</div>
            </div>
          </div>
        </div>

        {/* Center/Right: Activity Feed & Public Repositories */}
        <div className="lg:col-span-8 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-gh-surface via-gh-surface to-gh-subtle border border-gh-border rounded-xl p-6 relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-gh-accent/10 border border-gh-accent/30 text-gh-accent px-2.5 py-1 rounded-full text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Version Control</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gh-heading mb-2">
                Welcome back, {user?.username || "Developer"}!
              </h1>
              <p className="text-gh-muted text-xs sm:text-sm leading-relaxed mb-4">
                Manage your code repositories, stage and commit changes locally with the ApnaGit CLI, and collaborate with issues in real time.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  to="/new"
                  className="bg-gh-success hover:bg-gh-successHover text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Create Repository
                </Link>
                <Link
                  to="/explore"
                  className="bg-gh-subtle hover:bg-gh-border text-gh-heading text-xs font-semibold px-4 py-2 rounded-md border border-gh-border transition-colors inline-flex items-center gap-1.5"
                >
                  <Globe className="w-4 h-4" /> Explore Public Projects
                </Link>
              </div>
            </div>
          </div>

          {/* Explore Feed */}
          <div className="bg-gh-surface border border-gh-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gh-border">
              <h2 className="font-semibold text-gh-heading text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-gh-accent" />
                Community & Public Repositories
              </h2>
              <Link
                to="/explore"
                className="text-xs text-gh-accent hover:underline font-semibold"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4 py-4">
                <div className="h-16 bg-gh-subtle rounded animate-pulse"></div>
                <div className="h-16 bg-gh-subtle rounded animate-pulse"></div>
              </div>
            ) : publicRepos.length === 0 ? (
              <div className="text-center py-8 text-xs text-gh-muted">
                No public repositories available yet.
              </div>
            ) : (
              <div className="space-y-3">
                {publicRepos.slice(0, 5).map((repo) => (
                  <div
                    key={repo._id}
                    className="p-4 bg-gh-bg border border-gh-border rounded-lg hover:border-gh-muted transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/repo/${repo._id}`}
                          className="font-semibold text-sm text-gh-accent hover:underline"
                        >
                          {repo.owner?.username || "user"} / {repo.name}
                        </Link>
                        {repo.visibility === true && (
                          <span className="text-[10px] bg-gh-subtle border border-gh-border px-1.5 py-0.5 rounded text-gh-muted">
                            Public
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gh-muted line-clamp-2">
                        {repo.description || "No description provided."}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gh-muted pt-1">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" /> 0 stars
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Updated recently
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/repo/${repo._id}`}
                      className="text-xs bg-gh-subtle hover:bg-gh-border text-gh-text hover:text-gh-heading px-3 py-1.5 rounded border border-gh-border transition-colors flex-shrink-0"
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
    </div>
  );
};

export default HomeDashboard;
