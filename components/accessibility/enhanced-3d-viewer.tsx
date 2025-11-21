'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '@/lib/accessibility/context';
import { useAccessibilityFeatures } from '@/lib/accessibility/use-accessibility-features';
import { ARIA_LABELS } from '@/lib/accessibility/aria-labels';
import { VIEWER_3D_SHORTCUTS } from '@/lib/accessibility/keyboard-shortcuts';

interface ViewerControls {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  zoom: number;
  autoRotate: boolean;
  wireframe: boolean;
}

interface Enhanced3DViewerProps {
  title?: string;
  description?: string;
  molecule?: string;
  onControlsChange?: (controls: ViewerControls) => void;
  className?: string;
}

export function Enhanced3DViewer({
  title = '3D Molecular Viewer',
  description = 'Interactive 3D molecular visualization',
  molecule = 'water',
  onControlsChange,
  className = ''
}: Enhanced3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState<ViewerControls>({
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    zoom: 1,
    autoRotate: false,
    wireframe: false
  });
  
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  
  const { announceToScreenReader } = useAccessibility();
  const { addARIAAttributes, handleKeyboardNavigation, announceChange } = useAccessibilityFeatures(viewerRef as React.RefObject<HTMLElement>, {
    context: '3d-viewer',
    announceOnMount: true,
    announceMessage: `${title} loaded. Use arrow keys to rotate, +/- to zoom, Space to auto-rotate.`,
    keyboardShortcuts: VIEWER_3D_SHORTCUTS.map(shortcut => ({
      key: shortcut.key,
      handler: () => handleViewerShortcut(shortcut.key),
      description: shortcut.description,
      global: false
    }))
  });
  
  // Add ARIA attributes to viewer
  useEffect(() => {
    if (viewerRef.current) {
      addARIAAttributes({
        role: 'application',
        label: title,
        describedBy: 'viewer-description'
      });
    }
  }, [addARIAAttributes, title]);
  
  // Add ARIA attributes to canvas
  useEffect(() => {
    if (canvasRef.current) {
      addARIAAttributes({
        role: 'img',
        label: ARIA_LABELS.viewer3d,
        describedBy: 'canvas-description'
      });
    }
  }, [addARIAAttributes]);
  
  // Handle viewer shortcuts
  const handleViewerShortcut = (shortcut: string) => {
    switch (shortcut) {
      case 'ArrowUp':
        rotateView('up');
        break;
      case 'ArrowDown':
        rotateView('down');
        break;
      case 'ArrowLeft':
        rotateView('left');
        break;
      case 'ArrowRight':
        rotateView('right');
        break;
      case '+':
      case '=':
        zoomView('in');
        break;
      case '-':
      case '_':
        zoomView('out');
        break;
      case ' ':
        toggleAutoRotate();
        break;
      case 'r':
      case 'R':
        resetView();
        break;
    }
  };
  
  // Rotate view
  const rotateView = (direction: 'up' | 'down' | 'left' | 'right') => {
    setControls(prev => {
      const newControls = { ...prev };
      const step = 15; // degrees
      
      switch (direction) {
        case 'up':
          newControls.rotateX = (prev.rotateX - step) % 360;
          break;
        case 'down':
          newControls.rotateX = (prev.rotateX + step) % 360;
          break;
        case 'left':
          newControls.rotateY = (prev.rotateY - step) % 360;
          break;
        case 'right':
          newControls.rotateY = (prev.rotateY + step) % 360;
          break;
      }
      
      announceChange(`Rotated ${direction}. X: ${newControls.rotateX}°, Y: ${newControls.rotateY}°`);
      return newControls;
    });
  };
  
  // Zoom view
  const zoomView = (direction: 'in' | 'out') => {
    setControls(prev => {
      const step = 0.2;
      const newZoom = direction === 'in' 
        ? Math.min(prev.zoom + step, 5) 
        : Math.max(prev.zoom - step, 0.1);
      
      announceChange(`Zoomed ${direction}. Zoom: ${Math.round(newZoom * 100)}%`);
      return { ...prev, zoom: newZoom };
    });
  };
  
  // Toggle auto-rotate
  const toggleAutoRotate = () => {
    setControls(prev => {
      const newAutoRotate = !prev.autoRotate;
      announceChange(`Auto-rotate ${newAutoRotate ? 'enabled' : 'disabled'}`);
      return { ...prev, autoRotate: newAutoRotate };
    });
  };
  
  // Reset view
  const resetView = () => {
    setControls({
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      zoom: 1,
      autoRotate: false,
      wireframe: false
    });
    announceChange('View reset to default position');
  };
  
  // Toggle wireframe
  const toggleWireframe = () => {
    setControls(prev => {
      const newWireframe = !prev.wireframe;
      announceChange(`Wireframe mode ${newWireframe ? 'enabled' : 'disabled'}`);
      return { ...prev, wireframe: newWireframe };
    });
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    handleKeyboardNavigation(event, {
      onEscape: () => setHelpVisible(false),
      preventDefault: true
    });
  };
  
  // Draw placeholder molecule
  const drawMolecule = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    controls: ViewerControls
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.3 * controls.zoom;
    
    // Apply rotation (simplified 2D representation)
    const rotation = (controls.rotateY * Math.PI) / 180;
    
    // Draw atoms
    const atoms = [
      { x: 0, y: 0, element: 'O', color: '#ff0000', size: 20 },
      { x: -0.5, y: -0.5, element: 'H', color: '#ffffff', size: 15 },
      { x: 0.5, y: -0.5, element: 'H', color: '#ffffff', size: 15 }
    ];
    
    // Draw bonds
    ctx.strokeStyle = controls.wireframe ? '#666' : '#999';
    ctx.lineWidth = 2;
    
    // Bond from O to H1
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX - scale * 0.5, centerY - scale * 0.5);
    ctx.stroke();
    
    // Bond from O to H2
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + scale * 0.5, centerY - scale * 0.5);
    ctx.stroke();
    
    // Draw atoms
    atoms.forEach(atom => {
      const x = centerX + atom.x * scale * Math.cos(rotation);
      const y = centerY + atom.y * scale * Math.sin(rotation);
      
      // Atom circle
      ctx.fillStyle = atom.color;
      ctx.beginPath();
      ctx.arc(x, y, atom.size * controls.zoom, 0, 2 * Math.PI);
      ctx.fill();
      
      if (controls.wireframe) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Element label
      ctx.fillStyle = atom.color === '#ffffff' ? '#000' : '#fff';
      ctx.font = `${14 * controls.zoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(atom.element, x, y);
    });
    
    // Draw rotation indicators
    if (controls.autoRotate) {
      ctx.fillStyle = '#3b82f6';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Auto-rotating...', 10, 20);
    }
  };
  
  // Simulate 3D rendering (placeholder for actual 3D library)
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawMolecule(ctx, canvas.width, canvas.height, controls);
    
  }, [controls, molecule]);
  
  // Auto-rotation effect
  useEffect(() => {
    if (!controls.autoRotate) return;
    
    const interval = setInterval(() => {
      setControls(prev => ({
        ...prev,
        rotateY: (prev.rotateY + 2) % 360
      }));
    }, 100);
    
    return () => clearInterval(interval);
  }, [controls.autoRotate]);
  
  // Notify parent of controls change
  useEffect(() => {
    onControlsChange?.(controls);
  }, [controls, onControlsChange]);
  
  return (
    <div 
      ref={viewerRef}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p id="viewer-description" className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setHelpVisible(!helpVisible);
              announceToScreenReader(`Help ${!helpVisible ? 'opened' : 'closed'}`);
            }}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-expanded={helpVisible}
            aria-label="Toggle help information"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Help Panel */}
      {helpVisible && (
        <div 
          className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          role="region"
          aria-label="Viewer help information"
        >
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
            Keyboard Controls
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <div className="font-medium mb-1">Rotation:</div>
              <div>↑↓←→ Arrow keys</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Rotate the molecule in 3D space
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Zoom:</div>
              <div>+ / - keys</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Zoom in and out of the molecule
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Auto-rotate:</div>
              <div>Space bar</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Toggle automatic rotation
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Reset:</div>
              <div>R key</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Reset view to default position
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 3D Canvas */}
      <div className="mb-4">
        <canvas
          ref={canvasRef}
          className="w-full h-96 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
          id="canvas-description"
          aria-label="3D molecular visualization canvas"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75">
            <div className="text-gray-600 dark:text-gray-400">Loading 3D model...</div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
            <div className="text-red-600 dark:text-red-400">Error: {error}</div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="space-y-4">
        {/* Rotation Controls */}
        <div className="grid grid-cols-3 gap-2">
          <div></div>
          <button
            onClick={() => rotateView('up')}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={ARIA_LABELS.rotateUp}
            title="↑ - Rotate up"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <div></div>
          
          <button
            onClick={() => rotateView('left')}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={ARIA_LABELS.rotateLeft}
            title="← - Rotate left"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={resetView}
            className="p-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={ARIA_LABELS.resetView}
            title="R - Reset view"
          >
            <svg className="w-5 h-5 mx-auto text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button
            onClick={() => rotateView('right')}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={ARIA_LABELS.rotateRight}
            title="→ - Rotate right"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <div></div>
          <button
            onClick={() => rotateView('down')}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={ARIA_LABELS.rotateDown}
            title="↓ - Rotate down"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div></div>
        </div>
        
        {/* Zoom and Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => zoomView('out')}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={ARIA_LABELS.zoomOut}
              title="- - Zoom out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
              {Math.round(controls.zoom * 100)}%
            </div>
            
            <button
              onClick={() => zoomView('in')}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={ARIA_LABELS.zoomIn}
              title="+ - Zoom in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoRotate}
              className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                controls.autoRotate
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              aria-pressed={controls.autoRotate}
              aria-label={ARIA_LABELS.autoRotate}
              title="Space - Toggle auto-rotate"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <button
              onClick={toggleWireframe}
              className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                controls.wireframe
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              aria-pressed={controls.wireframe}
              aria-label="Toggle wireframe mode"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Status Information */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400">Rotation X</div>
            <div className="font-mono text-gray-900 dark:text-white">{controls.rotateX}°</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Rotation Y</div>
            <div className="font-mono text-gray-900 dark:text-white">{controls.rotateY}°</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Zoom</div>
            <div className="font-mono text-gray-900 dark:text-white">{Math.round(controls.zoom * 100)}%</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Auto-rotate</div>
            <div className="text-gray-900 dark:text-white">{controls.autoRotate ? 'On' : 'Off'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
