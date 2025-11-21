// app/dashboard/page.tsx
'use client';

import { use, useState } from 'react';
import Header from '../../components/dashboard/Header';
import UploadSection from '../../components/dashboard/UploadSection';
import ResultsSection from '../../components/dashboard/ResultsSection';
import QASection from '../../components/dashboard/QASection';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // If next-auth session not found, you can redirect to login page or show a message
  const session = useSession();
  if (!session) {
    console.log('No session found');
    // You can redirect to login page using next/navigation
    // For example:
    // import { redirect } from 'next/navigation';
    redirect('/login');
  }

  const handleImageUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDetectImageWithUpload = () => {
    // Logic to handle detection with the uploaded image
    console.log('Detecting objects in the uploaded image...');
    
  }

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
          OnDetectImage={handleDetectImageWithUpload}
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
