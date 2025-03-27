import { extendTheme } from '@chakra-ui/react';

// Temel renkler
const colors = {
  brand: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  navy: {
    50: '#f0f5fa',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98',
    600: '#486581',
    700: '#334e68',
    800: '#243b53',
    900: '#102a43',
  }
};

// Typography
const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
};

// Component bazlı stillemeler
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: 'lg',
    },
    variants: {
      solid: {
        _focus: {
          boxShadow: 'outline',
        },
        _hover: {
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        },
      },
      outline: {
        borderWidth: '1px',
        _focus: {
          boxShadow: 'outline',
        },
        _hover: {
          transform: 'translateY(-1px)',
        },
      },
      ghost: {
        _focus: {
          boxShadow: 'none',
        },
      }
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        boxShadow: 'md',
        _hover: {
          boxShadow: 'lg',
          transform: 'translateY(-2px)',
        },
      },
      header: {
        padding: '1rem',
        borderBottom: '1px solid',
        borderColor: 'gray.100',
        _dark: {
          borderColor: 'gray.700',
        },
      },
      body: {
        padding: '1rem',
      },
      footer: {
        padding: '1rem',
        borderTop: '1px solid',
        borderColor: 'gray.100',
        _dark: {
          borderColor: 'gray.700',
        },
      },
    },
    variants: {
      elevated: {
        container: {
          boxShadow: 'lg',
          _hover: {
            boxShadow: 'xl',
          },
        },
      },
      outline: {
        container: {
          boxShadow: 'none',
          borderWidth: '1px',
          borderColor: 'gray.200',
          _dark: {
            borderColor: 'gray.700',
          },
        },
      },
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: '600',
    },
  },
  Tabs: {
    variants: {
      enclosed: {
        tab: {
          borderTopRadius: 'md',
          border: '1px solid',
          borderColor: 'transparent',
          mb: '-1px',
          _selected: {
            bg: 'white',
            color: 'blue.600',
            borderColor: 'inherit',
            borderBottomColor: 'white',
            fontWeight: '600',
          },
          _hover: {
            bg: 'gray.50',
          },
          _dark: {
            _selected: {
              bg: 'gray.800',
              color: 'blue.300',
              borderBottomColor: 'gray.800',
            },
            _hover: {
              bg: 'gray.700',
            }
          }
        },
        tablist: {
          borderBottom: '1px solid',
          borderColor: 'inherit',
        },
      },
    },
  },
  Drawer: {
    baseStyle: {
      dialog: {
        borderRadius: 'none',
      },
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        borderRadius: 'xl',
      },
    },
  },
  IconButton: {
    baseStyle: {
      borderRadius: 'lg',
    },
    variants: {
      ghost: {
        _hover: {
          bg: 'gray.100',
          _dark: {
            bg: 'gray.700',
          },
        },
      },
      outline: {
        _hover: {
          transform: 'translateY(-1px)',
        },
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      px: 2,
      py: 0.5,
      fontWeight: 'medium',
    },
  },
};

// Tema konfigürasyonu
const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Tema stilleri
const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      background: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
    },
    '::-webkit-scrollbar-thumb': {
      background: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
    },
  }),
};

// Tüm tema özelleştirmelerini birleştirme
const theme = extendTheme({
  colors,
  fonts,
  components,
  config,
  styles,
  shadows: {
    outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  radii: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
  },
  transition: {
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slowest: '500ms',
    },
  },
});

export default theme; 