"use client";

import { useCallback, useState } from "react";

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
}

export default function UploadZone({ onFileUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG or PNG image");
      return false;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError("File size must be less than 50MB");
      return false;
    }

    setError(null);
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <section className="panel panel-content" aria-labelledby="upload-heading">
      <div
        className={`upload-zone ${isDragging ? "dragging" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById("file-input")?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload fabric image"
      >
        <div className="text-6xl mb-4">📸</div>
        <h3 id="upload-heading" className="text-xl font-semibold mb-2">
          Upload Fabric Image
        </h3>
        <p className="text-[var(--color-text-secondary)] mb-4">
          Drag and drop your image here, or click to browse
        </p>
        
        <div className="flex items-center justify-center gap-4 text-sm text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-lg">
              📄
            </span>
            <span>JPG, PNG</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded flex items-center justify-center text-lg">
              📏
            </span>
            <span>Max 50MB</span>
          </div>
        </div>

        <div className="mt-6">
          <button className="btn btn-primary">
            Browse Files
          </button>
        </div>

        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="File input"
        />
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-semibold text-sm mb-2 text-blue-900">
          💡 Best Results Tips
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use images 2000px or larger for best quality</li>
          <li>• Ensure good lighting and contrast</li>
          <li>• Clear subject with minimal background clutter</li>
          <li>• Avoid extreme blur or very low resolution</li>
        </ul>
      </div>
    </section>
  );
}
