import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ColorPalette, ThemeMode } from './colors';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ColorPalette;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: colors.light,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem('launchpad-theme').then((saved) => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
  }, []);

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem('launchpad-theme', newMode);
  };

  const toggleTheme = () => {
    setTheme(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ mode, colors: colors[mode], toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
