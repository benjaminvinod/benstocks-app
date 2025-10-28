// src/components/ThemeSelector.js
import React from 'react';
import { Select, Box } from '@chakra-ui/react';
import { useTheme } from '../context/ThemeContext';

function ThemeSelector() {
  const { themeName, setThemeName, themes } = useTheme();

  const handleThemeChange = (event) => {
    setThemeName(event.target.value);
  };

  return (
    <Box minWidth="150px">
      <Select
        size="sm" // Make it smaller to fit in header
        value={themeName}
        onChange={handleThemeChange}
        bg="var(--bg-secondary-dynamic, var(--bg-dark-secondary))" // Use dynamic bg
        borderColor="var(--border-dynamic, var(--border-color))" // Use dynamic border
        color="var(--text-primary-dynamic, var(--text-primary))" // Use dynamic text
        cursor="pointer"
        _hover={{ borderColor: 'var(--brand-primary-dynamic, var(--brand-primary))' }}
        _focus={{
             borderColor: 'var(--brand-primary-dynamic, var(--brand-primary))',
             boxShadow: '0 0 0 1px var(--brand-primary-dynamic, var(--brand-primary))'
        }}
      >
        {Object.entries(themes).map(([key, theme]) => (
          <option key={key} value={key} style={{ backgroundColor: theme.bgSecondary, color: theme.textPrimary }}>
            {theme.name}
          </option>
        ))}
      </Select>
    </Box>
  );
}

export default ThemeSelector;