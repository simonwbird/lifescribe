import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Target, X } from 'lucide-react';

interface ElementInfo {
  selector: string;
  fallbackText: string;
  element: string;
  position: { x: number; y: number; width: number; height: number };
}

interface ElementPickerProps {
  isActive: boolean;
  onElementSelected: (elementInfo: ElementInfo) => void;
  onCancel: () => void;
}

export const ElementPicker = ({ isActive, onElementSelected, onCancel }: ElementPickerProps) => {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  // Generate robust CSS selector
  const generateSelector = useCallback((element: HTMLElement): string => {
    const selectors: string[] = [];
    
    // Try ID first
    if (element.id) {
      selectors.push(`#${element.id}`);
    }
    
    // Try class names
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(cls => cls.trim());
      if (classes.length > 0) {
        selectors.push(`.${classes.join('.')}`);
      }
    }
    
    // Try data attributes
    const dataAttrs = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => `[${attr.name}="${attr.value}"]`);
    selectors.push(...dataAttrs);
    
    // Fallback to tag name with nth-child
    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      selectors.push(`${tagName}:nth-child(${index})`);
    }
    
    // Return the most specific available selector
    return selectors[0] || tagName;
  }, []);

  const getFallbackText = useCallback((element: HTMLElement): string => {
    // Get text content, placeholder, aria-label, or title
    const text = element.textContent?.trim() || 
                 element.getAttribute('placeholder') || 
                 element.getAttribute('aria-label') || 
                 element.getAttribute('title') || 
                 element.tagName.toLowerCase();
    return text.slice(0, 50);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return;
    
    const element = e.target as HTMLElement;
    
    // Skip if targeting the picker overlay itself
    if (element.closest('.element-picker-overlay')) return;
    
    setHoveredElement(element);
  }, [isActive]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!isActive || !hoveredElement) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = hoveredElement.getBoundingClientRect();
    const elementInfo: ElementInfo = {
      selector: generateSelector(hoveredElement),
      fallbackText: getFallbackText(hoveredElement),
      element: hoveredElement.tagName.toLowerCase(),
      position: {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      }
    };
    
    onElementSelected(elementInfo);
  }, [isActive, hoveredElement, generateSelector, getFallbackText, onElementSelected]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isActive) return;
    
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [isActive, onCancel]);

  useEffect(() => {
    if (!isActive) {
      setHoveredElement(null);
      return;
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyPress);
    
    // Add CSS for highlighting
    const style = document.createElement('style');
    style.id = 'element-picker-style';
    style.textContent = `
      .element-picker-highlight {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
        cursor: crosshair !important;
      }
      
      .element-picker-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        pointer-events: none;
      }
      
      .element-picker-overlay * {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyPress);
      
      // Remove highlight class from all elements
      document.querySelectorAll('.element-picker-highlight')
        .forEach(el => el.classList.remove('element-picker-highlight'));
      
      // Remove style
      const existingStyle = document.getElementById('element-picker-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isActive, handleMouseMove, handleClick, handleKeyPress]);

  // Update highlight on hovered element
  useEffect(() => {
    // Remove highlight from all elements
    document.querySelectorAll('.element-picker-highlight')
      .forEach(el => el.classList.remove('element-picker-highlight'));
    
    // Add highlight to current element
    if (hoveredElement && isActive) {
      hoveredElement.classList.add('element-picker-highlight');
    }
  }, [hoveredElement, isActive]);

  if (!isActive) return null;

  return (
    <div className="element-picker-overlay">
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] pointer-events-auto">
        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
          <Target className="w-5 h-5" />
          <span className="text-sm font-medium">
            Click on any element to select it. Press Esc to cancel.
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            className="ml-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};