// src/components/Header.js
import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Flex, Link, Button, Heading, Spacer, HStack } from '@chakra-ui/react';
import ThemeSelector from './ThemeSelector'; // Import the new component

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      wrap="wrap" // Allows wrapping on small screens if needed
      p={[3, 6]} // Responsive padding (less on mobile, more on desktop)
      bg="var(--bg-secondary-dynamic, var(--bg-dark-secondary))" // Dynamic background
      borderBottomWidth="1px"
      borderColor="var(--border-dynamic, var(--border-color))" // Dynamic border
      color="var(--text-primary-dynamic, var(--text-primary))" // Dynamic text
      boxShadow="sm" // Add subtle shadow
    >
      <Heading as="h1" size="lg" letterSpacing={'-.1rem'}>
        <Link as={RouterLink} to={isAuthenticated ? "/dashboard" : "/"} _hover={{ textDecoration: 'none' }}>
          BenStocks
        </Link>
      </Heading>

      <Spacer /> {/* Pushes navigation to the right */}

      <HStack spacing={4} align="center"> {/* Use HStack for horizontal layout */}
        {isAuthenticated ? (
          <>
             {/* Use Chakra Links */}
            <Link as={RouterLink} to="/dashboard" fontWeight="600">Dashboard</Link>
            <Link as={RouterLink} to="/etfs" fontWeight="600">ETFs</Link>
            <Link as={RouterLink} to="/mutual-funds" fontWeight="600">Mutual Funds</Link>
            <Link as={RouterLink} to="/risk-profile" fontWeight="600">Risk Quiz</Link>
            <Link as={RouterLink} to="/tax-optimizer" fontWeight="600">Tax Optimizer</Link>
            <Link as={RouterLink} to="/transactions" fontWeight="600">Transactions</Link>
            <Link as={RouterLink} to="/learn" fontWeight="600">Learn</Link>
            <Link as={RouterLink} to="/leaderboard" fontWeight="600">Leaderboard</Link>
            <ThemeSelector /> {/* Add Theme Selector */}
            <Button size="sm" onClick={handleLogout} colorScheme="red"> {/* Use Chakra Button */}
              Log Out
            </Button>
          </>
        ) : (
          <>
            <Link as={RouterLink} to="/learn" fontWeight="600">Learn</Link>
            <Link as={RouterLink} to="/login" fontWeight="600">Log In</Link>
            <ThemeSelector /> {/* Add Theme Selector */}
            <Button size="sm" onClick={() => navigate('/signup')}> {/* Use Chakra Button */}
              Sign Up
            </Button>
          </>
        )}
      </HStack>
    </Flex>
  );
}

export default Header;