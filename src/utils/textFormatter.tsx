/**
 * Text Formatter Utility
 * 
 * Parses markdown-like syntax in messages and renders formatted text
 * Supports: **bold**, *italic*, `code`, ```code blocks```, lists
 */

import React from 'react';
import { Text, StyleSheet, View, TextProps } from 'react-native';

export interface FormattedTextProps extends TextProps {
  text: string;
  baseColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

interface TextSegment {
  type: 'text' | 'bold' | 'italic' | 'code' | 'codeBlock' | 'listItem';
  content: string;
  index: number;
}

/**
 * Parse text with markdown-like syntax
 */
function parseFormattedText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentIndex = 0;
  let buffer = '';
  let i = 0;

  while (i < text.length) {
    // Code blocks (```...```)
    if (text.substring(i, i + 3) === '```') {
      if (buffer) {
        segments.push({ type: 'text', content: buffer, index: currentIndex });
        currentIndex++;
        buffer = '';
      }
      
      const endIndex = text.indexOf('```', i + 3);
      if (endIndex !== -1) {
        const codeContent = text.substring(i + 3, endIndex);
        segments.push({ type: 'codeBlock', content: codeContent, index: currentIndex });
        currentIndex++;
        i = endIndex + 3;
        continue;
      }
    }

    // Inline code (`...`)
    if (text[i] === '`' && text[i - 1] !== '`' && text[i + 1] !== '`') {
      if (buffer) {
        segments.push({ type: 'text', content: buffer, index: currentIndex });
        currentIndex++;
        buffer = '';
      }
      
      const endIndex = text.indexOf('`', i + 1);
      if (endIndex !== -1) {
        const codeContent = text.substring(i + 1, endIndex);
        segments.push({ type: 'code', content: codeContent, index: currentIndex });
        currentIndex++;
        i = endIndex + 1;
        continue;
      }
    }

    // Bold (**text** or __text__)
    if ((text.substring(i, i + 2) === '**' || text.substring(i, i + 2) === '__') && text[i + 2] !== text[i]) {
      if (buffer) {
        segments.push({ type: 'text', content: buffer, index: currentIndex });
        currentIndex++;
        buffer = '';
      }
      
      const marker = text.substring(i, i + 2);
      const endIndex = text.indexOf(marker, i + 2);
      if (endIndex !== -1) {
        const boldContent = text.substring(i + 2, endIndex);
        segments.push({ type: 'bold', content: boldContent, index: currentIndex });
        currentIndex++;
        i = endIndex + 2;
        continue;
      }
    }

    // Italic (*text* or _text_)
    if ((text[i] === '*' || text[i] === '_') && 
        text[i - 1] !== '*' && text[i - 1] !== '_' && 
        text[i + 1] !== '*' && text[i + 1] !== '_') {
      if (buffer) {
        segments.push({ type: 'text', content: buffer, index: currentIndex });
        currentIndex++;
        buffer = '';
      }
      
      const marker = text[i];
      const endIndex = text.indexOf(marker, i + 1);
      if (endIndex !== -1) {
        const italicContent = text.substring(i + 1, endIndex);
        segments.push({ type: 'italic', content: italicContent, index: currentIndex });
        currentIndex++;
        i = endIndex + 1;
        continue;
      }
    }

    // List items (- or 1.)
    if (i === 0 || text[i - 1] === '\n') {
      if (text[i] === '-' || text[i] === '*' || (text[i] >= '0' && text[i] <= '9' && text[i + 1] === '.')) {
        if (buffer) {
          segments.push({ type: 'text', content: buffer, index: currentIndex });
          currentIndex++;
          buffer = '';
        }
        
        let listContent = '';
        let j = i;
        if (text[j] >= '0' && text[j] <= '9') {
          // Numbered list (1. item)
          j += 2; // Skip "1."
        } else {
          // Bullet list (- item)
          j += 1; // Skip "-"
        }
        
        // Skip whitespace
        while (j < text.length && (text[j] === ' ' || text[j] === '\t')) {
          j++;
        }
        
        // Get content until newline
        const lineEnd = text.indexOf('\n', j);
        if (lineEnd !== -1) {
          listContent = text.substring(j, lineEnd);
          segments.push({ type: 'listItem', content: listContent, index: currentIndex });
          currentIndex++;
          i = lineEnd + 1;
          continue;
        }
      }
    }

    buffer += text[i];
    i++;
  }

  if (buffer) {
    segments.push({ type: 'text', content: buffer, index: currentIndex });
  }

  return segments;
}

/**
 * Render formatted text component
 * Note: React Native Text component can nest Text components
 */
export function FormattedText({ 
  text, 
  baseColor = '#000000', 
  fontSize = 15,
  fontFamily,
  style,
  ...props 
}: FormattedTextProps) {
  const segments = parseFormattedText(text);

  return (
    <Text style={[{ color: baseColor, fontSize, fontFamily }, style]} {...props}>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'bold':
            return (
              <Text key={index} style={{ fontWeight: 'bold', color: baseColor, fontSize }}>
                {segment.content}
              </Text>
            );
          
          case 'italic':
            return (
              <Text key={index} style={{ fontStyle: 'italic', color: baseColor, fontSize }}>
                {segment.content}
              </Text>
            );
          
          case 'code':
            return (
              <Text key={index} style={{ 
                fontFamily: 'monospace',
                backgroundColor: 'rgba(0,0,0,0.1)',
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 4,
                color: baseColor,
                fontSize: fontSize - 1,
              }}>
                {segment.content}
              </Text>
            );
          
          case 'codeBlock':
            // Code blocks are handled separately in FormattedTextWithBlocks
            return (
              <Text key={index} style={{ 
                fontFamily: 'monospace',
                color: baseColor,
                fontSize: fontSize - 1,
              }}>
                {'\n'}{segment.content}{'\n'}
              </Text>
            );
          
          case 'listItem':
            return (
              <Text key={index} style={{ color: baseColor, fontSize }}>
                {'\n'}• {segment.content}
              </Text>
            );
          
          default:
            return <Text key={index} style={{ color: baseColor, fontSize }}>{segment.content}</Text>;
        }
      })}
    </Text>
  );
}

/**
 * Render formatted text with code block support (for multiline)
 */
export function FormattedTextWithBlocks({ 
  text, 
  baseColor = '#000000', 
  fontSize = 15,
  fontFamily,
  style,
  ...props 
}: FormattedTextProps) {
  // Split by code blocks first
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const parts: Array<{ type: 'text' | 'code'; content: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = text.substring(lastIndex, match.index);
      if (textContent.trim()) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    
    // Add code block
    parts.push({ type: 'code', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const textContent = text.substring(lastIndex);
    if (textContent.trim()) {
      parts.push({ type: 'text', content: textContent });
    }
  }

  // If no code blocks found, use simple formatted text
  if (parts.length === 0) {
    return <FormattedText text={text} baseColor={baseColor} fontSize={fontSize} fontFamily={fontFamily} style={style} {...props} />;
  }

  return (
    <View>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <View 
              key={index}
              style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: 8,
                borderRadius: 8,
                marginVertical: 4,
              }}
            >
              <Text 
                style={{
                  fontFamily: 'monospace',
                  fontSize: fontSize - 1,
                  color: baseColor,
                }}
              >
                {part.content}
              </Text>
            </View>
          );
        }
        
        return (
          <FormattedText
            key={index}
            text={part.content}
            baseColor={baseColor}
            fontSize={fontSize}
            fontFamily={fontFamily}
            style={style}
            {...props}
          />
        );
      })}
    </View>
  );
}

