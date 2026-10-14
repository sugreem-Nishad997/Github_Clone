import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { repoApi } from "../api/client";
import {
  Compass,
  Search,
  GitBranch,
  Star,
  Globe,
  Clock,
  BookOpen,
} from "lucide-react";

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  useEffect(() => {
    const fetchAllRepos = async () => {
      setLoading(true);
      try {
        const res = await repoApi.getAll();
        setRepos(res.data.repositories || []);
      } catch (err) {
        console.error("Failed to fetch public repos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRepos();
  }, []);

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch && r.visibility === true;
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(searchTerm ? { q: searchTerm } : {});
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
      {/* Header */}
      <div className="border-b border-gh-border pb-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gh-accent/15 border border-gh-accent/30 flex items-center justify-center text-gh-accent">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gh-heading tracking-tight">
              Explore Public Repositories
            </h1>
            <p className="text-xs text-gh-muted mt-0.5">
              Discover repositories and projects hosted on ApnaGit
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gh-muted" />
            <input
              type="text"
              placeholder="Search by repository name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gh-surface border border-gh-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all"
            />
          </div>
        </form>
      </div>

      {/* Repos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gh-surface border border-gh-border rounded-xl p-5 h-32 animate-pulse"></div>
          ))}
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="bg-gh-surface border border-gh-border rounded-xl p-16 text-center text-gh-muted">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <h3 className="font-semibold text-gh-heading text-sm mb-1">No repositories found</h3>
          <p className="text-xs">Try searching for a different keyword or create a new public repository.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRepos.map((repo) => (
            <div
              key={repo._id}
              className="bg-gh-surface border border-gh-border rounded-xl p-5 hover:border-gh-muted transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Link
                    to={`/repo/${repo._id}`}
                    className="font-bold text-sm text-gh-accent hover:underline flex items-center gap-1.5 truncate"
                  >
                    <GitBranch className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {repo.owner?.username || "user"} / {repo.name}
                    </span>
                  </Link>

                  <span className="text-[10px] bg-gh-subtle border border-gh-border px-2 py-0.5 rounded-full text-gh-muted flex-shrink-0">
                    Public
                  </span>
                </div>

                <p className="text-xs text-gh-muted line-clamp-2 mb-4">
                  {repo.description || "No description provided."}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-gh-muted pt-3 border-t border-gh-border">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500" /> 0
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Recent
                  </span>
                </div>

                <Link
                  to={`/repo/${repo._id}`}
                  className="bg-gh-subtle hover:bg-gh-border text-gh-heading text-xs font-semibold px-3 py-1 rounded border border-gh-border transition-colors"
                >
                  Explore &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
