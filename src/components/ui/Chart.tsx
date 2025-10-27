'use client';

import React from 'react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ChartProps {
  data: ChartData[];
  type: 'bar' | 'line' | 'doughnut';
  title?: string;
  className?: string;
  height?: number;
}

export default function Chart({
  data,
  type,
  title,
  className = '',
  height = 200
}: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  const renderBarChart = () => (
    <div className="flex items-end justify-between h-full space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className="w-full flex flex-col items-center">
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ease-out ${
                item.color || 'bg-gradient-to-t from-mdsc-blue-primary to-mdsc-blue-dark'
              }`}
              style={{ height: `${(item.value / maxValue) * (height - 40)}px` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-600 text-center">
            <div className="font-medium">{item.value}</div>
            <div className="truncate max-w-full">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLineChart = () => (
    <div className="relative h-full">
      <svg className="w-full h-full" viewBox={`0 0 400 ${height}`}>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-mdsc-blue-primary"
          points={data.map((item, index) => {
            const x = (index / (data.length - 1)) * 400;
            const y = height - (item.value / maxValue) * (height - 40);
            return `${x},${y}`;
          }).join(' ')}
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 400;
          const y = height - (item.value / maxValue) * (height - 40);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill="currentColor"
              className="text-mdsc-blue-primary"
            />
          );
        })}
      </svg>
    </div>
  );

  const renderDoughnutChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const startAngle = (cumulativePercentage / 100) * 360;
            const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
            
            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = percentage > 50 ? 1 : 0;
            
            const pathData = [
              `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
            ].join(' ');

            cumulativePercentage += percentage;

            return (
              <path
                key={index}
                d={pathData}
                fill={item.color || `hsl(${index * 60}, 70%, 50%)`}
                className="transition-all duration-500 ease-out hover:opacity-80"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'doughnut':
        return renderDoughnutChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
      {type === 'doughnut' && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
              ></div>
              <span className="text-xs text-gray-600 truncate">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
