import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import CourseModal from '../components/CourseModal';
import { Plus } from 'lucide-react';

const DashboardPage = ({ session }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [session]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error.message);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseAdded = (newCourse) => {
    setCourses([newCourse, ...courses]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar session={session} />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">My Courses</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="mr-1" size={18} />
            Create New Course
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-700 mb-2">You don't have any courses yet</h3>
            <p className="text-gray-500 mb-6">Create your first course to get started!</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
            >
              Create Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link 
                key={course.id} 
                to={`/course/${course.id}`}
                className="course-card hover:scale-[1.02] transition-transform"
              >
                <h2 className="text-xl font-semibold mb-1">{course.title}</h2>
                <p className="text-gray-500 mb-3">{course.description}</p>
                <p className="text-sm text-gray-600 mb-2">Professor: {course.professor}</p>
                
                <div className="flex items-center mt-4 text-sm text-gray-500">
                  <span>{course.note_count || 0} notes</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {isModalOpen && (
          <CourseModal
            session={session}
            onClose={() => setIsModalOpen(false)}
            onCourseAdded={handleCourseAdded}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default DashboardPage;