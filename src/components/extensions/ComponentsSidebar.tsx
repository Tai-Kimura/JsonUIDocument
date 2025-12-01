// ComponentsSidebar.tsx
// Collapsible sidebar for component navigation with slide animation

"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface ComponentsSidebarProps {
  children?: React.ReactNode;
  className?: string;
}

const menuItems = [
  { label: 'View', href: '/learn/components/view-detail' },
  { label: 'Label', href: '/learn/components/label-detail' },
  { label: 'Button', href: '/learn/components/button-detail' },
  { label: 'TextField', href: '/learn/components/text-field-detail' },
  { label: 'TextView', href: '/learn/components/text-view-detail' },
  { label: 'Switch', href: '/learn/components/switch-detail' },
  { label: 'Slider', href: '/learn/components/slider-detail' },
  { label: 'ScrollView', href: '/learn/components/scroll-view-detail' },
  { label: 'Collection', href: '/learn/components/collection-detail' },
];

export const ComponentsSidebar: React.FC<ComponentsSidebarProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`flex flex-row ${className || ''}`}>
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? 'w-[200px] opacity-100' : 'w-0 opacity-0'}
        `}
      >
        <div className="w-[200px] h-full py-4 px-4 bg-[#F9FAFB] flex flex-col">
          <span className="mb-3 text-[#6B7280] text-sm font-bold whitespace-nowrap">Components</span>
          <div className="flex flex-col">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button className="w-full text-left py-2 px-2 bg-transparent rounded-md text-[#374151] text-sm cursor-pointer transition-colors hover:bg-[#E5E7EB] whitespace-nowrap">
                  {item.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-[24px] h-[48px] bg-[#E5E7EB] text-[#6B7280] text-xs cursor-pointer
          transition-all duration-300 hover:bg-[#D1D5DB] self-start mt-4
          ${isOpen ? 'rounded-r' : 'rounded'}
        `}
      >
        {isOpen ? '◀' : '▶'}
      </button>
    </div>
  );
};

export default ComponentsSidebar;
