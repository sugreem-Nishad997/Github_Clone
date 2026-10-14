import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import HomeDashboard from "./pages/HomeDashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreateRepo from "./pages/CreateRepo";
import RepositoryDetail from "./pages/RepositoryDetail";
import IssueDetail from "./pages/IssueDetail";
import UserProfile from "./pages/UserProfile";
import Explore from "./pages/Explore";
import YourRepositories from "./pages/YourRepositories";

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gh-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gh-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gh-bg text-gh-text selection:bg-gh-accent/30 selection:text-white">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public or Home */}
          <Route
            path="/"
            element={isAuthenticated ? <HomeDashboard /> : <Navigate to="/explore" replace />}
          />

          {/* Auth */}
          <Route
            path="/login"
            element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />}
          />
          <Route
            path="/signup"
            element={!isAuthenticated ? <Signup /> : <Navigate to="/" replace />}
          />

          {/* Public Explore */}
          <Route path="/explore" element={<Explore />} />

          {/* Public / Semi-public Repo Viewer */}
          <Route path="/repo/:id" element={<RepositoryDetail />} />
          <Route path="/repo/:repoId/issues/:issueId" element={<IssueDetail />} />
          <Route path="/user/:id" element={<UserProfile />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/new" element={<CreateRepo />} />
            <Route path="/repositories" element={<YourRepositories />} />
            <Route path="/user/repositories" element={<Navigate to="/repositories" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-gh-border mt-auto py-6 text-center text-xs text-gh-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} ApnaGit. Built with React & Node.js</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-gh-heading">Docs</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-gh-heading">API</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-gh-heading">CLI VCS</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
