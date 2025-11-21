// src/components/Header.js
import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Flex, Link, Button, Heading, Spacer, HStack, Image } from '@chakra-ui/react';
import ThemeSelector from './ThemeSelector'; 
import NumberSystemSelector from './NumberSystemSelector';

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
      wrap="wrap" 
      p={[3, 6]} 
      bg="var(--bg-secondary-dynamic, var(--bg-dark-secondary))" 
      borderBottomWidth="1px"
      borderColor="var(--border-dynamic, var(--border-color))" 
      color="var(--text-primary-dynamic, var(--text-primary))" 
      boxShadow="sm" 
    >
      {/* --- START: MODIFIED SECTION (LOGO) --- */}
      <Link as={RouterLink} to={isAuthenticated ? "/dashboard" : "/"} _hover={{ opacity: 0.8 }}>
        <Image 
            src="/logo.png" 
            alt="BenStocks" 
            h="100px" 
            objectFit="contain"
            fallbackSrc="https://placehold.co/150x40/0f172a/38bdf8?text=BenStocks" 
        />
      </Link>
      {/* --- END: MODIFIED SECTION --- */}

      <Spacer /> 

      <HStack spacing={4} align="center"> 
        {isAuthenticated ? (
          <>
            <Link as={RouterLink} to="/dashboard" fontWeight="600">Dashboard</Link>
            <Link as={RouterLink} to="/etfs" fontWeight="600">ETFs</Link>
            <Link as={RouterLink} to="/mutual-funds" fontWeight="600">Mutual Funds</Link>
            <Link as={RouterLink} to="/sip-calculator" fontWeight="600">SIP Calc</Link>
            <Link as={RouterLink} to="/tax-optimizer" fontWeight="600">Tax Optimizer</Link>
            <Link as={RouterLink} to="/transactions" fontWeight="600">Transactions</Link>
            <Link as={RouterLink} to="/learn" fontWeight="600">Learn</Link>
            <Link as={RouterLink} to="/leaderboard" fontWeight="600">Leaderboard</Link>
            
            {/* --- PORTIFY LINK --- */}
            <Link as={RouterLink} to="/portify" fontWeight="600" display="flex" alignItems="center" color="var(--brand-primary-dynamic, var(--brand-primary))">
              Portify <span style={{fontSize:'1.2rem', marginLeft:'5px'}}>🤖</span>
            </Link>
            
            <NumberSystemSelector />
            <ThemeSelector /> 
            
            <Button size="sm" onClick={handleLogout} colorScheme="red"> 
              Log Out
            </Button>
          </>
        ) : (
          <>
            <Link as={RouterLink} to="/learn" fontWeight="600">Learn</Link>
            <Link as={RouterLink} to="/login" fontWeight="600">Log In</Link>
            <NumberSystemSelector />
            <ThemeSelector /> 
            <Button size="sm" onClick={() => navigate('/signup')}> 
              Sign Up
            </Button>
          </>
        )}
      </HStack>
    </Flex>
  );
}

export default Header;