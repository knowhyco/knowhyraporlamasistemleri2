import React from 'react';
import TransactionItem from './TransactionItem';

const TransactionList = ({ transactions = null }) => {
  // Örnek işlemler (gerçek uygulama da API'dan gelmeli)
  const defaultTransactions = [
    {
      id: '01e4d5a',
      name: 'johndoe',
      date: '2021-09-01',
      amount: 43.95,
      status: 'completed'
    },
    {
      id: '0315d5aa',
      name: 'jackdower',
      date: '2022-04-01',
      amount: 133.45,
      status: 'completed'
    },
    {
      id: '01e4d5a',
      name: 'aberdohnny',
      date: '2021-09-01',
      amount: 43.95,
      status: 'completed'
    }
  ];
  
  // Harici veri varsa onu kullan, yoksa örnek veriyi kullan
  const items = transactions || defaultTransactions;
  
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-700/30">
        <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
      </div>
      
      <div className="overflow-y-auto max-h-[320px]">
        {items.length > 0 ? (
          items.map((transaction, index) => (
            <TransactionItem 
              key={`${transaction.id}-${index}`}
              id={transaction.id}
              name={transaction.name}
              date={transaction.date}
              amount={transaction.amount}
              status={transaction.status}
              avatarUrl={transaction.avatarUrl}
            />
          ))
        ) : (
          <div className="p-4 text-center text-gray-400">
            Henüz işlem bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList; 