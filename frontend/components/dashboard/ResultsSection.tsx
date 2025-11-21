// components/dashboard/ResultsSection.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DetectionResult {
  id: string;
  objectClass: string;
  confidence: number;
  boundingBox: [number, number, number, number];
}

const mockResults: DetectionResult[] = [
  { id: '1', objectClass: 'Car', confidence: 0.94, boundingBox: [80, 120, 260, 280] },
  { id: '2', objectClass: 'Person', confidence: 0.89, boundingBox: [340, 80, 480, 260] },
  { id: '3', objectClass: 'Bike', confidence: 0.87, boundingBox: [150, 260, 250, 340] },
  { id: '4', objectClass: 'Tree', confidence: 0.82, boundingBox: [20, 30, 100, 90] },
  { id: '5', objectClass: 'Sign', confidence: 0.76, boundingBox: [380, 280, 500, 370] },
];

type SortField = 'objectClass' | 'confidence' | 'boundingBox';
type SortDirection = 'asc' | 'desc';

export default function ResultsSection() {
  const [sortField, setSortField] = useState<SortField>('confidence');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedResults = [...mockResults].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'confidence') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      return sortDirection === 'asc' 
        ? aValue.toString().localeCompare(bValue.toString())
        : bValue.toString().localeCompare(aValue.toString());
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-40" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Annotated Image Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900">Annotated Image</h3>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
              {mockResults.length} Objects
            </span>
          </div>
          <div className="bg-gray-100 rounded-xl overflow-hidden">
            {/* SVG Annotated Image */}
            <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
              <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 600 400" 
                className="max-w-full max-h-96"
                preserveAspectRatio="xMidYMid meet"
              >
                <rect fill="#f1f5f9" width="600" height="400" />
                
                {/* Car */}
                <rect x="80" y="120" width="180" height="160" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="8 4" />
                <text x="90" y="145" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#10b981">Car (0.94)</text>
                
                {/* Person */}
                <rect x="340" y="80" width="140" height="180" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray="8 4" />
                <text x="350" y="105" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#2563eb">Person (0.89)</text>
                
                {/* Bike */}
                <rect x="150" y="260" width="100" height="80" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8 4" />
                <text x="160" y="285" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#f59e0b">Bike (0.87)</text>
                
                {/* Sign */}
                <rect x="380" y="280" width="120" height="90" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray="8 4" />
                <text x="390" y="305" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#ec4899">Sign (0.76)</text>
                
                {/* Tree */}
                <rect x="20" y="30" width="80" height="60" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="8 4" />
                <text x="30" y="55" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#8b5cf6">Tree (0.82)</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Detection Results Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900">Detection Results</h3>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
              Sortable
            </span>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('objectClass')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Object</span>
                      {getSortIcon('objectClass')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('confidence')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Confidence</span>
                      {getSortIcon('confidence')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('boundingBox')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Bounding Box</span>
                      {getSortIcon('boundingBox')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {result.objectClass}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-400"
                            style={{ width: `${result.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 min-w-12">
                          {Math.round(result.confidence * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-gray-600 font-mono">
                        ({result.boundingBox.join(', ')})
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}