import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  BellIcon,
  EnvelopeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { isAdmin, getUserFromToken } from '../../utils/authUtils';

const DashboardHeader = () => {
  const [darkMode, setDarkMode] = useState(true); // Varsayılan olarak koyu tema
  const user = getUserFromToken() || { name: 'Kullanıcı' }; // Token'dan kullanıcı bilgisini al veya varsayılan değer
  const isAdminUser = isAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Bildirimler için örnek veriler
  const notifications = [
    { id: 1, title: 'Yeni rapor', message: 'Aylık rapor hazır.', time: '1 saat önce', read: false },
    { id: 2, title: 'Sistem güncellemesi', message: 'Sistem bakımı 22:00\'da yapılacak.', time: '3 saat önce', read: true },
    { id: 3, title: 'Yeni yorum', message: 'Raporunuza yeni bir yorum eklendi.', time: '1 gün önce', read: true },
  ];
  
  // Profil menüsü öğeleri
  const profileMenuItems = [
    { id: 'profile', label: 'Profil', action: () => console.log('Profile clicked') },
    { id: 'settings', label: 'Ayarlar', action: () => console.log('Settings clicked') },
    { id: 'logout', label: 'Çıkış Yap', action: () => console.log('Logout clicked') },
  ];
  
  // Bildirimleri aç/kapat
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showProfile) setShowProfile(false);
  };
  
  // Profil menüsünü aç/kapat
  const toggleProfile = () => {
    setShowProfile(!showProfile);
    if (showNotifications) setShowNotifications(false);
  };

  return (
    <header className="h-16 bg-navy-800 border-b border-navy-700 flex items-center justify-between px-6 z-10">
      {/* Arama Kutusu */}
      <div className="relative">
        <input
          type="text"
          placeholder="Ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-navy-700 text-gray-300 pl-10 pr-4 py-2 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-accent-blue"
        />
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
      </div>
      
      {/* Sağ Kısım - Bildirimler ve Profil */}
      <div className="flex items-center space-x-4">
        {/* Bildirim Butonu */}
        <div className="relative">
          <button 
            className="p-2 text-gray-400 hover:text-white hover:bg-navy-700 rounded-full focus:outline-none relative"
            onClick={toggleNotifications}
          >
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-0 right-0 h-4 w-4 bg-accent-red text-white text-xs rounded-full flex items-center justify-center">
              {notifications.filter(n => !n.read).length}
            </span>
          </button>
          
          {/* Bildirim Paneli */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-navy-800 rounded-lg shadow-lg overflow-hidden border border-navy-700 z-50">
              <div className="p-3 border-b border-navy-700 flex justify-between items-center">
                <h3 className="text-white font-medium">Bildirimler</h3>
                <span className="text-xs bg-accent-blue text-white px-2 py-1 rounded-full">
                  {notifications.filter(n => !n.read).length} Yeni
                </span>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-3 border-b border-navy-700 ${notification.read ? '' : 'bg-navy-700'} hover:bg-navy-700/50`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white text-sm font-medium">{notification.title}</p>
                        <p className="text-gray-400 text-xs mt-1">{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-accent-blue rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-2">{notification.time}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-2 text-center border-t border-navy-700">
                <button className="text-accent-blue hover:text-accent-teal text-sm">
                  Tümünü Gör
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Mesajlar Butonu */}
        <button className="p-2 text-gray-400 hover:text-white hover:bg-navy-700 rounded-full focus:outline-none relative">
          <EnvelopeIcon className="w-6 h-6" />
          <span className="absolute top-0 right-0 h-4 w-4 bg-accent-green text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button>
        
        {/* Profil Butonu */}
        <div className="relative">
          <button 
            className="flex items-center space-x-2 text-gray-400 hover:text-white focus:outline-none"
            onClick={toggleProfile}
          >
            <UserCircleIcon className="w-8 h-8" />
            <span className="hidden md:block">Ahmet Deniz</span>
          </button>
          
          {/* Profil Menüsü */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-40 bg-navy-800 rounded-lg shadow-lg overflow-hidden border border-navy-700 z-50">
              {profileMenuItems.map(item => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full text-left px-4 py-2 hover:bg-navy-700 text-gray-300 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 