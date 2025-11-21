// src/pages/Portify.js
import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex, Text, Input, Button, VStack, HStack, Spinner, IconButton } from '@chakra-ui/react';
import { DeleteIcon, ChatIcon, AddIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import StockChart from '../components/StockChart';

// Define Base URL
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Regex to find [WIDGET: TYPE SYMBOL]
const WIDGET_REGEX = /\[WIDGET:\s*(CHART|TRADE)\s+([A-Z0-9.-]+)\]/;

function Portify() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);
    const abortControllerRef = useRef(null);

    // 1. Load Session List
    useEffect(() => {
        if (user?.id) {
            fetchSessions(true); // true = auto-load latest chat
        }
    }, [user]);

    // Modified to accept an 'autoLoad' flag.
    // We pass 'false' when refreshing after a message to prevent wiping the screen.
    const fetchSessions = async (autoLoad = true) => {
        try {
            const res = await client.get(`/chat/sessions/${user.id}`);
            setSessions(res.data);
            
            if (autoLoad) {
                if (res.data.length > 0 && !currentSessionId) {
                    loadChat(res.data[0].id);
                } else if (res.data.length === 0) {
                    startNewChat();
                }
            }
        } catch (err) { console.error(err); }
    };

    // 2. Load Specific Chat
    const loadChat = async (sessionId) => {
        if (!sessionId) return;
        setCurrentSessionId(sessionId);
        setLoading(true);
        try {
            const res = await client.get(`/chat/history/${sessionId}`);
            // Add unique IDs to historical messages for React stability
            const loadedMsgs = (res.data.messages || []).map((m, i) => ({
                ...m,
                id: m.id || `hist-${i}-${Date.now()}`
            }));
            setMessages(loadedMsgs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const startNewChat = () => {
        setCurrentSessionId(null);
        setMessages([{ id: 'welcome', role: 'assistant', content: "Hey! I'm Portify. Pick a stock, and let's analyze it. 📈" }]);
    };

    const deleteChat = async (e, sessionId) => {
        e.stopPropagation();
        if(!window.confirm("Delete this chat?")) return;
        await client.delete(`/chat/${sessionId}`);
        const res = await client.get(`/chat/sessions/${user.id}`);
        setSessions(res.data);
        if (sessionId === currentSessionId) {
            if (res.data.length > 0) loadChat(res.data[0].id);
            else startNewChat();
        }
    };

    // --- WIDGET RENDERER ---
    const renderMessageContent = (content) => {
        if (!content) return null;
        const parts = content.split(/(\[WIDGET:\s*(?:CHART|TRADE)\s+[A-Z0-9.-]+\])/g);

        return parts.map((part, index) => {
            const match = part.match(WIDGET_REGEX);
            
            if (match) {
                const [_, type, symbol] = match;
                
                if (type === 'CHART') {
                    return (
                        // FIXED: Container with overflow hidden to prevent UI overlap
                        <Box key={index} my={3} p={1} bg="var(--bg-dark-primary)" borderRadius="lg" border="1px solid var(--border-color)" overflow="hidden" w="100%">
                            <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={1} px={2} pt={1}>LIVE CHART: {symbol}</Text>
                            <Box h="350px" w="100%" position="relative">
                                <StockChart symbol={symbol} />
                            </Box>
                        </Box>
                    );
                }
                
                if (type === 'TRADE') {
                    return (
                        <Button 
                            key={index} 
                            leftIcon={<ExternalLinkIcon />}
                            colorScheme="green" 
                            size="sm" 
                            variant="solid"
                            my={2}
                            onClick={() => navigate(`/stock/${symbol}`)}
                        >
                            Trade {symbol} Now
                        </Button>
                    );
                }
            }

            if (!part.trim()) return null;
            return (
                <ReactMarkdown 
                    key={index}
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({node, ...props}) => <Text as="span" display="inline" {...props} />, 
                        table: ({node, ...props}) => <table style={{borderCollapse:'collapse', width:'100%', margin:'10px 0', fontSize:'0.9em'}} {...props} />,
                        td: ({node, ...props}) => <td style={{border:'1px solid #555', padding:'6px'}} {...props} />,
                        th: ({node, ...props}) => <th style={{border:'1px solid #555', padding:'6px', backgroundColor:'#444'}} {...props} />
                    }}
                >
                    {part}
                </ReactMarkdown>
            );
        });
    };

    // --- STREAMING HANDLER ---
    const handleSend = async () => {
        if (!input.trim()) return;
        const userText = input;
        setInput(''); 
        
        // FIXED: Generate Unique IDs for State Tracking
        const botMsgId = `bot-${Date.now()}`;
        const userMsgId = `user-${Date.now()}`;

        // FIXED: Use Functional Update to ensure we don't overwrite state race conditions
        setMessages(prev => [
            ...prev,
            { id: userMsgId, role: 'user', content: userText },
            { id: botMsgId, role: 'assistant', content: '' } 
        ]);
        
        setLoading(true);
        
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch(`${BASE_URL}/chat/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token || localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    user_id: user.id,
                    message: userText,
                    session_id: currentSessionId
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) throw new Error('Network response was not ok');

            // Handle Session Creation (Metadata in Headers)
            const newSessionId = response.headers.get('X-Session-Id');
            if (newSessionId && !currentSessionId) {
                setCurrentSessionId(newSessionId);
                // DO NOT fetchSessions() here. It will reload the chat and wipe the stream.
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botReply = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                botReply += chunk;

                // FIXED: Update the specific message ID
                setMessages(prev => prev.map(msg => 
                    msg.id === botMsgId 
                        ? { ...msg, content: botReply } 
                        : msg
                ));
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setMessages(prev => prev.map(msg => 
                    msg.id === botMsgId 
                        ? { ...msg, content: msg.content + "\n[Error: Portify connection lost.]" } 
                        : msg
                ));
            }
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
            // FIXED: Update Sidebar WITHOUT reloading the active chat window
            fetchSessions(false); 
        }
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <Flex h="90vh" className="container" p={0} overflow="hidden" flexDirection={{base: 'column', md: 'row'}}>
            <Box w={{base: '100%', md: '250px'}} bg="var(--bg-dark-secondary)" borderRight="1px solid var(--border-color)" p={4}>
                <Button leftIcon={<AddIcon />} width="full" mb={4} colorScheme="blue" onClick={startNewChat}>New Chat</Button>
                <VStack align="stretch" spacing={2} overflowY="auto" h="calc(100% - 60px)">
                    {sessions.map(s => (
                        <HStack 
                            key={s.id} 
                            p={2} 
                            borderRadius="md" 
                            cursor="pointer" 
                            bg={currentSessionId === s.id ? 'var(--bg-dark-primary)' : 'transparent'}
                            _hover={{ bg: 'var(--bg-dark-primary)' }}
                            onClick={() => loadChat(s.id)}
                            justify="space-between"
                        >
                            <Text fontSize="sm" noOfLines={1} color="var(--text-primary)">{s.title}</Text>
                            <IconButton 
                                size="xs" icon={<DeleteIcon />} variant="ghost" color="gray.500" 
                                _hover={{ color: 'red.400' }} onClick={(e) => deleteChat(e, s.id)}
                            />
                        </HStack>
                    ))}
                </VStack>
            </Box>

            <Flex flex={1} direction="column" bg="var(--bg-primary-dynamic)">
                <Box p={4} borderBottom="1px solid var(--border-color)">
                    <HStack>
                        <BackButton />
                        <Text fontWeight="bold">Portify AI Analysis</Text>
                        {loading && <Spinner size="xs" color="blue.400" ml={2} />}
                    </HStack>
                </Box>

                <VStack flex={1} overflowY="auto" p={6} spacing={4} align="stretch">
                    {messages.map((msg, i) => (
                        <Box 
                            key={msg.id || i} // Use ID for key to prevent React render bugs
                            alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                            bg={msg.role === 'user' ? 'blue.600' : 'gray.700'}
                            color="white"
                            px={5} py={3} borderRadius="lg"
                            maxW={{base: "95%", md: "80%"}}
                            fontSize="md"
                        >
                            {msg.role === 'user' ? (
                                <Text>{msg.content}</Text>
                            ) : (
                                <Box>
                                    {renderMessageContent(msg.content)}
                                </Box>
                            )}
                        </Box>
                    ))}
                    <div ref={endRef} />
                </VStack>

                <Box p={4} bg="var(--bg-dark-secondary)">
                    <HStack>
                        <Input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about a stock (e.g. 'Show chart for AAPL')" 
                            bg="var(--bg-dark-primary)"
                        />
                        <IconButton icon={<ChatIcon />} colorScheme="blue" onClick={handleSend} isLoading={loading} />
                    </HStack>
                </Box>
            </Flex>
        </Flex>
    );
}

export default Portify;