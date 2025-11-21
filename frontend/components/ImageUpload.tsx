// frontend/components/ImageUpload.js
export default function ImageUpload({ onImageSelect, imagePreview }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
      {!imagePreview ? (
        <>
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
        </>
      ) : (
        <img src={imagePreview} alt="Preview" className="max-h-96 mx-auto rounded" />
      )}
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className="mt-4 inline-block px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
      >
        {imagePreview ? 'Change Image' : 'Select Image'}
      </label>
    </div>
  );
}

// frontend/components/ResultsDisplay.js
'use client';

import { useState } from 'react';

export default function ResultsDisplay({ results }) {
  const [sortConfig, setSortConfig] = useState({ key: 'confidence', direction: 'desc' });

  const sortedDetections = [...results.detections].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-400">⇅</span>;
    }
    return sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Detection Results</h2>

      {/* Annotated Image */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Annotated Image</h3>
        <img
          src={`http://localhost:5000${results.annotatedImage}`}
          alt="Annotated"
          className="max-w-full rounded-lg border border-gray-200"
        />
      </div>

      {/* Summary */}
      <div className="mb-4 p-4 bg-blue-50 rounded-md">
        <p className="text-sm font-medium text-blue-900">
          Total Objects Detected: <span className="font-bold">{results.count}</span>
        </p>
      </div>

      {/* Sortable Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('class_name')}
              >
                Class Name <SortIcon columnKey="class_name" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('x')}
              >
                X <SortIcon columnKey="x" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('y')}
              >
                Y <SortIcon columnKey="y" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('w')}
              >
                Width <SortIcon columnKey="w" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('h')}
              >
                Height <SortIcon columnKey="h" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('confidence')}
              >
                Confidence <SortIcon columnKey="confidence" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedDetections.map((detection, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {detection.class_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {detection.x}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {detection.y}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {detection.w}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {detection.h}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {(detection.confidence * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// frontend/components/QAChat.js
'use client';

import { useState, useEffect, useRef } from 'react';

export default function QAChat({ imageId }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history
    loadChatHistory();
  }, [imageId]);

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/qa/${imageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage = {
      question: userQuestion,
      answer: null,
      created_at: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageId,
          question: userQuestion
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();

      // Update with AI response
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          question: userQuestion,
          answer: data.answer,
          created_at: data.timestamp
        };
        return updated;
      });

    } catch (error) {
      console.error('Q&A error:', error);
      // Update with error message
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          answer: 'Sorry, I couldn\'t process your question. Please try again.'
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Ask Questions About Results</h2>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">
            Ask questions about the detected objects, like "How many cars are there?" or "What is the highest-confidence object?"
          </p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="mb-4">
              {/* User Question */}
              <div className="flex justify-end mb-2">
                <div className="bg-blue-600 text-white rounded-lg py-2 px-4 max-w-md">
                  <p className="text-sm">{msg.question}</p>
                </div>
              </div>

              {/* AI Answer */}
              {msg.answer && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-900 rounded-lg py-2 px-4 max-w-md">
                    <p className="text-sm whitespace-pre-wrap">{msg.answer}</p>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {!msg.answer && isLoading && index === messages.length - 1 && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-600 rounded-lg py-2 px-4">
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleAskQuestion} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the detected objects..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? 'Sending...' : 'Ask'}
        </button>
      </form>
    </div>
  );
}