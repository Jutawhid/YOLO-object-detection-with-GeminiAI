// components/dashboard/QASection.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'user',
    content: 'What is the confidence score of the largest object?',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: '2',
    type: 'ai',
    content: 'Based on the detection results, the largest object is the Car with a bounding box of (80, 120, 260, 280), which has dimensions of 180x160 pixels. This car has a confidence score of 94%, making it the most confidently detected object in the image.',
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: '3',
    type: 'user',
    content: 'How many objects were detected with confidence above 85%?',
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: '4',
    type: 'ai',
    content: 'There are 3 objects detected with confidence above 85%: Car (94%), Person (89%), and Bike (87%). These represent the most reliable detections in your image.',
    timestamp: new Date(Date.now() - 120000),
  },
];

export default function QASection() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I received your question: "${inputValue.trim()}". This is a simulated response from the AI. In a real application, this would connect to Gemini 2.5 Flash API.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3 mb-5">
        <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Ask Questions About Results</h3>
          <p className="text-gray-600 text-sm">Powered by Gemini 2.5 Flash</p>
        </div>
      </div>

      {/* Chat Container */}
      <div 
        ref={chatContainerRef}
        className="max-h-80 overflow-y-auto mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No messages yet. Start a conversation about your detection results!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'gradient-pink' 
                      : 'gradient-purple'
                  }`}
                >
                  {message.type === 'user' ? 'JD' : 'AI'}
                </div>

                {/* Message Content */}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-700 border border-gray-200 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div
                    className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about the detected objects..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="gradient-purple text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </section>
  );
}