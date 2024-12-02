import React from 'react';
import { Mic, Upload } from 'lucide-react';

interface HeaderProps {
  title: string;
  onStartSession: () => void;
  onUpload: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onStartSession, onUpload }) => {
  return (
    <header className="bg-gray-800 shadow-lg p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-100">
        {title}
      </h1>
      <div className="flex items-center space-x-4">
        <button 
          onClick={onStartSession}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Mic className="mr-2" /> Start Stream
        </button>
        <button 
          onClick={onUpload}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center hover:bg-gray-600 transition-colors"
        >
          <Upload className="mr-2" /> Upload Content
        </button>
      </div>
    </header>
  );
};

export default Header;