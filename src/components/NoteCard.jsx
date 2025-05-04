import React, { useState, useEffect } from "react";
import {
  FileText,
  FileImage,
  FileAudio,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";

const NoteCard = ({ note, onDelete }) => {
  const [textContent, setTextContent] = useState("");
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (note.file_type === "text" && note.file_url) {
      setIsLoadingText(true);
      setFetchError(null);
      fetch(note.file_url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then((text) => {
          setTextContent(text);
        })
        .catch((error) => {
          console.error("Error fetching text content:", error);
          setFetchError("Could not load text content.");
        })
        .finally(() => {
          setIsLoadingText(false);
        });
    }
  }, [note.file_type, note.file_url]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderNotePreview = () => {
    switch (note.file_type) {
      case "image":
        return (
          <div className="h-40 bg-gray-100 rounded-t-md overflow-hidden flex items-center justify-center">
            <img
              src={note.file_url}
              alt={note.title}
              className="h-full w-full object-cover"
            />
          </div>
        );
      case "audio":
        return (
          <div className="p-4 bg-gray-100 rounded-t-md">
            <div className="flex justify-center mb-3">
              <FileAudio size={48} className="text-accent-600" />
            </div>
            <audio controls className="w-full">
              <source src={note.file_url} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case "pdf":
        return (
          <div className="h-40 bg-gray-100 rounded-t-md flex items-center justify-center">
            <FileText size={48} className="text-red-500" />
          </div>
        );
      case "text":
        return (
          <div className="h-40 bg-gray-50 rounded-t-md p-3 overflow-y-auto text-sm text-gray-700 relative">
            {isLoadingText && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80">
                <Loader2 className="animate-spin text-primary-600" size={24} />
              </div>
            )}
            {fetchError && (
              <div className="text-red-600 text-xs font-medium p-2 bg-red-50 rounded">
                {fetchError}
              </div>
            )}
            {!isLoadingText && !fetchError && (
              <pre className="whitespace-pre-wrap break-words font-sans">
                {textContent}
              </pre>
            )}
          </div>
        );
      default:
        return (
          <div className="h-40 bg-gray-100 rounded-t-md flex items-center justify-center">
            <FileText size={48} className="text-gray-500" />
          </div>
        );
    }
  };

  return (
    <div className="note-card flex flex-col bg-white shadow-md rounded-md overflow-hidden border border-gray-200 h-full">
      {renderNotePreview()}

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3
            className="font-medium text-gray-900 truncate flex-1 mr-2"
            title={note.title}
          >
            {note.title}
          </h3>
          <button
            onClick={() => onDelete(note)}
            className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
            aria-label="Delete note"
            title="Delete note"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          {formatDate(note.created_at)}
        </p>

        <div className="mt-auto pt-3 border-t border-gray-100">
          <a
            href={note.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-800 text-sm font-medium inline-flex items-center hover:underline"
          >
            Open Full Note
            <ExternalLink size={14} className="ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
