import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RevenueChart = () => {
  // Zaman aralığı durumu
  const [timeRange, setTimeRange] = useState('month');
  
  // Zaman aralığı değiştirme işleyicisi
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };
  
  // Farklı zaman aralıkları için örnek veriler
  const chartData = {
    week: {
      labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
      values: [3100, 4200, 2800, 5100, 4000, 3800, 5400]
    },
    month: {
      labels: ['1 Oca', '5 Oca', '10 Oca', '15 Oca', '20 Oca', '25 Oca', '30 Oca'],
      values: [12000, 19000, 15000, 21000, 18000, 24000, 28000]
    },
    year: {
      labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
      values: [42000, 52000, 48000, 61000, 55000, 59000, 66000, 63000, 69000, 74000, 71000, 84000]
    }
  };
  
  // Seçilen zaman aralığı verilerini al
  const selectedData = chartData[timeRange];
  
  // Grafik veri ve seçenekleri
  const data = {
    labels: selectedData.labels,
    datasets: [
      {
        label: 'Gelir',
        data: selectedData.values,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
  
  // Grafik seçenekleri
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `₺${context.parsed.y.toLocaleString('tr-TR')}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(30, 41, 59, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
          font: {
            size: 11
          },
          callback: function(value) {
            if (value >= 1000) {
              return `₺${value / 1000}k`;
            }
            return `₺${value}`;
          }
        }
      }
    }
  };
  
  return (
    <div className="card h-[400px]">
      <div className="p-5 flex justify-between items-center border-b border-gray-700/30">
        <h3 className="text-lg font-semibold text-white">Gelir Grafiği</h3>
        
        {/* Zaman aralığı seçicileri */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleTimeRangeChange('week')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              timeRange === 'week'
                ? 'bg-accent-blue text-white'
                : 'bg-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            Haftalık
          </button>
          <button
            onClick={() => handleTimeRangeChange('month')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              timeRange === 'month'
                ? 'bg-accent-blue text-white'
                : 'bg-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            Aylık
          </button>
          <button
            onClick={() => handleTimeRangeChange('year')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              timeRange === 'year'
                ? 'bg-accent-blue text-white'
                : 'bg-navy-700 text-gray-400 hover:text-white'
            }`}
          >
            Yıllık
          </button>
        </div>
      </div>
      
      <div className="p-5 h-[320px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default RevenueChart; 