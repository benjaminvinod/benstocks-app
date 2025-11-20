// src/components/ChatBot.js
import React, { useState, useRef, useEffect } from 'react';
import { Box, Input, VStack, Text, Flex, Spinner, Button } from '@chakra-ui/react';
import client from '../api/client'; 
import { useAuth } from '../context/AuthContext';

function ChatBot() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hi! I am Portify, Your AI Portfolio Partner. Ask me about your portfolio or analyze a stock for you!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Call our new backend route
            const response = await client.post('/chat/', {
                user_id: user?.id || "guest",
                message: userMsg.text
            });

            const botMsg = { sender: 'bot', text: response.data.response };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I couldn't reach the AI server. Make sure Ollama is running!" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box position="fixed" bottom="20px" right="20px" zIndex={9999}>
            {isOpen ? (
                <Box 
                    w="320px" h="450px" 
                    bg="var(--bg-dark-secondary)" 
                    border="1px solid var(--border-color)" 
                    borderRadius="12px" 
                    boxShadow="2xl" 
                    display="flex" flexDirection="column"
                    overflow="hidden"
                >
                    {/* Header */}
                    <Flex p={3} bg="var(--brand-primary)" align="center" justify="space-between">
                        <Box>
                            <Text color="white" fontWeight="bold">Portify 🤖</Text>
                            <Text color="white" fontSize="xs">Your AI Portfolio Partner</Text>
                        </Box>
                        <Button 
                            size="xs" 
                            onClick={() => setIsOpen(false)} 
                            bg="transparent" 
                            color="white" 
                            _hover={{bg: 'rgba(0,0,0,0.2)'}}
                        >
                            ✕
                        </Button>
                    </Flex>

                    {/* Messages Area */}
                    <VStack flex={1} overflowY="auto" p={4} spacing={3} align="stretch">
                        {messages.map((msg, i) => (
                            <Box 
                                key={i} 
                                alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                                bg={msg.sender === 'user' ? 'var(--brand-primary)' : 'var(--bg-dark-primary)'}
                                color={msg.sender === 'user' ? 'white' : 'var(--text-primary)'}
                                px={3} py={2} borderRadius="lg"
                                maxW="85%"
                                fontSize="sm"
                            >
                                {msg.text}
                            </Box>
                        ))}
                        {loading && <Flex justify="flex-start"><Spinner size="sm" color="gray.500" /></Flex>}
                        <div ref={messagesEndRef} />
                    </VStack>

                    {/* Input Area */}
                    <Flex p={3} borderTop="1px solid var(--border-color)">
                        <Input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Should I buy Apple?"
                            variant="filled" size="sm" mr={2}
                            bg="var(--bg-dark-primary)"
                        />
                        <Button 
                            onClick={handleSend} 
                            isLoading={loading}
                            colorScheme="blue" size="sm"
                        >
                            ➜
                        </Button>
                    </Flex>
                </Box>
            ) : (
                <Button 
                    onClick={() => setIsOpen(true)} 
                    colorScheme="blue" 
                    borderRadius="full" 
                    w="60px" h="60px"
                    boxShadow="lg"
                    fontSize="2rem"
                >
                    🤖
                </Button>
            )}
        </Box>
    );
}

export default ChatBot;