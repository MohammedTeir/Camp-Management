import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  direction: Direction;
  toggleDirection: () => void;
  setDirection: (dir: Direction) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from localStorage or default to 'rtl' for Arabic
  const [direction, setDirectionState] = useState<Direction>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('languageDirection') as Direction) || 'rtl';
    }
    return 'rtl';
  });

  // Apply direction to the document element
  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.lang = 'ar'; // Set language to Arabic
    localStorage.setItem('languageDirection', direction);
  }, [direction]);

  const setDirection = useCallback((dir: Direction) => {
    setDirectionState(dir);
  }, []);

  const toggleDirection = useCallback(() => {
    setDirectionState((prevDir) => (prevDir === 'ltr' ? 'rtl' : 'ltr'));
  }, []);

  return (
    <LanguageContext.Provider value={{
      direction,
      toggleDirection,
      setDirection,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
