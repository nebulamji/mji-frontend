import React, { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import AvatarStream from './components/Stream/AvatarStream';
import ChatInterface from './components/Stream/ChatInterface';

const mockUserProfile = {
  name: "AI Jazz Instructor",
  profilePic: "https://source.unsplash.com/random/100x100",
};

function App() {
  const [activeView, setActiveView] = useState('stream');
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'live' | 'ended' | 'idle'>('idle');
  const [messages, setMessages] = useState<Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
  }>>([]);

  const handleStartStream = () => {
    setStreamStatus('connecting');
    setTimeout(() => setStreamStatus('live'), 1500);
  };

  const handleEndStream = () => {
    setStreamStatus('ended');
    setTimeout(() => setStreamStatus('idle'), 1500);
  };

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        activeView={activeView}
        userProfile={mockUserProfile}
        onNavigate={setActiveView}
      />
      
      <div className="flex-1 flex flex-col">
        <Header
          title="In The Shed at the Modern Jazz Institute"
          onStartSession={handleStartStream}
          onUpload={() => {}}
        />
        
        <main className="flex-1 p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-h-[300px] lg:min-h-0">
            <AvatarStream
              isLive={streamStatus === 'live'}
              streamStatus={streamStatus}
            />
          </div>
          
          <div className="w-full lg:w-96">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;