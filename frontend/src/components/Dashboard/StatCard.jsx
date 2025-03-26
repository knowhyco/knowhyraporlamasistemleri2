import React from 'react';
import PropTypes from 'prop-types';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

const StatCard = ({ 
  icon, 
  title, 
  value, 
  change = 0, 
  changeType = null, 
  color = 'blue',
  progressValue = 0
}) => {
  // Eğer değişim tipi belirtilmemişse, değişim değerine göre otomatik belirle
  const actualChangeType = changeType || (change >= 0 ? 'positive' : 'negative');
  
  // Sayısal değer için formatlama
  const formattedValue = typeof value === 'number' 
    ? new Intl.NumberFormat('tr-TR').format(value)
    : value;
  
  // Renk sınıfları
  const colorMap = {
    blue: {
      accent: 'bg-accent-blue',
      bg: 'from-accent-blue/20 to-accent-blue/5',
      text: 'text-accent-blue',
      border: 'border-accent-blue/30',
      ring: 'ring-accent-blue/30',
      progress: 'bg-accent-blue',
    },
    teal: {
      accent: 'bg-accent-teal',
      bg: 'from-accent-teal/20 to-accent-teal/5',
      text: 'text-accent-teal',
      border: 'border-accent-teal/30',
      ring: 'ring-accent-teal/30',
      progress: 'bg-accent-teal',
    },
    purple: {
      accent: 'bg-accent-purple',
      bg: 'from-accent-purple/20 to-accent-purple/5',
      text: 'text-accent-purple',
      border: 'border-accent-purple/30',
      ring: 'ring-accent-purple/30',
      progress: 'bg-accent-purple',
    },
    green: {
      accent: 'bg-accent-green',
      bg: 'from-accent-green/20 to-accent-green/5',
      text: 'text-accent-green',
      border: 'border-accent-green/30',
      ring: 'ring-accent-green/30',
      progress: 'bg-accent-green',
    },
    red: {
      accent: 'bg-accent-red',
      bg: 'from-accent-red/20 to-accent-red/5',
      text: 'text-accent-red',
      border: 'border-accent-red/30',
      ring: 'ring-accent-red/30',
      progress: 'bg-accent-red',
    }
  };
  
  const colorClasses = colorMap[color] || colorMap.blue;
  
  // İlerleme çubuğu yüzdesi hesaplama (0-100 arasında olduğundan emin ol)
  const progress = Math.min(Math.max(progressValue, 0), 100);
  
  return (
    <div className={`p-5 rounded-xl bg-gradient-to-br ${colorClasses.bg} border border-navy-700 relative overflow-hidden`}>
      {/* Sol üst köşe - ikon */}
      <div className={`${colorClasses.accent} w-12 h-12 rounded-lg flex items-center justify-center mb-4 shadow-lg`}>
        <div className="text-white">
          {icon}
        </div>
      </div>
      
      {/* Başlık */}
      <div className="text-gray-400 text-sm font-medium mb-1">
        {title}
      </div>
      
      {/* Değer */}
      <div className="text-white text-2xl font-bold mb-1">
        {formattedValue}
      </div>
      
      {/* Değişim */}
      <div className="flex items-center mb-4">
        {actualChangeType === 'positive' ? (
          <ArrowUpIcon className="w-4 h-4 text-accent-green mr-1" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 text-accent-red mr-1" />
        )}
        <span className={actualChangeType === 'positive' ? 'text-accent-green' : 'text-accent-red'}>
          {Math.abs(change)}%
        </span>
        <span className="text-gray-400 text-xs ml-2">Son 30 gün</span>
      </div>
      
      {/* İlerleme çubuğu */}
      <div className="w-full bg-navy-700 h-1 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses.progress}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  change: PropTypes.number,
  changeType: PropTypes.oneOf(['positive', 'negative', null]),
  color: PropTypes.oneOf(['blue', 'teal', 'purple', 'green', 'red']),
  progressValue: PropTypes.number
};

export default StatCard; 