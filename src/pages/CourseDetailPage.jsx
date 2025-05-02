import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadFile, getFileType } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import NoteUploadModal from '../components/NoteUploadModal';
import NoteCard from '../components/NoteCard';
import { Upload, Trash2, AlertTriangle, Loader2 as SpinnerIcon } from 'lucide-react';

const CourseDetailPage = ({ session }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isDeleteNoteConfirmOpen, setIsDeleteNoteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [noteDeleteLoading, setNoteDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [id, session]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
        .single();

      if (courseError) {
        throw courseError;
      }

      if (!courseData) {
        navigate('/dashboard');
        return;
      }

      setCourse(courseData);

      // Fetch notes for this course
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('course_id', id)
        .order('created_at', { ascending: false });

      if (notesError) {
        throw notesError;
      }

      setNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching course details:', error.message);
      setError('Failed to load course details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteAdded = (newNote) => {
    setNotes([newNote, ...notes]);
  };

  const handleDeleteNoteRequest = (note) => {
    setNoteToDelete(note);
    setDeleteError(null);
    setIsDeleteNoteConfirmOpen(true);
  };

  const cancelDeleteNote = () => {
    setIsDeleteNoteConfirmOpen(false);
    setNoteToDelete(null);
    setDeleteError(null);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;

    setNoteDeleteLoading(true);
    setDeleteError(null);

    try {
      // 1. Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('notes')
        .remove([noteToDelete.file_path]);

      // Log storage error but proceed to delete DB record anyway
      if (storageError) {
        console.error('Storage deletion error (proceeding anyway):', storageError.message);
      }

      // 2. Delete note from database
      const { error: dbError } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteToDelete.id);

      if (dbError) {
        throw new Error('Failed to delete note from database.');
      }

      // 3. Decrement course note count (optional, requires RPC function)
      try {
        const { error: rpcError } = await supabase.rpc('decrement_note_count', { course_id: id });
        if (rpcError) console.error('RPC decrement_note_count error:', rpcError.message);
      } catch (rpcError) {
        console.error('RPC decrement_note_count failed:', rpcError);
      }

      // 4. Update UI state
      setNotes(notes.filter(n => n.id !== noteToDelete.id));

      // 5. Close modal
      cancelDeleteNote();

    } catch (error) {
      console.error('Error deleting note:', error.message);
      setDeleteError(error.message || 'Could not delete note. Please try again.');
    } finally {
      setNoteDeleteLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      setDeleteLoading(true);

      // First delete all notes related to this course
      const { error: notesError } = await supabase
        .from('notes')
        .delete()
        .eq('course_id', id);

      if (notesError) {
        throw notesError;
      }

      // Then delete the course itself
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (courseError) {
        throw courseError;
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting course:', error.message);
      setError('Failed to delete course. Please try again.');
    } finally {
      setDeleteLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar session={session} />
        <main className="flex-grow">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar session={session} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar session={session} />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{course.title}</h1>
            <p className="text-gray-600">Professor: {course.professor}</p>
          </div>
          
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary flex items-center"
            >
              <Upload className="mr-1" size={18} />
              Upload New Note
            </button>
            
            <button 
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="btn-danger flex items-center"
            >
              <Trash2 className="mr-1" size={18} />
              Delete Course
            </button>
          </div>
        </div>

        <hr className="my-6 border-gray-200" />
        
        <h2 className="text-xl font-semibold mb-4">Lecture Notes</h2>
        
        {notes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-2">No notes yet</h3>
            <p className="text-gray-500 mb-6">Upload your first note to get started!</p>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary"
            >
              Upload Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={handleDeleteNoteRequest} />
            ))}
          </div>
        )}
        
        {isUploadModalOpen && (
          <NoteUploadModal
            courseId={id}
            onClose={() => setIsUploadModalOpen(false)}
            onNoteAdded={handleNoteAdded}
          />
        )}

        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Delete Course</h3>
              <p className="mb-6 text-gray-700">
                Are you sure you want to delete this course? This will also delete all notes
                associated with this course. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="btn-secondary"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCourse}
                  className="btn-danger"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Course'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteNoteConfirmOpen && noteToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-200">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl transform transition-all duration-200 scale-100 opacity-100">
              <div className="flex items-start space-x-3">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Delete Note
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete the note "<strong className='font-semibold'>{noteToDelete.title}</strong>"?
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              {deleteError && (
                <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {deleteError}
                </div>
              )}
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
                <button
                  type="button"
                  onClick={confirmDeleteNote}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  disabled={noteDeleteLoading}
                >
                  {noteDeleteLoading ? (
                    <span className="flex items-center">
                      <SpinnerIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Deleting...
                    </span>
                  ) : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={cancelDeleteNote}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                  disabled={noteDeleteLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default CourseDetailPage;
