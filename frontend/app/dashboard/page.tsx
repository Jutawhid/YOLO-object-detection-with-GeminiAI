// app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import Header from '../../components/dashboard/Header';
import UploadSection from '../../components/dashboard/UploadSection';
import ResultsSection from '../../components/dashboard/ResultsSection';
import QASection from '../../components/dashboard/QASection';

export default function DashboardPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UploadSection
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          previewUrl={previewUrl}
        />
        
        <ResultsSection />
        
        <QASection />
      </main>
    </div>
  );
}