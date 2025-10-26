// src/theme.js

// --- START: CORRECTED CODE ---
// extendTheme is imported from @chakra-ui/react in v1
import { extendTheme } from '@chakra-ui/react';
// --- END: CORRECTED CODE ---

const theme = extendTheme({
  config: {
    cssVarPrefix: "chakra",
  },
  styles: {
    global: {
      body: {
        bg: 'var(--bg-dark-primary)',
        color: 'var(--text-primary)',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
      },
      variants: {
        solid: (props) => ({
          bg: 'var(--brand-primary)',
          color: 'white',
          _hover: {
            bg: 'var(--brand-hover)',
          },
        }),
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            border: '1px solid',
            borderColor: 'var(--border-color)',
            background: 'var(--bg-dark-secondary)',
            _hover: {
              borderColor: 'var(--brand-hover)',
            },
            _focus: {
              borderColor: 'var(--brand-primary)',
              boxShadow: '0 0 0 1px var(--brand-primary)',
            },
          },
        },
      },
    },
    Link: {
        baseStyle: {
            color: 'var(--brand-primary)',
            _hover: {
                color: 'var(--brand-hover)',
                textDecoration: 'underline'
            }
        }
    }
  },
});

export default theme;