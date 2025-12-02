// ReferenceSidebar.tsx
// Collapsible sidebar for API reference navigation

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import StringManager from '@/generated/StringManager';

interface ReferenceSidebarProps {
  children?: React.ReactNode;
  className?: string;
}

const menuSections = [
  {
    titleKey: 'ref_components',
    items: [
      { labelKey: 'ref_components_overview', href: '/reference/ref-components' },
    ]
  },
  {
    titleKey: 'ref_attributes',
    items: [
      { labelKey: 'ref_attr_layout', href: '/reference/ref-attributes' },
    ]
  },
  {
    titleKey: 'ref_data_binding',
    items: [
      { labelKey: 'ref_binding_syntax', href: '/reference/ref-data-binding' },
    ]
  },
  {
    titleKey: 'ref_include',
    items: [
      { labelKey: 'ref_include_basic', href: '/reference/ref-include' },
    ]
  },
  {
    titleKey: 'ref_styles',
    items: [
      { labelKey: 'ref_styles_templates', href: '/reference/ref-styles' },
    ]
  },
  {
    titleKey: 'ref_events',
    items: [
      { labelKey: 'ref_events_handlers', href: '/reference/ref-events' },
    ]
  },
];

export const ReferenceSidebar: React.FC<ReferenceSidebarProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'ref_components': true,
  });

  const toggleSection = (titleKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [titleKey]: !prev[titleKey]
    }));
  };

  const getString = (key: string) => {
    return StringManager.currentLanguage[key] || key;
  };

  return (
    <div className={`flex flex-row ${className || ''}`}>
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? 'w-[220px] opacity-100' : 'w-0 opacity-0'}
        `}
      >
        <div className="w-[220px] h-full py-4 px-4 bg-[#F9FAFB] flex flex-col overflow-y-auto">
          {menuSections.map((section) => (
            <div key={section.titleKey} className="mb-4">
              <button
                onClick={() => toggleSection(section.titleKey)}
                className="w-full flex items-center justify-between mb-2 text-[#6B7280] text-sm font-bold whitespace-nowrap hover:text-[#374151] transition-colors"
              >
                <span>{getString(section.titleKey)}</span>
                <span className="text-xs">{expandedSections[section.titleKey] ? '▼' : '▶'}</span>
              </button>
              {expandedSections[section.titleKey] && (
                <div className="flex flex-col pl-2">
                  {section.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <button className="w-full text-left py-1.5 px-2 bg-transparent rounded-md text-[#374151] text-sm cursor-pointer transition-colors hover:bg-[#E5E7EB] whitespace-nowrap">
                        {getString(item.labelKey)}
                      </button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
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

export default ReferenceSidebar;
