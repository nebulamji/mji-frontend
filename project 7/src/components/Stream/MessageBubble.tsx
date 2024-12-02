import React from 'react';

interface MessageBubbleProps {
  content: string;
  timestamp: Date;
  sender: 'user' | 'ai';
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ content, timestamp, sender }) => {
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          sender === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-100'
        }`}
      >
        <p className="break-words">{content}</p>
        <span className="text-xs opacity-75 block mt-1">
          {timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;