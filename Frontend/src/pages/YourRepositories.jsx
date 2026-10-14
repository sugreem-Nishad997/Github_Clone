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
  GitBranch,
  GitCommit,
  CircleDot,
  Terminal,
  Calendar,
  Clock,
  Layers,
  ArrowUpDown,
  Filter,
} from "lucide-react";

const YourRepositories = () => {
  const { user } = useAuth();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // 'all', 'public', 'private'
  const [sortBy, setSortBy] = useState("updated"); // 'updated', 'name-asc', 'name-desc'

  useEffect(() => {
    const fetchUserRepositories = async () => {
      setLoading(true);
      try {
        const userId = user?._id || user?.id;
        if (userId) {
          const res = await repoApi.getUserRepos(userId);
          setRepos(res.data.repositories || []);
        }
      } catch (error) {
        console.error("Failed to load user repositories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRepositories();
  }, [user]);

  // Calculations for stats
  const totalCount = repos.length;
  const publicCount = repos.filter((r) => r.visibility).length;
  const privateCount = repos.filter((r) => !r.visibility).length;

  // Filter & Sort Repositories
  const filteredRepos = repos
    .filter((repo) => {
      const matchesSearch =
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesVisibility =
        visibilityFilter === "all"
          ? true
          : visibilityFilter === "public"
          ? repo.visibility === true
          : repo.visibility === false;

      return matchesSearch && matchesVisibility;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      // default: updated / newest
      return (b.commits?.length || 0) - (a.commits?.length || 0);
    });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gh-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gh-accent/20 border border-gh-accent/40 flex items-center justify-center text-gh-accent">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gh-heading tracking-tight">
                Your Repositories
              </h1>
              <p className="text-xs text-gh-muted mt-0.5">
                Manage and explore all code repositories owned by{" "}
                <span className="font-semibold text-gh-heading">
                  {user?.username || "you"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/new"
          className="bg-gh-success hover:bg-gh-successHover text-white text-xs font-semibold px-4 py-2 rounded-md border border-gh-border transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Repository</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-gh-surface border border-gh-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gh-muted">Total Repositories</span>
            <Layers className="w-4 h-4 text-gh-accent" />
          </div>
          <p className="text-2xl font-bold text-gh-heading mt-2">{totalCount}</p>
        </div>

        <div className="bg-gh-surface border border-gh-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gh-muted">Public Repositories</span>
            <Globe className="w-4 h-4 text-gh-success" />
          </div>
          <p className="text-2xl font-bold text-gh-heading mt-2">{publicCount}</p>
        </div>

        <div className="bg-gh-surface border border-gh-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gh-muted">Private Repositories</span>
            <Lock className="w-4 h-4 text-gh-warning" />
          </div>
          <p className="text-2xl font-bold text-gh-heading mt-2">{privateCount}</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-gh-surface border border-gh-border rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gh-muted" />
          <input
            type="text"
            placeholder="Find a repository by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gh-bg border border-gh-border rounded-md pl-9 pr-4 py-2 text-xs text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visibility Filter Pills */}
          <div className="flex items-center bg-gh-bg border border-gh-border p-1 rounded-lg text-xs">
            <button
              onClick={() => setVisibilityFilter("all")}
              className={`px-3 py-1 rounded-md transition-colors ${
                visibilityFilter === "all"
                  ? "bg-gh-subtle text-gh-heading font-semibold"
                  : "text-gh-muted hover:text-gh-heading"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setVisibilityFilter("public")}
              className={`px-3 py-1 rounded-md transition-colors ${
                visibilityFilter === "public"
                  ? "bg-gh-subtle text-gh-heading font-semibold"
                  : "text-gh-muted hover:text-gh-heading"
              }`}
            >
              Public ({publicCount})
            </button>
            <button
              onClick={() => setVisibilityFilter("private")}
              className={`px-3 py-1 rounded-md transition-colors ${
                visibilityFilter === "private"
                  ? "bg-gh-subtle text-gh-heading font-semibold"
                  : "text-gh-muted hover:text-gh-heading"
              }`}
            >
              Private ({privateCount})
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gh-bg border border-gh-border rounded-lg px-3 py-2 text-xs text-gh-heading focus:outline-none focus:border-gh-accent cursor-pointer"
          >
            <option value="updated">Sort by: Recently Updated</option>
            <option value="name-asc">Sort by: Name (A to Z)</option>
            <option value="name-desc">Sort by: Name (Z to A)</option>
          </select>
        </div>
      </div>

      {/* Repositories List */}
      {loading ? (
        <div className="space-y-3 py-10">
          <div className="h-20 bg-gh-surface border border-gh-border rounded-xl animate-pulse"></div>
          <div className="h-20 bg-gh-surface border border-gh-border rounded-xl animate-pulse"></div>
          <div className="h-20 bg-gh-surface border border-gh-border rounded-xl animate-pulse"></div>
        </div>
      ) : repos.length === 0 ? (
        /* Empty State (0 Repos) */
        <div className="bg-gh-surface border border-gh-border rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gh-accent/10 border border-gh-accent/30 text-gh-accent flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-gh-heading mb-1">
            You don't have any repositories yet
          </h2>
          <p className="text-xs text-gh-muted max-w-md mx-auto mb-6">
            Create your first repository on ApnaGit to start staging and pushing code snapshots via the CLI or web.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/new"
              className="bg-gh-success hover:bg-gh-successHover text-white text-xs font-semibold px-5 py-2.5 rounded-md border border-gh-border transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create a Repository</span>
            </Link>
            <Link
              to="/explore"
              className="bg-gh-subtle hover:bg-gh-border text-gh-heading text-xs font-semibold px-5 py-2.5 rounded-md border border-gh-border transition-colors flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>Explore Public Projects</span>
            </Link>
          </div>
        </div>
      ) : filteredRepos.length === 0 ? (
        /* Filter Empty State */
        <div className="bg-gh-surface border border-gh-border rounded-xl p-10 text-center text-xs text-gh-muted shadow-sm">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-gh-heading text-sm">No repositories match your filter</p>
          <p className="mt-1">Try changing your search query or visibility filter.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setVisibilityFilter("all");
            }}
            className="mt-3 text-gh-accent hover:underline font-semibold"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        /* Repositories Cards */
        <div className="divide-y divide-gh-border bg-gh-surface border border-gh-border rounded-xl overflow-hidden shadow-sm">
          {filteredRepos.map((repo) => (
            <div
              key={repo._id}
              className="p-5 hover:bg-gh-subtle/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-7 h-7 rounded-full bg-gh-accent/15 flex items-center justify-center text-gh-accent flex-shrink-0">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <Link
                    to={`/repo/${repo._id}`}
                    className="font-bold text-base text-gh-accent hover:underline truncate"
                  >
                    {repo.name}
                  </Link>

                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      repo.visibility
                        ? "bg-gh-subtle border-gh-border text-gh-muted"
                        : "bg-gh-warning/10 border-gh-warning/30 text-gh-warning"
                    }`}
                  >
                    {repo.visibility ? (
                      <>
                        <Globe className="w-3 h-3" /> Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" /> Private
                      </>
                    )}
                  </span>
                </div>

                {repo.description ? (
                  <p className="text-xs text-gh-text line-clamp-2 max-w-2xl pl-9">
                    {repo.description}
                  </p>
                ) : (
                  <p className="text-xs text-gh-muted italic pl-9">No description provided</p>
                )}

                {/* Metadata Pills */}
                <div className="flex items-center gap-4 text-xs text-gh-muted pt-1 pl-9 flex-wrap">
                  <span className="flex items-center gap-1">
                    <GitCommit className="w-3.5 h-3.5 text-gh-accent" />
                    <span>{repo.commits?.length || 0} commit{repo.commits?.length !== 1 ? "s" : ""}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-yellow-500" />
                    <span>{repo.content?.length || 0} file{repo.content?.length !== 1 ? "s" : ""}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <CircleDot className="w-3.5 h-3.5 text-gh-success" />
                    <span>{repo.issues?.length || 0} issue{repo.issues?.length !== 1 ? "s" : ""}</span>
                  </span>

                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>Updated recently</span>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 pl-9 sm:pl-0 flex-shrink-0">
                <Link
                  to={`/repo/${repo._id}`}
                  className="bg-gh-subtle hover:bg-gh-border text-gh-heading text-xs font-semibold px-3.5 py-1.5 rounded-md border border-gh-border transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <span>View Repository</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YourRepositories;
