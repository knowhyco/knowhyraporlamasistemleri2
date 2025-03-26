import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import Sidebar from '../components/Dashboard/Sidebar';
import StatCard from '../components/Dashboard/StatCard';
import RevenueChart from '../components/Dashboard/RevenueChart';
import TransactionList from '../components/Dashboard/TransactionList';
import { EnvelopeIcon, BuildingStorefrontIcon, UserGroupIcon, TruckIcon } from '@heroicons/react/24/outline';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    emails: { value: 12361, change: 14, title: 'Emails Sent' },
    sales: { value: 431225, change: 21, title: 'Sales Obtained' },
    clients: { value: 32441, change: 5, title: 'New Clients' },
    traffic: { value: 1325134, change: 43, title: 'Traffic Received' }
  });
  
  // Dashboard verilerini yükleme (gerçek uygulamada bu API'dan gelmeli)
  useEffect(() => {
    // API'dan istatistikleri alma simülasyonu yapıyoruz
    const fetchStats = async () => {
      // Gerçek uygulamada:
      // try {
      //   setLoading(true);
      //   const response = await axios.get('/api/dashboard/stats');
      //   setStats(response.data);
      // } catch (error) {
      //   console.error('Stat yüklenirken hata oluştu', error);
      // } finally {
      //   setLoading(false);
      // }
      
      // Şimdilik sabit verileri kullanıyoruz
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 800);
    };
    
    fetchStats();
  }, []);
  
  return (
    <div className="flex h-screen bg-navy-900 text-white">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader />
        
        {/* İçerik Alanı */}
        <main className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Başlık */}
          <div className="flex justify-between items-center mt-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">DASHBOARD</h1>
              <p className="text-gray-400 mt-1">Welcome to your dashboard</p>
            </div>
            
            <button 
              className="flex items-center px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              <span>DOWNLOAD REPORTS</span>
            </button>
          </div>
          
          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              icon={<EnvelopeIcon className="w-6 h-6" />}
              title={stats.emails.title}
              value={stats.emails.value}
              change={stats.emails.change}
              color="blue"
              progressValue={75}
            />
            
            <StatCard 
              icon={<BuildingStorefrontIcon className="w-6 h-6" />}
              title={stats.sales.title}
              value={stats.sales.value}
              change={stats.sales.change}
              color="teal"
              progressValue={85}
            />
            
            <StatCard 
              icon={<UserGroupIcon className="w-6 h-6" />}
              title={stats.clients.title}
              value={stats.clients.value}
              change={stats.clients.change}
              changeType={stats.clients.change >= 0 ? 'positive' : 'negative'}
              color="purple"
              progressValue={65}
            />
            
            <StatCard 
              icon={<TruckIcon className="w-6 h-6" />}
              title={stats.traffic.title}
              value={stats.traffic.value}
              change={stats.traffic.change}
              color="green"
              progressValue={90}
            />
          </div>
          
          {/* Alt Kısım: Grafik ve İşlemler */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Grafik - 3 birim genişlik */}
            <div className="lg:col-span-3">
              <RevenueChart />
            </div>
            
            {/* İşlem Listesi - 1 birim genişlik */}
            <div>
              <TransactionList />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage; 