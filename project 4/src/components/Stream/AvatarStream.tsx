import React from 'react';

interface AvatarStreamProps {
  isLive: boolean;
  avatarUrl?: string;
  streamStatus: 'connecting' | 'live' | 'ended' | 'idle';
}

const AvatarStream: React.FC<AvatarStreamProps> = ({ isLive, avatarUrl, streamStatus }) => {
  return (
    <div className="h-full rounded-lg overflow-hidden bg-gray-900">
      {avatarUrl ? (
        <div className="relative w-full h-full">
          <img 
            src={avatarUrl} 
            alt="AI Avatar" 
            className="w-full h-full object-cover"
          />
          {isLive && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              LIVE
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-400 mb-2">
              {streamStatus === 'connecting' ? 'Connecting...' : 
               streamStatus === 'ended' ? 'Stream Ended' : 
               'Start a stream to begin'}
            </p>
            {streamStatus === 'connecting' && (
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarStream;