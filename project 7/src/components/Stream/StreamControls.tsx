import React from 'react';
import { Volume2, Mic, Settings, Share2 } from 'lucide-react';

interface StreamControlsProps {
  isLive: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMic: () => void;
  onOpenSettings: () => void;
  onShare: () => void;
}

const StreamControls: React.FC<StreamControlsProps> = ({
  isLive,
  onVolumeChange,
  onToggleMic,
  onOpenSettings,
  onShare
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 to-transparent">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            className="text-gray-200 hover:text-white transition-colors"
            onClick={() => onToggleMic()}
          >
            <Mic className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5 text-gray-200" />
            <input
              type="range"
              min="0"
              max="100"
              className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              onChange={(e) => onVolumeChange(Number(e.target.value))}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            className="text-gray-200 hover:text-white transition-colors"
            onClick={() => onOpenSettings()}
          >
            <Settings className="h-5 w-5" />
          </button>
          <button 
            className="text-gray-200 hover:text-white transition-colors"
            onClick={() => onShare()}
          >
            <Share2 className="h-5 w-5" />
          </button>
          {isLive && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              LIVE
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamControls;