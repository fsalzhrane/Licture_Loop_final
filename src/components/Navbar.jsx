import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { BookOpen } from "lucide-react";

const Navbar = ({ session }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center text-primary-600 font-bold text-xl"
          >
            <BookOpen className="mr-2" size={24} />
            LectureLoop
          </Link>

          <div>
            {session ? (
              <div className="flex space-x-4 items-center">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-primary-600"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex space-x-4 items-center">
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
