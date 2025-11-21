export const isRTL = (language: string): boolean => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi', 'ji', 'iw', 'ku', 'ps', 'sd'];
  return rtlLanguages.includes(language.toLowerCase());
};

export const getDirection = (language: string): 'ltr' | 'rtl' => {
  return isRTL(language) ? 'rtl' : 'ltr';
};

export const applyRTL = (language: string): void => {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = getDirection(language);
    document.documentElement.lang = language;
  }
};

export const mirrorStyles = (language: string): Record<string, string> => {
  const direction = getDirection(language);
  
  if (direction === 'rtl') {
    return {
      'text-left': 'text-right',
      'text-right': 'text-left',
      'ml-': 'mr-',
      'mr-': 'ml-',
      'pl-': 'pr-',
      'pr-': 'pl-',
      'left-': 'right-',
      'right-': 'left-',
      'border-l': 'border-r',
      'border-r': 'border-l',
      'rounded-l': 'rounded-r',
      'rounded-r': 'rounded-l',
    };
  }
  
  return {};
};

export const formatNumberRTL = (number: string | number, language: string): string => {
  const numStr = typeof number === 'number' ? number.toString() : number;
  
  if (isRTL(language)) {
    return numStr.split('').reverse().join('');
  }
  
  return numStr;
};