// src/pages/Signup.js

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";

// Chakra UI (same style approach as Login.js)
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
} from "@chakra-ui/react";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup(username, email, password);
      navigate("/dashboard");
    } catch (err) {
      // AuthContext throws new Error(...) so err.message is what we want here.
      setError(err?.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      maxW="500px"
      mx="auto"
      mt="5rem"
      p={8}
      bg="var(--bg-dark-secondary)"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="var(--border-color)"
    >
      <VStack as="form" spacing={6} onSubmit={handleSubmit}>
        <VStack spacing={2} w="full">
          <Heading as="h1">Create Account</Heading>
          <Text color="var(--text-secondary)" textAlign="center">
            Start your simulated investment journey.
          </Text>
        </VStack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <FormControl isRequired>
          <FormLabel>Username</FormLabel>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            autoComplete="username"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            minLength={6}
            autoComplete="new-password"
          />
        </FormControl>

        <Button type="submit" width="full" isLoading={loading}>
          Sign Up
        </Button>

        <Text color="var(--text-secondary)">
          Already have an account?{" "}
          <Link as={RouterLink} to="/login" color="blue.300">
            Log In
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}

export default Signup;
