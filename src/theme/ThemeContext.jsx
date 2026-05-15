import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPrimaryColor, setPrimaryColor as savePrimaryColor } from '../database/settingsDb';

export const DEFAULT_PRIMARY = '#D4AF37';

const ThemeContext = createContext({
  primaryColor: DEFAULT_PRIMARY,
  setPrimaryColor: () => {},
});

export function ThemeProvider({ children }) {
  const [primaryColor, setPrimaryColorState] = useState(DEFAULT_PRIMARY);

  useEffect(() => {
    getPrimaryColor()
      .then((c) => { if (c) setPrimaryColorState(c); })
      .catch(() => {});
  }, []);

  async function setPrimaryColor(color) {
    setPrimaryColorState(color);
    try { await savePrimaryColor(color); } catch {}
  }

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
