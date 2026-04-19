// CodeBlock.tsx
// Displays code with syntax highlighting and live preview

"use client";

import React, { useEffect, useState } from 'react';
import { StringManager } from '@/generated/StringManager';

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  file?: string;
  language?: string;
  showPreview?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  className,
  file,
  language = 'json',
  showPreview = true
}) => {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (file) {
      fetch(`/samples/${file}`)
        .then(res => {
          if (!res.ok) throw new Error('File not found');
          return res.text();
        })
        .then(text => {
          setCode(text);
          setLoading(false);
        })
        .catch(() => {
          setCode(`// File not found: ${file}`);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [file]);

  if (loading) {
    return (
      <div className={`${className} bg-[#1E1E1E] rounded-lg p-4`}>
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`${className} flex flex-row gap-4`}>
      {/* Code Panel */}
      <div className="flex-1 bg-[#1E1E1E] rounded-lg overflow-hidden">
        {language && (
          <div className="bg-[#2D2D2D] px-4 py-2 text-xs text-gray-400 border-b border-[#3E3E3E]">
            {language.toUpperCase()}
          </div>
        )}
        <pre className="p-4 overflow-x-auto">
          <code className="text-[#D4D4D4] text-[13px] font-mono whitespace-pre">
            {highlightJson(code)}
          </code>
        </pre>
      </div>

      {/* Preview Panel */}
      {showPreview && file && (
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
            PREVIEW
          </div>
          <div className="p-4">
            <StaticPreview file={file} />
          </div>
        </div>
      )}
    </div>
  );
};

// Static preview components for each sample file
const PreviewComponents: Record<string, React.FC> = {
  'hello_world.json': () => (
    <div className="flex flex-col gap-2">
      <span className="text-2xl">{StringManager.currentLanguage.previewHelloWorld}</span>
      <button className="px-4 py-2 bg-[#087EA4] text-white rounded-lg font-medium">
        {StringManager.currentLanguage.previewClickMe}
      </button>
    </div>
  ),
  'basic_view.json': () => (
    <div className="flex flex-col gap-2 p-4 bg-gray-100 rounded-lg">
      <span className="text-base">{StringManager.currentLanguage.previewHelloJsonui}</span>
    </div>
  ),
  'button_example.json': () => (
    <div className="flex flex-col gap-2">
      <button className="px-4 py-2 bg-[#087EA4] text-white rounded-lg font-medium">
        {StringManager.currentLanguage.previewClickMe}
      </button>
    </div>
  ),
  'data_binding.json': () => (
    <div className="flex flex-col gap-2">
      <span className="text-lg font-semibold">[user.name]</span>
      <span className="text-sm text-gray-500">[user.email]</span>
    </div>
  ),
  'include_example.json': () => (
    <div className="flex flex-col gap-2">
      <div className="p-2 bg-blue-50 border border-dashed border-[#087EA4] rounded text-xs text-[#087EA4]">
        Include: components/header
      </div>
      <span>{StringManager.currentLanguage.previewMainContent}</span>
      <div className="p-2 bg-blue-50 border border-dashed border-[#087EA4] rounded text-xs text-[#087EA4]">
        Include: components/footer
      </div>
    </div>
  ),
  'style_example.json': () => (
    <button className="px-6 py-3 bg-gradient-to-r from-[#087EA4] to-[#06B6D4] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all">
      {StringManager.currentLanguage.previewStyledButton}
    </button>
  ),
  'localization_example.json': () => (
    <div className="flex flex-col gap-2">
      <span>{StringManager.currentLanguage.previewWelcomeMessage}</span>
      <button className="px-4 py-2 bg-[#087EA4] text-white rounded-lg font-medium">
        {StringManager.currentLanguage.previewButtonSubmit}
      </button>
    </div>
  ),
  'collection_example.json': () => (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-gray-400 mb-1">Collection: @{'{users}'}</div>
      {[1, 2].map(i => (
        <div key={i} className="flex flex-row items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
            IMG
          </div>
          <span className="text-sm">[item.name]</span>
        </div>
      ))}
    </div>
  ),
  'form_example.json': () => (
    <div className="flex flex-col gap-3 p-4">
      <span className="text-2xl font-bold">{StringManager.currentLanguage.previewSignUp}</span>
      <input
        type="text"
        placeholder={StringManager.currentLanguage.previewEmailPlaceholder}
        className="px-3 py-2 border border-gray-200 rounded-lg outline-none"
        readOnly
      />
      <input
        type="password"
        placeholder={StringManager.currentLanguage.previewPasswordPlaceholder}
        className="px-3 py-2 border border-gray-200 rounded-lg outline-none"
        readOnly
      />
      <button className="px-4 py-2 bg-[#087EA4] text-white rounded-lg font-medium">
        {StringManager.currentLanguage.previewCreateAccount}
      </button>
    </div>
  ),
  'view_reference.json': () => (
    <div className="flex flex-row p-4 bg-[#F0F0F0] rounded-lg">
      <span className="text-gray-600 text-sm">{StringManager.currentLanguage.previewViewDesc}</span>
    </div>
  ),
  'button_reference.json': () => (
    <button className="px-4 py-2 bg-[#087EA4] text-white rounded-lg font-medium">
      {StringManager.currentLanguage.previewSubmit}
    </button>
  ),
};

// Get static preview for a file
const StaticPreview: React.FC<{ file: string }> = ({ file }) => {
  const PreviewComponent = PreviewComponents[file];
  if (PreviewComponent) {
    return <PreviewComponent />;
  }
  return <span className="text-gray-400 text-sm">Preview not available</span>;
};

// Simple JSON syntax highlighting
function highlightJson(code: string): React.ReactNode {
  if (!code) return null;

  const lines = code.split('\n');

  return lines.map((line, lineIndex) => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Check for leading whitespace
      const indentMatch = remaining.match(/^(\s+)/);
      if (indentMatch) {
        tokens.push(<span key={`${lineIndex}-${keyIndex++}`}>{indentMatch[1]}</span>);
        remaining = remaining.slice(indentMatch[1].length);
        continue;
      }

      // Check for key: "value" pattern
      const keyMatch = remaining.match(/^"([^"]+)"(\s*:\s*)/);
      if (keyMatch) {
        tokens.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-[#9CDCFE]">
            &quot;{keyMatch[1]}&quot;
          </span>
        );
        tokens.push(<span key={`${lineIndex}-${keyIndex++}`}>{keyMatch[2]}</span>);
        remaining = remaining.slice(keyMatch[0].length);
        continue;
      }

      // Check for string value
      const stringMatch = remaining.match(/^"([^"]*)"/);
      if (stringMatch) {
        tokens.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-[#CE9178]">
            &quot;{stringMatch[1]}&quot;
          </span>
        );
        remaining = remaining.slice(stringMatch[0].length);
        continue;
      }

      // Check for boolean
      const boolMatch = remaining.match(/^(true|false)/);
      if (boolMatch) {
        tokens.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-[#569CD6]">
            {boolMatch[1]}
          </span>
        );
        remaining = remaining.slice(boolMatch[0].length);
        continue;
      }

      // Check for null
      const nullMatch = remaining.match(/^null/);
      if (nullMatch) {
        tokens.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-[#569CD6]">
            null
          </span>
        );
        remaining = remaining.slice(4);
        continue;
      }

      // Check for number
      const numMatch = remaining.match(/^(-?\d+\.?\d*)/);
      if (numMatch) {
        tokens.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-[#B5CEA8]">
            {numMatch[1]}
          </span>
        );
        remaining = remaining.slice(numMatch[0].length);
        continue;
      }

      // Check for punctuation
      const punctMatch = remaining.match(/^([{}\[\],:])/);
      if (punctMatch) {
        tokens.push(
          <span key={`${lineIndex}-${keyIndex++}`} className="text-[#D4D4D4]">
            {punctMatch[1]}
          </span>
        );
        remaining = remaining.slice(1);
        continue;
      }

      // Default: take one character
      tokens.push(<span key={`${lineIndex}-${keyIndex++}`}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return (
      <React.Fragment key={lineIndex}>
        {tokens}
        {lineIndex < lines.length - 1 && '\n'}
      </React.Fragment>
    );
  });
}

export default CodeBlock;
