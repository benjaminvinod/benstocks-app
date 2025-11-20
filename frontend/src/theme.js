// src/theme.js
import { extendTheme } from '@chakra-ui/react';

// --- PROFESSIONAL FINANCIAL PALETTE ---
const colors = {
  brand: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Primary Blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  bg: {
    900: '#0f172a', // Deep Slate (Main Background)
    800: '#1e293b', // Lighter Slate (Cards/Sidebar)
    700: '#334155', // Borders/Inputs
  },
  finance: {
    profit: '#10b981', // Emerald 500
    loss: '#f43f5e',   // Rose 500
    neutral: '#94a3b8' // Slate 400
  }
};

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: '"Inter", -apple-system, system-ui, sans-serif',
    body: '"Inter", -apple-system, system-ui, sans-serif',
    mono: '"JetBrains Mono", "Roboto Mono", monospace', // For financial data
  },
  colors,
  styles: {
    global: {
      body: {
        bg: 'bg.900',
        color: 'gray.100',
        lineHeight: '1.6',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: '8px',
        _focus: { boxShadow: 'none' }
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: { bg: 'brand.600', transform: 'translateY(-1px)', boxShadow: 'lg' },
          _active: { transform: 'translateY(0)' }
        },
        ghost: {
          color: 'gray.400',
          _hover: { bg: 'whiteAlpha.100', color: 'white' }
        },
        outline: {
          borderColor: 'gray.600',
          color: 'gray.300',
          _hover: { bg: 'whiteAlpha.50' }
        }
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'bg.800',
            border: '1px solid',
            borderColor: 'bg.700',
            _hover: { borderColor: 'gray.500' },
            _focus: { borderColor: 'brand.500', bg: 'bg.900' }
          }
        }
      },
      defaultProps: {
        variant: 'filled'
      }
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'bg.800',
          border: '1px solid',
          borderColor: 'whiteAlpha.100',
          borderRadius: 'xl',
          backdropFilter: 'blur(10px)',
        }
      }
    },
    Badge: {
      baseStyle: {
        borderRadius: 'md',
        px: 2,
        py: 0.5,
        fontWeight: '600',
        textTransform: 'uppercase',
        fontSize: 'xs'
      }
    }
  },
});

export default theme;