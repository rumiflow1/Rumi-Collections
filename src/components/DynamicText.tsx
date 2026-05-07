import React from 'react';
import { useConfig } from '../context/ConfigContext';
import { Link } from 'react-router-dom';

interface DynamicTextProps {
  id: string;
  defaultContent: string;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
  style?: React.CSSProperties;
}

export default function DynamicText({ id, defaultContent, className, as: Component = 'span', style: extraStyle }: DynamicTextProps) {
  const { getElement } = useConfig();
  const config = getElement(id);

  if (config && !config.isVisible) return null;

  const style: React.CSSProperties = {
    ...(config ? {
      color: config.color || undefined,
      fontFamily: config.fontFamily || undefined,
      fontSize: config.fontSize || undefined,
      background: config.background || undefined,
    } : {}),
    ...extraStyle
  };

  const content = config?.content || defaultContent;

  if (config?.link) {
    const isExternal = config.link.startsWith('http');
    if (isExternal) {
      return (
        <a href={config.link} className={className} style={style} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return (
      <Link to={config.link} className={className} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <Component className={className} style={style}>
      {content}
    </Component>
  );
}
