import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  GitBranch,
  Search,
  Plus,
  Compass,
  LogOut,
  User,
  Menu,
  X,
  BookOpen,
} from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="bg-gh-surface border-b border-gh-border sticky top-0 z-50 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 text-gh-heading font-bold text-lg hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-gh-accent/20 border border-gh-accent/40 flex items-center justify-center text-gh-accent">
              <GitBranch className="w-5 h-5" />
            </div>
            <span className="tracking-tight">ApnaGit</span>
          </Link>

          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link
              to="/explore"
              className="flex items-center gap-1.5 text-gh-text hover:text-gh-heading transition-colors"
            >
              <Compass className="w-4 h-4 text-gh-muted" />
              Explore
            </Link>
          </div>
        </div>

        {/* Middle: Search Bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gh-muted" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gh-bg border border-gh-border rounded-md pl-9 pr-4 py-1.5 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all"
            />
          </div>
        </form>

        {/* Right: Actions / Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* New Repo Button */}
              <Link
                to="/new"
                className="flex items-center gap-1.5 bg-gh-subtle hover:bg-gh-border text-gh-heading text-xs font-semibold px-3 py-1.5 rounded-md border border-gh-border transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New</span>
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none rounded-full ring-2 ring-transparent hover:ring-gh-accent/50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gh-accent/30 border border-gh-border flex items-center justify-center text-gh-heading font-semibold text-xs">
                    {user?.username ? user.username.slice(0, 2).toUpperCase() : "U"}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-gh-surface border border-gh-border rounded-lg shadow-2xl py-1 z-50 text-sm"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-gh-border">
                      <p className="text-xs text-gh-muted">Signed in as</p>
                      <p className="font-semibold text-gh-heading truncate">
                        {user?.username || "User"}
                      </p>
                    </div>

                    <Link
                      to={`/user/${user?._id || user?.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-gh-text hover:bg-gh-subtle hover:text-gh-heading transition-colors"
                    >
                      <User className="w-4 h-4 text-gh-muted" />
                      Your Profile
                    </Link>

                    <Link
                      to="/repositories"
                      className="flex items-center gap-2 px-4 py-2 text-gh-text hover:bg-gh-subtle hover:text-gh-heading transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-gh-muted" />
                      Your Repositories
                    </Link>

                    <div className="border-t border-gh-border mt-1"></div>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-gh-danger hover:bg-gh-danger/10 text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-gh-heading hover:text-gh-accent px-3 py-1.5 rounded-md transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="text-xs font-semibold bg-gh-success hover:bg-gh-successHover text-white px-3 py-1.5 rounded-md border border-gh-border transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gh-muted hover:text-gh-heading p-1"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Search & Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3 pb-2 border-t border-gh-border mt-2 space-y-3">
          <form onSubmit={handleSearch} className="px-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gh-muted" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gh-bg border border-gh-border rounded-md pl-9 pr-4 py-1.5 text-sm text-gh-heading placeholder-gh-muted focus:outline-none"
              />
            </div>
          </form>
          <div className="flex flex-col gap-1 px-1">
            <Link
              to="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm text-gh-text hover:bg-gh-subtle rounded-md"
            >
              Explore Public Repos
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/repositories"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-gh-text hover:bg-gh-subtle rounded-md"
                >
                  Your Repositories
                </Link>
                <Link
                  to="/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-gh-accent font-medium hover:bg-gh-subtle rounded-md"
                >
                  + Create New Repository
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
