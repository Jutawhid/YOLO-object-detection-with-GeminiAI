// components/dashboard/Header.tsx
"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Camera } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const logout = () => {
    localStorage.removeItem("result");
    localStorage.removeItem("cf-ray-status-id-tn");
    signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              AI Vision Platform
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="w-9 h-9 gradient-pink rounded-full flex items-center justify-center text-white font-semibold text-sm">
                JD
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-gray-900">
                  John Doe
                </div>
                <div className="text-xs text-gray-500">
                  john.doe@example.com
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
