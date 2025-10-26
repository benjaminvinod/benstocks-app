// src/pages/Login.js

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

// --- START: CORRECTED CODE ---
// For Chakra UI v1, these components are all available in the main package.
import {
  Box,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Alert,
  AlertIcon,
  Link,
} from '@chakra-ui/react';
// --- END: CORRECTED CODE ---

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <Box maxW="500px" mx="auto" mt="5rem" p={8} bg="var(--bg-dark-secondary)" borderRadius="lg" borderWidth="1px" borderColor="var(--border-color)">
      <VStack as="form" spacing={6} onSubmit={handleSubmit}>
        <VStack spacing={2} w="full">
          <Heading as="h1">Log In</Heading>
          <Text color="var(--text-secondary)">
            Welcome back to BenStocks!
          </Text>
        </VStack>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </FormControl>

        <Button type="submit" width="full" isLoading={loading}>
          Log In
        </Button>

        <Text color="var(--text-secondary)">
          Don't have an account?{' '}
          <Link as={RouterLink} to="/signup">
            Sign Up
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}

export default Login;