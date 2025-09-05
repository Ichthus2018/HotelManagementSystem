import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaUpload, FaTimes, FaCheckCircle } from "react-icons/fa";

// Single file component
const UploadingFile = ({ file, fileId, onRemove, onProgressUpdate }) => {
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const newProgress = prev + Math.random() * 20;
        return Math.min(newProgress, 100);
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    onProgressUpdate(fileId, progress);
  }, [progress, fileId, onProgressUpdate]);

  const isComplete = progress >= 100;

  return (
    <div className="w-full bg-white p-4 border border-gray-200 rounded-lg shadow-sm flex items-center space-x-4">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
        {isComplete && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <div className="loader-spinner"></div>
        )}
      </div>

      <div className="flex-grow">
        <p className="text-sm">
          <span className="font-semibold text-gray-800">{file.name}</span>
          {isComplete ? (
            <span className="ml-2 inline-flex items-center gap-1 text-green-600 font-semibold">
              <FaCheckCircle />
              Complete
            </span>
          ) : (
            <span className="text-gray-500"> is uploading...</span>
          )}
        </p>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
        aria-label="Remove file"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

// Main ImageUploader component
const ImageUploader = ({
  onFilesChange,
  multiple = true,
  maxSizeMB = 5,
  onUploadStatusChange = () => {},
  initialFiles = [],
}) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // Update files when initialFiles changes (when navigating back to page 1)
  useEffect(() => {
    if (initialFiles.length > 0 && files.length === 0) {
      const initialFileObjects = initialFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file: file,
      }));

      setFiles(initialFileObjects);

      // Initialize progress for initial files
      const initialProgress = {};
      initialFileObjects.forEach((f) => {
        initialProgress[f.id] = 100; // Mark as complete since they're already uploaded
      });
      setUploadProgress(initialProgress);
    }
  }, [initialFiles]); // Run when initialFiles changes

  // Notify parent when files change
  useEffect(() => {
    onFilesChange(files.map((f) => f.file));
  }, [files, onFilesChange]);

  useEffect(() => {
    if (files.length === 0) {
      onUploadStatusChange(false);
      return;
    }
    const isUploading = files.some(
      (file) => (uploadProgress[file.id] || 0) < 100
    );
    onUploadStatusChange(isUploading);
  }, [files, uploadProgress, onUploadStatusChange]);

  const handleFileProcessing = useCallback(
    (incomingFiles) => {
      const oversizedFiles = Array.from(incomingFiles).filter(
        (file) => file.size > maxSizeMB * 1024 * 1024
      );

      if (oversizedFiles.length > 0) {
        alert(`Some files were too large. Maximum size is ${maxSizeMB}MB.`);
      }

      const validFiles = Array.from(incomingFiles)
        .filter((file) => file.type.startsWith("image/"))
        .filter((file) => file.size <= maxSizeMB * 1024 * 1024);

      if (validFiles.length) {
        const newFileObjects = validFiles.map((file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file: file,
        }));

        setFiles((prev) =>
          multiple ? [...prev, ...newFileObjects] : [newFileObjects[0]]
        );

        const initialProgress = {};
        newFileObjects.forEach((f) => {
          initialProgress[f.id] = 0;
        });
        setUploadProgress((prev) => ({ ...prev, ...initialProgress }));
      }
    },
    [maxSizeMB, multiple]
  );

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcessing(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = (idToRemove) => {
    setFiles((prev) => prev.filter((f) => f.id !== idToRemove));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[idToRemove];
      return newProgress;
    });
  };

  const handleProgressUpdate = useCallback((fileId, progress) => {
    setUploadProgress((prev) => ({
      ...prev,
      [fileId]: progress,
    }));
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcessing(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full space-y-4">
      <style>{`
        .loader-spinner {
            width: 28px; height: 28px; border-radius: 50%; display: inline-block;
            border-top: 4px solid #3B82F6; border-right: 4px solid transparent;
            box-sizing: border-box; animation: spinner-rotation 1s linear infinite;
        }
        @keyframes spinner-rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors duration-300 ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h2 className="text-2xl font-bold text-gray-700">
          You can upload images
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          CLICK ON THE BUTTON OR DRAG & DROP FILES HERE (MAX {maxSizeMB}MB EACH)
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple={multiple}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-6 inline-flex items-stretch bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="flex items-center justify-center px-4 py-2.5">
            <FaUpload />
          </span>
          <span className="border-l border-blue-500 px-5 py-2.5">
            Upload Images
          </span>
        </button>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((f) => (
            <UploadingFile
              key={f.id}
              fileId={f.id}
              file={f.file}
              onRemove={() => handleRemoveFile(f.id)}
              onProgressUpdate={handleProgressUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
