// app/dashboard/page.tsx
"use client";

import { use, useState } from "react";
import Header from "../../components/dashboard/Header";
import UploadSection from "../../components/dashboard/UploadSection";
import ResultsSection from "../../components/dashboard/ResultsSection";
import QASection from "../../components/dashboard/QASection";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // IF session exists, redirect to dashboard
      const session = document.cookie.includes("next-auth-csrf-token");
      if (!session) {
        console.log("Session found, redirecting to dashboard");
        redirect("/login");
      }
    }
  }, []);

  const handleImageUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDetectImageWithUpload = () => {
    // Logic to handle detection with the uploaded image
    console.log("Detecting objects in the uploaded image...");
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
