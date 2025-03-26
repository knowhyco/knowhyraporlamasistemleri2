import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  UserIcon, 
  ChartBarIcon, 
  CogIcon, 
  QuestionMarkCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <HomeIcon className="w-6 h-6" />, path: '/' },
    { id: 'profile', name: 'Profil', icon: <UserIcon className="w-6 h-6" />, path: '/profile' },
    { id: 'stats', name: 'İstatistikler', icon: <ChartBarIcon className="w-6 h-6" />, path: '/stats' },
    { id: 'settings', name: 'Ayarlar', icon: <CogIcon className="w-6 h-6" />, path: '/settings' },
    { id: 'help', name: 'Yardım', icon: <QuestionMarkCircleIcon className="w-6 h-6" />, path: '/help' },
  ];
  
  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-navy-800 h-full transition-all duration-300 border-r border-navy-700 relative shadow-xl`}>
      {/* Toggle Button */}
      <button 
        className="absolute -right-3 top-20 bg-navy-700 text-gray-400 p-1 rounded-full border border-navy-600 z-10"
        onClick={toggleSidebar}
      >
        {collapsed ? 
          <Bars3Icon className="w-4 h-4" /> : 
          <XMarkIcon className="w-4 h-4" />
        }
      </button>
      
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-navy-700">
        {collapsed ? (
          <div className="mx-auto text-accent-blue text-2xl font-bold">K</div>
        ) : (
          <div className="text-accent-blue text-2xl font-bold">KNOWHY</div>
        )}
      </div>
      
      {/* Menu Items */}
      <nav className="mt-6 px-3">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`
                  flex items-center p-3 rounded-lg transition-colors
                  ${activeItem === item.id 
                    ? 'bg-navy-700 text-accent-blue' 
                    : 'text-gray-400 hover:bg-navy-700 hover:text-white'}
                `}
                onClick={() => setActiveItem(item.id)}
              >
                <div className="flex items-center justify-center">
                  {item.icon}
                </div>
                
                {!collapsed && (
                  <span className="ml-3 font-medium">{item.name}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Profile Section */}
      {!collapsed && (
        <div className="absolute bottom-0 w-full p-4 border-t border-navy-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent-blue to-accent-teal flex items-center justify-center text-white font-bold">
              AD
            </div>
            <div className="ml-3">
              <p className="text-white font-medium">Ahmet Deniz</p>
              <p className="text-gray-400 text-sm">Admin</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 