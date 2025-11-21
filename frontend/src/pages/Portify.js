// src/pages/Portify.js
import React, { useState, useEffect, useRef } from 'react';
import { Box, Flex, Text, Input, Button, VStack, HStack, Spinner, IconButton } from '@chakra-ui/react';
import { DeleteIcon, ChatIcon, AddIcon } from '@chakra-ui/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';

// Define Base URL locally or import from config. 
// Matching client.js logic:
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function Portify() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);
    const abortControllerRef = useRef(null); // To cancel stream if needed

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

    // --- STREAMING HANDLER ---
    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input;
        setInput(''); // Clear input immediately
        
        // 1. Add User Message to UI
        const userMsg = { role: 'user', content: userText };
        setMessages(prev => [...prev, userMsg]);

        // 2. Add Placeholder Bot Message
        // We add an empty string so we can append chunks to it later
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        
        setLoading(true);
        
        // Abort previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            // We use fetch() instead of axios to handle streams properly
            const response = await fetch(`${BASE_URL}/chat/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Manually attach token since we aren't using the axios client here
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

            // 3. Handle Session Metadata (Sent in Headers)
            const newSessionId = response.headers.get('X-Session-Id');
            if (newSessionId && !currentSessionId) {
                setCurrentSessionId(newSessionId);
                // We delay refreshing the list slightly to let the title save
                setTimeout(fetchSessions, 1000);
            }

            // 4. Read the Stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botReply = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                botReply += chunk;

                // Update the LAST message (the placeholder we added)
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsgIndex = newMsgs.length - 1;
                    // Create a new object to trigger re-render
                    newMsgs[lastMsgIndex] = { 
                        ...newMsgs[lastMsgIndex], 
                        content: botReply 
                    };
                    return newMsgs;
                });
            }

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error("Streaming Error:", err);
                setMessages(prev => [...prev, { role: 'assistant', content: "\n[Error: Portify connection lost.]" }]);
            }
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]); // Auto-scroll as text streams in

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
                        {loading && <Spinner size="xs" color="blue.400" ml={2} />}
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
                        <IconButton icon={<ChatIcon />} colorScheme="blue" onClick={handleSend} isLoading={loading} />
                    </HStack>
                </Box>
            </Flex>
        </Flex>
    );
}

export default Portify;