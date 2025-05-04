import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import CourseDetailPage from "./pages/CourseDetailPage";

// Components
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!session) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage session={session} />} />
      <Route path="/login" element={<LoginPage session={session} />} />
      <Route path="/signup" element={<SignupPage session={session} />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage session={session} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/course/:id"
        element={
          <ProtectedRoute>
            <CourseDetailPage session={session} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
