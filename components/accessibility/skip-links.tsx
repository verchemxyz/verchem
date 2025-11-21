'use client';

import React, { useEffect, useState } from 'react';
import { useAccessibility } from '@/lib/accessibility/context';

interface SkipLink {
  id: string;
  text: string;
  targetId: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

const DEFAULT_LINKS: SkipLink[] = [
  { id: 'skip-main', text: 'Skip to main content', targetId: 'main-content' },
  { id: 'skip-nav', text: 'Skip to navigation', targetId: 'main-navigation' },
  { id: 'skip-search', text: 'Skip to search', targetId: 'search-form' },
  { id: 'skip-footer', text: 'Skip to footer', targetId: 'footer' }
];

export function SkipLinks({ links = DEFAULT_LINKS }: SkipLinksProps) {
  const [visibleLink, setVisibleLink] = useState<string | null>(null);
  const { announceToScreenReader } = useAccessibility();
  
  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      const skipLink = target.closest('.skip-link') as HTMLElement;
      
      if (skipLink) {
        setVisibleLink(skipLink.id);
      } else {
        setVisibleLink(null);
      }
    };
    
    const handleBlur = () => {
      setVisibleLink(null);
    };
    
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);
  
  const handleSkipLinkClick = (link: SkipLink) => (event: React.MouseEvent) => {
    event.preventDefault();
    
    const targetElement = document.getElementById(link.targetId);
    if (targetElement) {
      // Set tabindex to -1 to make it focusable programmatically
      targetElement.setAttribute('tabindex', '-1');
      targetElement.focus();
      
      // Announce to screen reader
      announceToScreenReader(`Skipped to ${link.text.toLowerCase()}`);
      
      // Remove tabindex after focus to maintain normal tab order
      setTimeout(() => {
        targetElement.removeAttribute('tabindex');
      }, 100);
    } else {
      announceToScreenReader(`Target "${link.targetId}" not found`);
    }
  };
  
  return (
    <div className="skip-links-container">
      {links.map((link) => (
        <a
          key={link.id}
          id={link.id}
          href={`#${link.targetId}`}
          onClick={handleSkipLinkClick(link)}
          className={`skip-link ${visibleLink === link.id ? 'visible' : ''}`}
          aria-label={link.text}
        >
          {link.text}
        </a>
      ))}
      
      <style jsx>{`
        .skip-links-container {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 9999;
        }
        
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: #000;
          color: #fff;
          padding: 8px;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          transition: top 0.3s ease-in-out;
          white-space: nowrap;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .skip-link:focus,
        .skip-link.visible {
          top: 6px;
        }
        
        .skip-link:hover {
          background: #333;
          text-decoration: underline;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .skip-link {
            background: #000;
            color: #fff;
            border: 3px solid #fff;
            box-shadow: 0 0 0 3px #000;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .skip-link {
            transition: none;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .skip-link {
            background: #fff;
            color: #000;
            border-color: #000;
          }
          
          .skip-link:hover {
            background: #f0f0f0;
          }
        }
      `}</style>
    </div>
  );
}

// Component to add skip link targets to your page sections
export function SkipLinkTarget({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="skip-target">
      {children}
      <style jsx>{`
        .skip-target:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }
        
        /* High contrast mode focus indicator */
        @media (prefers-contrast: high) {
          .skip-target:focus {
            outline: 3px solid;
            outline-color: -webkit-focus-ring-color;
          }
        }
      `}</style>
    </div>
  );
}

// Utility function to programmatically add skip links to a page
export function addSkipLinksToPage(customLinks?: SkipLink[]) {
  if (typeof document === 'undefined') return;
  
  const links = customLinks || DEFAULT_LINKS;
  const container = document.createElement('div');
  container.setAttribute('role', 'navigation');
  container.setAttribute('aria-label', 'Skip links');
  container.className = 'skip-links-wrapper';
  
  links.forEach(link => {
    const anchor = document.createElement('a');
    anchor.href = `#${link.targetId}`;
    anchor.textContent = link.text;
    anchor.className = 'skip-link';
    anchor.id = link.id;
    
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.targetId);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        setTimeout(() => target.removeAttribute('tabindex'), 100);
      }
    });
    
    container.appendChild(anchor);
  });
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .skip-links-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 9999;
    }
    
    .skip-link {
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      transition: top 0.3s ease-in-out;
      white-space: nowrap;
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .skip-link:focus {
      top: 6px;
    }
    
    .skip-link:hover {
      background: #333;
      text-decoration: underline;
    }
  `;
  
  document.head.appendChild(style);
  document.body.insertBefore(container, document.body.firstChild);
}