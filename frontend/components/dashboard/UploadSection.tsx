// components/dashboard/UploadSection.tsx
'use client';

import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface UploadSectionProps {
  onImageUpload: (file: File) => void;
  OnDetectImage: () => void;
  onRemoveImage: () => void;
  previewUrl: string | null;
}

export default function UploadSection({ onImageUpload, onRemoveImage, OnDetectImage, previewUrl }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Call onImageUpload(file);
  };

  return (
    <section className="bg-white rounded-2xl p-6 sm:p-8 mb-6 shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Image for Detection</h2>
      <p className="text-gray-600 mb-6">
        Upload an image to detect objects using our advanced YOLO model
      </p>

      <div
        className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg mx-auto mb-4">
          <Upload className="w-7 h-7 text-blue-600" />
        </div>
        <div className="text-lg font-semibold text-gray-900 mb-2">Drop your image here</div>
        <div className="text-gray-600 mb-6">or click to browse (PNG, JPG, JPEG up to 10MB)</div>
        <button
          className="gradient-primary text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Select Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileInput}
        />
      </div>

      {previewUrl && (
        <div className="mt-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 max-w-2xl">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto rounded-xl shadow-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <button onClick={OnDetectImage} className="gradient-success text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all whitespace-nowrap">
                Detect Objects
              </button>
              <button
                onClick={onRemoveImage}
                className="bg-white text-red-500 border border-red-200 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                Remove Image
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}