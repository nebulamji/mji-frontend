import React from 'react';
import { Home, Library, PlayCircle, BarChart2, Settings } from 'lucide-react';
import SidebarNavItem from './SidebarNavItem';

interface SidebarProps {
  activeView: string;
  userProfile: {
    name: string;
    profilePic: string;
  };
  onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, userProfile, onNavigate }) => {
  return (
    <div className="w-64 bg-gray-800 shadow-xl">
      <div className="p-6 border-b border-gray-700">
        <img 
          src={userProfile.profilePic} 
          alt="Profile" 
          className="w-16 h-16 rounded-full mx-auto mb-2 ring-2 ring-blue-500"
        />
        <h2 className="text-center font-bold text-gray-100">{userProfile.name}</h2>
      </div>
      <nav className="p-4">
        <SidebarNavItem 
          icon={<Home />} 
          label="Home" 
          active={activeView === 'home'}
          onClick={() => onNavigate('home')}
        />
        <SidebarNavItem 
          icon={<Library />} 
          label="Library" 
          active={activeView === 'library'}
          onClick={() => onNavigate('library')}
        />
        <SidebarNavItem 
          icon={<PlayCircle />} 
          label="Live Stream" 
          active={activeView === 'stream'}
          onClick={() => onNavigate('stream')}
        />
        <SidebarNavItem 
          icon={<BarChart2 />} 
          label="Analytics" 
          active={activeView === 'analytics'}
          onClick={() => onNavigate('analytics')}
        />
        <SidebarNavItem 
          icon={<Settings />} 
          label="Settings" 
          active={activeView === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </nav>
    </div>
  );
};

export default Sidebar;