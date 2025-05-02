import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/supabase';
import { X, Upload, Image, FileText, FileAudio } from 'lucide-react';

const NoteUploadModal = ({ courseId, onClose, onNoteAdded }) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedType, setSelectedType] = useState('image');
  const [writtenText, setWrittenText] = useState(''); // State for the textarea

  // Reset fields when type changes
  useEffect(() => {
    // Clear file, preview, text and errors when type changes
    setFile(null);
    setPreview(null);
    setWrittenText('');
    setError(null);
  }, [selectedType]);

  const fileTypes = {
    image: {
        label: 'Image',
        accept: 'image/*',
        icon: Image,
    },
    audio: {
        label: 'Audio',
        accept: 'audio/*',
        icon: FileAudio,
    },
    pdf: {
        label: 'PDF',
        accept: '.pdf,application/pdf',
        icon: FileText,
    },
    text: {
      label: 'Text',
      accept: '',
      icon: FileText,
    },
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Validate file type (Text type is handled separately now)
    const fileType = selectedFile.type;
    const fileName = selectedFile.name;
    const fileExt = fileName.split('.').pop().toLowerCase();

    let isValidType = false;
    if (selectedType === 'image' && fileType.startsWith('image/')) {
      isValidType = true;
    } else if (selectedType === 'audio' && fileType.startsWith('audio/')) {
      isValidType = true;
    } else if (selectedType === 'pdf' && (fileType === 'application/pdf' || fileExt === 'pdf')) {
      isValidType = true;
    }
    // Removed text file validation - not applicable for upload anymore

    if (!isValidType) {
      const expectedTypes = fileTypes[selectedType].accept;
      setError(`Invalid file type. Please select a ${selectedType} file (${expectedTypes})`);
      setFile(null);
      setPreview(null);
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      return;
    }

    // Create preview only for images
    if (isValidType && selectedType === 'image') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // --- Form Validation ---
    if (!title.trim()) {
      setError('Note title is required');
      return;
    }
    if (selectedType === 'text' && !writtenText.trim()) { // Only check writtenText for text type
      setError('Text content cannot be empty');
      return;
    }
    // Validate file only if NOT text type
    if (selectedType !== 'text' && !file) {
       setError(`Please select a ${selectedType} file to upload.`);
      return;
    }
    // --- End Validation ---

    try {
      setLoading(true);

      let fileToUpload = file;
      let fileNameForDb = file?.name;

      // If text type, create a File object from the textarea content
      if (selectedType === 'text') {
        const textBlob = new Blob([writtenText], { type: 'text/plain' });
        const safeTitle = title.trim().replace(/[^a-z0-9\._-]/gi, '_').toLowerCase() || 'note';
        fileNameForDb = `${safeTitle}_${Date.now()}.txt`;
        // This should now use the native File constructor without conflict
        fileToUpload = new File([textBlob], fileNameForDb, { type: 'text/plain' });
      }

      if (!fileToUpload) {
         setError("Something went wrong. No file or text content to upload.");
         setLoading(false);
         return;
      }

      // --- Upload file to Supabase Storage ---
      let uploadResult;
      try {
        uploadResult = await uploadFile(fileToUpload, 'notes', `course_${courseId}`);
      } catch (uploadError) {
        console.error('Upload error during uploadFile call:', uploadError);
        const message = uploadError.message || 'Please try again.';
        const supabaseError = uploadError.error?.message;
        throw new Error(`Failed to upload file.${supabaseError ? ` (${supabaseError})` : ` (${message})`}`);
      }
      // --- End Upload ---

      // --- Insert note record in database ---
      const { data, error: dbError } = await supabase
        .from('notes')
        .insert([
          {
            title: title.trim(),
            file_url: uploadResult.publicUrl,
            file_path: uploadResult.filePath,
            file_type: selectedType,
            file_name: fileNameForDb,
            course_id: courseId,
          }
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error('Failed to save note information to database.');
      }
      // --- End DB Insert ---

      // --- Directly increment the course note count ---
      // First get current course to get the current note_count
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('note_count')
        .eq('id', courseId)
        .single();

      if (!courseError) {
        // Then update the note_count
        const currentCount = courseData?.note_count || 0;
        const { error: updateError } = await supabase
          .from('courses')
          .update({ note_count: currentCount + 1 })
          .eq('id', courseId);

        if (updateError) {
          console.error('Failed to update note count:', updateError.message);
          // Continue anyway, the note is still created
        }
      }
      // --- End Count Update ---

      onNoteAdded(data);
      onClose();

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to upload note. An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Simplified conditional rendering logic
  const showFileInput = selectedType !== 'text';
  const showTextArea = selectedType === 'text';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Upload New Note</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            disabled={loading}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Note Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Note Title*
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lecture 1 Key Concepts"
              className="input-field w-full"
              required
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* File Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Type*
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(fileTypes).map(([type, { label, icon: Icon }]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedType === type
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm scale-105'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-600'
                  }`}
                  disabled={loading}
                  aria-pressed={selectedType === type}
                >
                  <Icon size={24} className="mb-1" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Area or Text Area */}
          <div className="mt-4">
            {/* File Input (Now hidden for text type) */}
            {showFileInput && (
              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
                   {`Upload ${fileTypes[selectedType].label} File*`}
                </label>
                <div className={`border-2 border-dashed rounded-md p-6 text-center transition-colors duration-200 ${loading ? 'bg-gray-100 border-gray-300' : 'border-gray-300 hover:border-primary-400'}`}>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept={fileTypes[selectedType].accept}
                    disabled={loading}
                  />

                  {!file ? (
                    <label
                      htmlFor="file-upload"
                      className={`cursor-pointer flex flex-col items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-disabled={loading}
                    >
                      <Upload className="h-10 w-10 mb-2 text-gray-400" />
                      <span className="text-sm font-semibold text-primary-600 mb-1">Click to upload</span>
                      <span className="text-xs text-gray-500">
                         or drag and drop
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                         {`${fileTypes[selectedType].label} (${fileTypes[selectedType].accept})`}
                      </span>
                    </label>
                  ) : (
                    <div className="py-2 space-y-2">
                          {preview && selectedType === 'image' ? (
                            <div className="flex justify-center">
                              <img src={preview} alt="Preview" className="max-h-32 rounded border border-gray-200" />
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              {React.createElement(fileTypes[selectedType].icon, {
                                className: "text-gray-500 h-12 w-12",
                                'aria-hidden': "true"
                              })}
                            </div>
                          )}

                          <div className="flex items-center justify-center text-sm">
                            <span className="text-gray-700 truncate max-w-[200px] font-medium" title={file.name}>{file.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFile(null);
                                setPreview(null);
                                setError(null);
                                const fileInput = document.getElementById('file-upload');
                                if (fileInput) fileInput.value = '';
                              }}
                              className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 disabled:opacity-50"
                              disabled={loading}
                              aria-label="Remove selected file"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                  )}
                </div>
              </div>
            )}

            {/* Text Area (Now always shown for text type) */}
            {showTextArea && (
               <div>
                 <label htmlFor="writtenText" className="block text-sm font-medium text-gray-700 mb-1">
                   Write Note Content*
                 </label>
                 <textarea
                   id="writtenText"
                   rows={8}
                   value={writtenText}
                   onChange={(e) => setWrittenText(e.target.value)}
                   placeholder="Type your notes here..."
                   className="input-field w-full text-sm"
                   required={selectedType === 'text'} // Make required only when text type is selected
                   disabled={loading}
                 />
                 <p className="text-xs text-gray-500 mt-1">This will be saved as a .txt file.</p>
               </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center justify-center"
              disabled={loading || (selectedType === 'text' ? !writtenText.trim() : !file) || !title.trim() }
            >
              {loading ? (
                 <>
                       <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
              ): 'Upload Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteUploadModal;