// src/pages/Portify.js
import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex, Text, Input, Button, VStack, HStack, Spinner, IconButton } from '@chakra-ui/react';
import { DeleteIcon, ChatIcon, AddIcon } from '@chakra-ui/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';

function Portify() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    // 1. Load Session List on Mount & Auto-Select Latest
    useEffect(() => {
        if (user?.id) {
            fetchSessions();
        }
    }, [user]);

    const fetchSessions = async () => {
        try {
            const res = await client.get(`/chat/sessions/${user.id}`);
            setSessions(res.data);
            
            // AUTO-LOAD LOGIC: If sessions exist and we haven't selected one, load the first (latest)
            if (res.data.length > 0 && !currentSessionId) {
                loadChat(res.data[0].id);
            } else if (res.data.length === 0) {
                // If no sessions, show welcome message
                startNewChat();
            }
        } catch (err) { console.error(err); }
    };

    // 2. Load a Specific Chat History
    const loadChat = async (sessionId) => {
        if (!sessionId) return;
        setCurrentSessionId(sessionId);
        setLoading(true);
        try {
            const res = await client.get(`/chat/history/${sessionId}`);
            setMessages(res.data.messages || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const startNewChat = () => {
        setCurrentSessionId(null);
        setMessages([{ role: 'assistant', content: "Hey! I'm Portify. Pick a stock, and let's analyze it. 📈" }]);
    };

    const deleteChat = async (e, sessionId) => {
        e.stopPropagation();
        if(!window.confirm("Delete this chat?")) return;
        await client.delete(`/chat/${sessionId}`);
        
        // Refresh list
        const res = await client.get(`/chat/sessions/${user.id}`);
        setSessions(res.data);
        
        // If we deleted the active chat, switch to the next one or new chat
        if (sessionId === currentSessionId) {
            if (res.data.length > 0) {
                loadChat(res.data[0].id);
            } else {
                startNewChat();
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = { role: 'user', content: input };
        
        // Optimistic UI Update
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await client.post('/chat/', {
                user_id: user.id,
                message: userMsg.content,
                session_id: currentSessionId // Send null if new, ID if existing
            });
            
            const botMsg = { role: 'assistant', content: res.data.response };
            setMessages(prev => [...prev, botMsg]);
            
            // CRITICAL FIX: If we just started a new chat, the backend created a session.
            // We must save that ID so the next message goes to the SAME session.
            if (!currentSessionId && res.data.session_id) {
                setCurrentSessionId(res.data.session_id);
                // Refresh sidebar to show the new auto-generated title
                fetchSessions(); 
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to Portify." }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <Flex h="90vh" className="container" p={0} overflow="hidden" flexDirection={{base: 'column', md: 'row'}}>
            {/* Sidebar (History) */}
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
                                size="xs" 
                                icon={<DeleteIcon />} 
                                variant="ghost" 
                                color="gray.500" 
                                _hover={{ color: 'red.400' }}
                                onClick={(e) => deleteChat(e, s.id)}
                            />
                        </HStack>
                    ))}
                </VStack>
            </Box>

            {/* Main Chat Interface */}
            <Flex flex={1} direction="column" bg="var(--bg-primary-dynamic)">
                <Box p={4} borderBottom="1px solid var(--border-color)">
                    <HStack>
                        <BackButton />
                        <Text fontWeight="bold">Portify AI Analysis</Text>
                    </HStack>
                </Box>

                <VStack flex={1} overflowY="auto" p={6} spacing={4} align="stretch">
                    {messages.map((msg, i) => (
                        <Box 
                            key={i} 
                            alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                            bg={msg.role === 'user' ? 'blue.600' : 'gray.700'}
                            color="white"
                            px={5} py={3} borderRadius="lg"
                            maxW="80%"
                            fontSize="md"
                        >
                            {/* Render Markdown (Tables, Bold, Lists) */}
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    table: ({node, ...props}) => <table style={{borderCollapse:'collapse', width:'100%', margin:'10px 0'}} {...props} />,
                                    td: ({node, ...props}) => <td style={{border:'1px solid #555', padding:'8px'}} {...props} />,
                                    th: ({node, ...props}) => <th style={{border:'1px solid #555', padding:'8px', backgroundColor:'#444'}} {...props} />
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        </Box>
                    ))}
                    {loading && <Spinner />}
                    <div ref={endRef} />
                </VStack>

                {/* Input Box */}
                <Box p={4} bg="var(--bg-dark-secondary)">
                    <HStack>
                        <Input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about a stock..." 
                            bg="var(--bg-dark-primary)"
                        />
                        <IconButton icon={<ChatIcon />} colorScheme="blue" onClick={handleSend} />
                    </HStack>
                </Box>
            </Flex>
        </Flex>
    );
}

export default Portify;