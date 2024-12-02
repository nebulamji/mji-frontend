import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ 
  icon, 
  label, 
  active, 
  onClick 
}) => {
  return (
    <div 
      className={`flex items-center p-3 mb-2 cursor-pointer rounded transition-colors ${
        active ? 'bg-gray-700 text-blue-400' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-100'
      }`}
      onClick={onClick}
    >
      <div className={`mr-3 ${active ? 'text-blue-400' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span className="font-medium">
        {label}
      </span>
    </div>
  );
};

export default SidebarNavItem;