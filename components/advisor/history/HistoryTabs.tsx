// แถบปุ่มกดตัวกรองสถานะ
import React from 'react';

type HistoryTabsProps = {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export default function HistoryTabs({ tabs, activeTab, onTabChange }: HistoryTabsProps) {
  return (
    <div className="bg-[#eff2f5] p-2 rounded-[14px] flex items-center gap-2 overflow-x-auto mb-6 scrollbar-hide border border-gray-200/50">
      {tabs.map((tab) => (
        <button 
          key={tab} 
          onClick={() => onTabChange(tab)}
          className={`focus:outline-none px-5 py-2.5 rounded-[10px] text-[13.5px] font-semibold whitespace-nowrap transition-all duration-200 ${
            activeTab === tab 
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}