import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GitBranch, AlertCircle, Lock, Mail } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    if (res.success) {
      navigate("/");
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gh-accent/10 border border-gh-accent/30 text-gh-accent mb-3">
            <GitBranch className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gh-heading tracking-tight">
            Sign in to ApnaGit
          </h1>
        </div>

        {/* Card */}
        <div className="bg-gh-surface border border-gh-border rounded-xl p-6 shadow-xl space-y-4">
          {error && (
            <div className="bg-gh-danger/10 border border-gh-danger/30 rounded-md p-3 text-xs text-gh-dangerHover flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gh-heading mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gh-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-gh-bg border border-gh-border rounded-md pl-9 pr-3 py-2 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gh-heading">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gh-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gh-bg border border-gh-border rounded-md pl-9 pr-3 py-2 text-sm text-gh-heading placeholder-gh-muted focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gh-success hover:bg-gh-successHover text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors border border-gh-border disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Signup Link */}
        <div className="bg-gh-surface/40 border border-gh-border rounded-lg p-4 text-center mt-4 text-xs text-gh-muted">
          New to ApnaGit?{" "}
          <Link to="/signup" className="text-gh-accent hover:underline font-semibold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
