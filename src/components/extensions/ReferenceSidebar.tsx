// ReferenceSidebar.tsx
// Collapsible sidebar for API reference navigation

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    ],
    subSections: [
      {
        titleKey: 'ref_layout_components',
        items: [
          { labelKey: 'comp_view_title', href: '/reference/components/ref-view' },
          { labelKey: 'comp_scrollview_title', href: '/reference/components/ref-scroll-view' },
          { labelKey: 'comp_collection_title', href: '/reference/components/ref-collection' },
          { labelKey: 'ref_table_title', href: '/reference/components/ref-table' },
          { labelKey: 'ref_safe_area_view_title', href: '/reference/components/ref-safe-area-view' },
        ]
      },
      {
        titleKey: 'ref_text_components',
        items: [
          { labelKey: 'comp_label_title', href: '/reference/components/ref-label' },
          { labelKey: 'comp_textfield_title', href: '/reference/components/ref-text-field' },
          { labelKey: 'comp_textview_title', href: '/reference/components/ref-text-view' },
          { labelKey: 'ref_icon_label_title', href: '/reference/components/ref-icon-label' },
        ]
      },
      {
        titleKey: 'ref_input_components',
        items: [
          { labelKey: 'comp_button_title', href: '/reference/components/ref-button' },
          { labelKey: 'comp_switch_title', href: '/reference/components/ref-switch' },
          { labelKey: 'comp_slider_title', href: '/reference/components/ref-slider' },
          { labelKey: 'comp_select_box_title', href: '/reference/components/ref-select-box' },
          { labelKey: 'comp_radio_title', href: '/reference/components/ref-radio' },
          { labelKey: 'ref_check_title', href: '/reference/components/ref-check' },
          { labelKey: 'ref_segment_title', href: '/reference/components/ref-segment' },
        ]
      },
      {
        titleKey: 'ref_media_components',
        items: [
          { labelKey: 'ref_image_title', href: '/reference/components/ref-image' },
          { labelKey: 'ref_network_image_title', href: '/reference/components/ref-network-image' },
          { labelKey: 'ref_circle_image_title', href: '/reference/components/ref-circle-image' },
          { labelKey: 'ref_web_title', href: '/reference/components/ref-web' },
        ]
      },
      {
        titleKey: 'ref_misc_components',
        items: [
          { labelKey: 'ref_progress_title', href: '/reference/components/ref-progress' },
          { labelKey: 'ref_indicator_title', href: '/reference/components/ref-indicator' },
          { labelKey: 'ref_gradient_view_title', href: '/reference/components/ref-gradient-view' },
          { labelKey: 'ref_blur_title', href: '/reference/components/ref-blur' },
          { labelKey: 'ref_circle_view_title', href: '/reference/components/ref-circle-view' },
        ]
      },
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

// Helper function to determine which sections should be expanded based on current path
const getExpandedSectionsForPath = (pathname: string): Record<string, boolean> => {
  const expanded: Record<string, boolean> = {};

  // Check each section and subsection
  for (const section of menuSections) {
    // Check if any item in main section matches
    const mainMatch = section.items.some(item => pathname === item.href);

    // Check subsections
    let subMatch = false;
    if (section.subSections) {
      for (const subSection of section.subSections) {
        if (subSection.items.some(item => pathname === item.href)) {
          expanded[subSection.titleKey] = true;
          subMatch = true;
        }
      }
    }

    if (mainMatch || subMatch) {
      expanded[section.titleKey] = true;
    }
  }

  // If no matches, default to ref_components open
  if (Object.keys(expanded).length === 0) {
    expanded['ref_components'] = true;
  }

  return expanded;
};

export const ReferenceSidebar: React.FC<ReferenceSidebarProps> = ({ className }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    getExpandedSectionsForPath(pathname)
  );

  useEffect(() => {
    setExpandedSections(getExpandedSectionsForPath(pathname));
  }, [pathname]);

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
                  {section.subSections?.map((subSection) => (
                    <div key={subSection.titleKey} className="mt-2">
                      <button
                        onClick={() => toggleSection(subSection.titleKey)}
                        className="w-full flex items-center justify-between mb-1 text-[#9CA3AF] text-xs font-semibold whitespace-nowrap hover:text-[#6B7280] transition-colors"
                      >
                        <span>{getString(subSection.titleKey)}</span>
                        <span className="text-xs">{expandedSections[subSection.titleKey] ? '▼' : '▶'}</span>
                      </button>
                      {expandedSections[subSection.titleKey] && (
                        <div className="flex flex-col pl-2">
                          {subSection.items.map((item) => (
                            <Link key={item.href} href={item.href}>
                              <button className="w-full text-left py-1 px-2 bg-transparent rounded-md text-[#374151] text-xs cursor-pointer transition-colors hover:bg-[#E5E7EB] whitespace-nowrap">
                                {getString(item.labelKey)}
                              </button>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
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
