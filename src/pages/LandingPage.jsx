import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FileText, Share2, FolderOpen } from 'lucide-react';

const LandingPage = ({ session }) => {
  // If user is already logged in, redirect to dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar session={session} />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Share and discover lecture notes<br/>with your classmates
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-gray-600">
              LectureLoop makes it easy to collaborate, share notes, and never miss important
              information from your classes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup" className="btn-primary text-lg px-8 py-3">
                Get Started
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="feature-card">
                <div className="text-primary-600 mb-4">
                  <FileText size={48} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Note Taking</h3>
                <p className="text-gray-600">
                  Create and organize your lecture notes with our intuitive interface.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="text-primary-600 mb-4">
                  <Share2 size={48} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Collaborate</h3>
                <p className="text-gray-600">
                  Share notes with classmates and work together to improve understanding.
                </p>
              </div>
              
              <div className="feature-card">
                <div className="text-primary-600 mb-4">
                  <FolderOpen size={48} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Stay Organized</h3>
                <p className="text-gray-600">
                  Keep all your course materials in one place, easily accessible.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;