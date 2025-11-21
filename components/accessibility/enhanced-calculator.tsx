'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccessibilityFeatures } from '@/lib/accessibility/use-accessibility-features';
import { ARIA_LABELS, createCalculatorButtonLabel } from '@/lib/accessibility/aria-labels';
import { CALCULATOR_SHORTCUTS } from '@/lib/accessibility/keyboard-shortcuts';

interface CalculatorButton {
  label: string;
  action: string;
  type: 'number' | 'operator' | 'function' | 'special';
  shortcut?: string;
  scientific?: boolean;
  description: string;
}

const CALCULATOR_BUTTONS: CalculatorButton[] = [
  // Basic buttons
  { label: 'C', action: 'clear', type: 'special', shortcut: 'Ctrl+R', description: 'Clear all' },
  { label: 'CE', action: 'clear-entry', type: 'special', description: 'Clear entry' },
  { label: '←', action: 'backspace', type: 'special', description: 'Backspace' },
  { label: '±', action: 'toggle-sign', type: 'special', description: 'Toggle sign' },
  
  { label: '7', action: '7', type: 'number', description: 'Number 7' },
  { label: '8', action: '8', type: 'number', description: 'Number 8' },
  { label: '9', action: '9', type: 'number', description: 'Number 9' },
  { label: '÷', action: 'divide', type: 'operator', description: 'Divide' },
  
  { label: '4', action: '4', type: 'number', description: 'Number 4' },
  { label: '5', action: '5', type: 'number', description: 'Number 5' },
  { label: '6', action: '6', type: 'number', description: 'Number 6' },
  { label: '×', action: 'multiply', type: 'operator', description: 'Multiply' },
  
  { label: '1', action: '1', type: 'number', description: 'Number 1' },
  { label: '2', action: '2', type: 'number', description: 'Number 2' },
  { label: '3', action: '3', type: 'number', description: 'Number 3' },
  { label: '-', action: 'subtract', type: 'operator', description: 'Subtract' },
  
  { label: '0', action: '0', type: 'number', description: 'Number 0' },
  { label: '.', action: 'decimal', type: 'number', description: 'Decimal point' },
  { label: '=', action: 'equals', type: 'special', shortcut: 'Ctrl+Enter', description: 'Calculate result' },
  { label: '+', action: 'add', type: 'operator', description: 'Add' },
  
  // Scientific buttons
  { label: 'sin', action: 'sin', type: 'function', scientific: true, description: 'Sine function' },
  { label: 'cos', action: 'cos', type: 'function', scientific: true, description: 'Cosine function' },
  { label: 'tan', action: 'tan', type: 'function', scientific: true, description: 'Tangent function' },
  { label: 'ln', action: 'ln', type: 'function', scientific: true, description: 'Natural logarithm' },
  
  { label: 'x²', action: 'square', type: 'function', scientific: true, description: 'Square' },
  { label: '√', action: 'sqrt', type: 'function', scientific: true, description: 'Square root' },
  { label: 'xʸ', action: 'power', type: 'function', scientific: true, description: 'Power' },
  { label: 'log', action: 'log', type: 'function', scientific: true, description: 'Logarithm' },
  
  { label: 'π', action: 'pi', type: 'function', scientific: true, description: 'Pi constant' },
  { label: 'e', action: 'e', type: 'function', scientific: true, description: 'Euler number' },
  { label: '(', action: 'lparen', type: 'special', scientific: true, description: 'Left parenthesis' },
  { label: ')', action: 'rparen', type: 'special', scientific: true, description: 'Right parenthesis' },
];

interface EnhancedCalculatorProps {
  title?: string;
  description?: string;
  scientific?: boolean;
  onCalculate?: (expression: string, result: number) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function EnhancedCalculator({
  title = 'Calculator',
  description = 'Accessible chemistry calculator',
  scientific = false,
  onCalculate,
  onError,
  className = ''
}: EnhancedCalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isScientific, setIsScientific] = useState(scientific);
  
  const calculatorRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLInputElement>(null);
  
  const { addARIAAttributes, announceChange } = useAccessibilityFeatures(calculatorRef as React.RefObject<HTMLElement>, {
    context: 'calculator',
    announceOnMount: true,
    announceMessage: `${title} loaded. Press Ctrl+Enter to calculate, Ctrl+R to reset.`,
    keyboardShortcuts: CALCULATOR_SHORTCUTS.map(shortcut => ({
      key: shortcut.key,
      handler: () => handleShortcut(shortcut.key),
      description: shortcut.description,
      global: false
    }))
  });
  
  // Add ARIA attributes to calculator
  useEffect(() => {
    if (calculatorRef.current) {
      addARIAAttributes({
        role: 'application',
        label: title,
        describedBy: 'calculator-description'
      });
    }
  }, [addARIAAttributes, title]);
  
  // Add ARIA attributes to display
  useEffect(() => {
    if (displayRef.current) {
      addARIAAttributes({
        role: 'textbox',
        label: ARIA_LABELS.inputField,
        live: 'polite',
        atomic: true
      });
    }
  }, [addARIAAttributes]);
  
  // Handle calculator shortcuts
  const handleShortcut = (shortcut: string) => {
    switch (shortcut) {
      case 'Ctrl+Enter':
        performCalculation();
        break;
      case 'Ctrl+R':
        clearCalculator();
        break;
      case 'Ctrl+S':
        saveResult();
        break;
      case 'Ctrl+Z':
        undoLastAction();
        break;
    }
  };
  
  // Input validation
  const validateInput = (input: string): boolean => {
    // Prevent multiple decimal points in a number
    if (input === '.' && display.includes('.')) {
      return false;
    }
    
    // Prevent leading zeros
    if (input !== '.' && display === '0' && input !== '0') {
      return true;
    }
    
    return true;
  };
  
  // Handle button click
  const handleButtonClick = (button: CalculatorButton) => {
    try {
      switch (button.type) {
        case 'number':
          inputNumber(button.label);
          break;
        case 'operator':
          inputOperator(button.action);
          break;
        case 'function':
          inputFunction(button.action);
          break;
        case 'special':
          handleSpecialAction(button.action);
          break;
      }
      
      announceChange(`${button.label} pressed`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Calculation error';
      announceChange(`Error: ${errorMessage}`, 'assertive');
      onError?.(errorMessage);
    }
  };
  
  // Input number
  const inputNumber = (num: string) => {
    if (!validateInput(num)) return;
    
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };
  
  // Input operator
  const inputOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      
      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }
    
    setWaitingForOperand(true);
    setOperation(nextOperator);
  };
  
  // Input function
  const inputFunction = (func: string) => {
    const inputValue = parseFloat(display);
    let result = inputValue;
    
    switch (func) {
      case 'sin':
        result = Math.sin(inputValue * Math.PI / 180);
        break;
      case 'cos':
        result = Math.cos(inputValue * Math.PI / 180);
        break;
      case 'tan':
        result = Math.tan(inputValue * Math.PI / 180);
        break;
      case 'ln':
        if (inputValue <= 0) throw new Error('Natural log of non-positive number');
        result = Math.log(inputValue);
        break;
      case 'log':
        if (inputValue <= 0) throw new Error('Log of non-positive number');
        result = Math.log10(inputValue);
        break;
      case 'sqrt':
        if (inputValue < 0) throw new Error('Square root of negative number');
        result = Math.sqrt(inputValue);
        break;
      case 'square':
        result = inputValue * inputValue;
        break;
      case 'power':
        setPreviousValue(inputValue);
        setOperation('^');
        setWaitingForOperand(true);
        return;
      case 'pi':
        result = Math.PI;
        break;
      case 'e':
        result = Math.E;
        break;
    }
    
    setDisplay(String(result));
  };
  
  // Handle special actions
  const handleSpecialAction = (action: string) => {
    switch (action) {
      case 'clear':
        clearCalculator();
        break;
      case 'clear-entry':
        setDisplay('0');
        break;
      case 'backspace':
        setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
        break;
      case 'toggle-sign':
        setDisplay(String(parseFloat(display) * -1));
        break;
      case 'equals':
        performCalculation();
        break;
      case 'lparen':
        setDisplay(display + '(');
        break;
      case 'rparen':
        setDisplay(display + ')');
        break;
    }
  };
  
  // Perform calculation
  const performCalculation = () => {
    const inputValue = parseFloat(display);
    
    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      
      const expression = `${previousValue} ${getOperationSymbol(operation)} ${inputValue}`;
      setHistory([...history, `${expression} = ${newValue}`]);
      
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
      
      announceChange(`Calculation complete: ${expression} equals ${newValue}`);
      onCalculate?.(expression, newValue);
    }
  };
  
  // Calculate result
  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case 'add':
        return firstValue + secondValue;
      case 'subtract':
        return firstValue - secondValue;
      case 'multiply':
        return firstValue * secondValue;
      case 'divide':
        if (secondValue === 0) throw new Error('Division by zero');
        return firstValue / secondValue;
      case '^':
        return Math.pow(firstValue, secondValue);
      default:
        return secondValue;
    }
  };
  
  // Get operation symbol
  const getOperationSymbol = (operation: string): string => {
    switch (operation) {
      case 'add': return '+';
      case 'subtract': return '-';
      case 'multiply': return '×';
      case 'divide': return '÷';
      case '^': return '^';
      default: return operation;
    }
  };
  
  // Clear calculator
  const clearCalculator = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    announceChange('Calculator cleared');
  };
  
  // Save result
  const saveResult = () => {
    const result = display;
    navigator.clipboard.writeText(result);
    announceChange(`Result ${result} copied to clipboard`);
  };
  
  // Undo last action
  const undoLastAction = () => {
    if (history.length > 0) {
      const lastEntry = history[history.length - 1];
      const parts = lastEntry.split(' = ');
      if (parts.length === 2) {
        setDisplay(parts[1]);
        setHistory(history.slice(0, -1));
        announceChange('Last action undone');
      }
    }
  };
  
  // Handle keyboard input
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const key = event.key;
    
    if (key >= '0' && key <= '9') {
      inputNumber(key);
    } else {
      switch (key) {
        case '+':
          inputOperator('add');
          break;
        case '-':
          inputOperator('subtract');
          break;
        case '*':
          inputOperator('multiply');
          break;
        case '/':
          inputOperator('divide');
          break;
        case '.':
        case ',':
          inputNumber('.');
          break;
        case 'Enter':
        case '=':
          performCalculation();
          break;
        case 'Escape':
          clearCalculator();
          break;
        case 'Backspace':
          handleSpecialAction('backspace');
          break;
      }
    }
  };
  
  // Filter buttons based on scientific mode
  const visibleButtons = CALCULATOR_BUTTONS.filter(button => 
    !button.scientific || isScientific
  );
  
  return (
    <div 
      ref={calculatorRef}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p id="calculator-description" className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            setIsScientific(!isScientific);
            announceChange(`Scientific mode ${!isScientific ? 'enabled' : 'disabled'}`);
          }}
          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-pressed={isScientific}
          aria-label="Toggle scientific calculator mode"
        >
          {isScientific ? 'Basic' : 'Scientific'}
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={undoLastAction}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Undo last action"
            title="Ctrl+Z - Undo"
          >
            Undo
          </button>
          <button
            onClick={saveResult}
            className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Save result to clipboard"
            title="Ctrl+S - Save result"
          >
            Save
          </button>
        </div>
      </div>
      
      {/* Display */}
      <div className="mb-4">
        <input
          ref={displayRef}
          type="text"
          value={display}
          readOnly
          className="w-full px-4 py-3 text-right text-2xl font-mono bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
          aria-label="Calculator display"
        />
      </div>
      
      {/* Button Grid */}
      <div className="grid grid-cols-4 gap-2">
        {visibleButtons.map((button, index) => (
          <button
            key={`${button.label}-${index}`}
            onClick={() => handleButtonClick(button)}
            className={`h-12 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors ${
              button.type === 'number'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                : button.type === 'operator'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                : button.type === 'function'
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
            }`}
            aria-label={createCalculatorButtonLabel(button.label, button.type)}
            title={button.shortcut ? `${button.shortcut} - ${button.description}` : button.description}
          >
            {button.label}
          </button>
        ))}
      </div>
      
      {/* History */}
      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            History
          </h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {history.slice(-5).map((entry, index) => (
              <div 
                key={index}
                className="text-sm font-mono text-gray-600 dark:text-gray-400"
                role="log"
                aria-live="polite"
              >
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Keyboard shortcuts info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Keyboard shortcuts:</div>
          <div className="grid grid-cols-2 gap-2">
            <div><kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Ctrl+Enter</kbd> Calculate</div>
            <div><kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Ctrl+R</kbd> Reset</div>
            <div><kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Ctrl+S</kbd> Save</div>
            <div><kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Ctrl+Z</kbd> Undo</div>
          </div>
        </div>
      </div>
    </div>
  );
}
