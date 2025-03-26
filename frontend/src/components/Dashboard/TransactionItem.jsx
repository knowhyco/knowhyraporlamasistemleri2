import React from 'react';
import PropTypes from 'prop-types';

const TransactionItem = ({ 
  id, 
  name, 
  date, 
  amount, 
  status = 'pending', 
  avatarUrl = null 
}) => {
  // Durum belirteci için renk sınıfları
  const statusColorMap = {
    completed: 'bg-accent-green text-white',
    pending: 'bg-accent-amber/80 text-white',
    failed: 'bg-accent-red text-white'
  };
  
  // Para tutarı formatla
  const formattedAmount = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-700/30 hover:bg-navy-700/50 transition-colors">
      {/* Sol: ID ve Kullanıcı Bilgileri */}
      <div className="flex items-center space-x-3">
        <div className="text-xs font-mono text-gray-400">{id}</div>
        <div className="text-white font-medium">
          {name}
        </div>
      </div>
      
      {/* Orta: Tarih */}
      <div className="text-sm text-gray-400">
        {date}
      </div>
      
      {/* Sağ: Tutar */}
      <div className={`text-base font-medium px-3 py-1 rounded-md ${statusColorMap[status] || statusColorMap.pending}`}>
        {formattedAmount}
      </div>
    </div>
  );
};

TransactionItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  status: PropTypes.oneOf(['completed', 'pending', 'failed']),
  avatarUrl: PropTypes.string
};

export default TransactionItem; 