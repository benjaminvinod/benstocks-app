// src/pages/Portify.js

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Box, Flex, Text, Input, Button, VStack, HStack, Spinner, IconButton,
  Avatar, Badge, Tooltip, Divider, Tag, TagLabel, useToast,
  InputGroup, InputRightElement, Heading, Select
} from "@chakra-ui/react";
import { 
  DeleteIcon, ChatIcon, AddIcon, ExternalLinkIcon, SearchIcon, 
  EditIcon, ChevronDownIcon, ChevronRightIcon, StarIcon 
} from "@chakra-ui/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";
import StockChart from "../components/StockChart";

// Base API URL
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Widget Regex
const WIDGET_REGEX = /\[WIDGET:\s*(CHART|TRADE)\s+([A-Z0-9.\-]+)\]/g;

// --- HIGH QUALITY LEARNING CONTENT (Synced with Learn.js logic) ---
const CURRICULUM = [
  { id: "1.1", title: "Why Invest?", tags: ["basics"], time: 5, summary: "Beat inflation & grow wealth.", content: "Investing is essential to beat inflation (which erodes savings) and leverage compounding to grow wealth exponentially over time." },
  { id: "1.2", title: "Asset Classes", tags: ["basics"], time: 8, summary: "Stocks, Bonds, Gold, REITs.", content: "Stocks for growth, Bonds for stability, Gold for hedging, and REITs for real estate income. A good portfolio mixes these." },
  { id: "2.1", title: "Mutual Funds vs ETFs", tags: ["instruments"], time: 10, summary: "Pooled money vs Tradable funds.", content: "Mutual Funds are managed pools (NAV daily). ETFs trade like stocks (Real-time price). Index funds offer low-cost market matching." },
  { id: "2.2", title: "Power of SIP", tags: ["instruments"], time: 6, summary: "Rupee Cost Averaging.", content: "Systematic Investment Plans (SIPs) allow you to buy more units when prices are low and fewer when high, averaging cost over time." },
  { id: "3.1", title: "Stock Analysis", tags: ["strategy"], time: 15, summary: "P/E, ROE, Technicals.", content: "Fundamental analysis looks at business health (P/E, Debt). Technical analysis looks at price charts (Trends, RSI)." },
  { id: "3.2", title: "Tax Optimization", tags: ["strategy"], time: 12, summary: "Harvesting Losses.", content: "Sell loss-making stocks to offset gains and reduce your tax bill. Long Term Gains (>1yr) are taxed lower than Short Term (<1yr)." },
];

// --- UTILS ---
const STORAGE = {
  CHAT_SESSIONS: "benstocks_chat_sessions_v2",
  LEARN_PROGRESS: "benstocks_learn_progress_v2",
  LEARN_BOOKMARKS: "benstocks_learn_bookmarks_v2"
};

const loadJSON = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const saveJSON = (k, val) => {
  try { localStorage.setItem(k, JSON.stringify(val)); } catch {}
};

// --- MAIN COMPONENT ---
export default function Portify() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Chat State
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingError, setStreamingError] = useState(null);
  const endRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sidebar State
  const [sessionQuery, setSessionQuery] = useState("");
  
  // Learning Hub State
  const [showLearning, setShowLearning] = useState(true);
  const [learnQuery, setLearnQuery] = useState("");
  const [learnTag, setLearnTag] = useState("all");
  const [learnBookmarks, setLearnBookmarks] = useState(() => loadJSON(STORAGE.LEARN_BOOKMARKS, {}));
  const [learnProgress, setLearnProgress] = useState(() => loadJSON(STORAGE.LEARN_PROGRESS, {}));

  // --- INITIALIZATION ---
  useEffect(() => {
    if (user?.id) {
      fetchSessions(true);
    } else {
      const stored = loadJSON(STORAGE.CHAT_SESSIONS, []);
      setSessions(stored);
      if (stored.length) loadChat(stored[0].id);
      else startNewChat();
    }
  }, [user]);

  useEffect(() => { saveJSON(STORAGE.LEARN_BOOKMARKS, learnBookmarks); }, [learnBookmarks]);
  useEffect(() => { saveJSON(STORAGE.LEARN_PROGRESS, learnProgress); }, [learnProgress]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // --- API ACTIONS ---
  const fetchSessions = async (autoLoad = true) => {
    try {
      const res = await client.get(`/chat/sessions/${user.id}`);
      setSessions(res.data || []);
      saveJSON(STORAGE.CHAT_SESSIONS, res.data || []);
      if (autoLoad) {
        if (res.data && res.data.length > 0 && !currentSessionId) loadChat(res.data[0].id);
        else if (res.data.length === 0) startNewChat();
      }
    } catch (err) {
      // Fallback to local cache if offline
      const cache = loadJSON(STORAGE.CHAT_SESSIONS, []);
      setSessions(cache);
      if (autoLoad && cache.length) loadChat(cache[0].id);
    }
  };

  const loadChat = async (sessionId) => {
    if (!sessionId) return;
    setCurrentSessionId(sessionId);
    setLoading(true);
    try {
      const res = await client.get(`/chat/history/${sessionId}`);
      const loaded = (res.data.messages || []).map((m, i) => ({ ...m, id: m.id || `hist-${i}-${Date.now()}` }));
      setMessages(loaded);
    } catch (err) {
      toast({ title: "Failed to load chat", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([{ id: "welcome", role: "assistant", content: "Hey! I'm Portify. Ask me about stocks, strategies, or your portfolio." }]);
  };

  const deleteChat = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    try {
      await client.delete(`/chat/${sessionId}`);
      await fetchSessions(true);
      toast({ title: "Chat deleted", status: "success" });
    } catch (err) {
      toast({ title: "Delete failed", status: "error" });
    }
  };

  // --- WIDGET RENDERER ---
  const renderMessageContent = (content) => {
    if (!content) return null;
    const parts = [];
    let lastIndex = 0;
    
    // Reset regex state
    WIDGET_REGEX.lastIndex = 0;
    let match;
    
    while ((match = WIDGET_REGEX.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: "widget", widgetType: match[1], symbol: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: "text", content: content.slice(lastIndex) });
    }

    return parts.map((p, idx) => {
      if (p.type === "text") {
        return (
          <Box key={idx} whiteSpace="pre-wrap">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.content}</ReactMarkdown>
          </Box>
        );
      }
      if (p.type === "widget") {
        if (p.widgetType === "CHART") {
          return (
            <Box key={idx} my={3} borderRadius="lg" overflow="hidden" border="1px solid var(--border-color)" bg="var(--bg-dark-primary)" p={2}>
              <Text fontSize="xs" fontWeight="bold" color="gray.400" mb={2}>LIVE CHART: {p.symbol}</Text>
              <Box h="300px"><StockChart symbol={p.symbol} /></Box>
            </Box>
          );
        }
        if (p.widgetType === "TRADE") {
          return (
            <Button key={idx} leftIcon={<ExternalLinkIcon />} size="sm" colorScheme="green" onClick={() => navigate(`/stock/${p.symbol}`)} my={2}>
              Trade {p.symbol}
            </Button>
          );
        }
      }
      return null;
    });
  };

  // --- STREAMING HANDLER ---
  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput("");

    const userMsgId = `u-${Date.now()}`;
    const botMsgId = `b-${Date.now()}`;

    setMessages(prev => [
      ...prev, 
      { id: userMsgId, role: "user", content: userText, ts: new Date().toISOString() }, 
      { id: botMsgId, role: "assistant", content: "", ts: new Date().toISOString() }
    ]);
    setLoading(true);
    setStreamingError(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(`${BASE_URL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token || localStorage.getItem("token")}`
        },
        body: JSON.stringify({ user_id: user?.id, message: userText, session_id: currentSessionId }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const newSessionId = res.headers.get("X-Session-Id");
      if (newSessionId && !currentSessionId) setCurrentSessionId(newSessionId);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let partial = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        partial += chunk;
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: partial } : m));
      }
      
      // Refresh sidebar to show new session title if applicable
      fetchSessions(false);

    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
        setStreamingError("Connection failed.");
        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: "[Connection Lost. Ensure backend/Ollama is running.]" } : m));
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // --- LEARNING FILTER ---
  const filteredCurriculum = useMemo(() => {
    const q = learnQuery.trim().toLowerCase();
    return CURRICULUM.filter(m => {
      if (learnTag !== "all" && !m.tags.includes(learnTag)) return false;
      return !q || m.title.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q);
    });
  }, [learnQuery, learnTag]);

  const toggleLearnBookmark = (id) => {
    setLearnBookmarks(prev => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      else copy[id] = { id, savedAt: new Date().toISOString() };
      return copy;
    });
  };

  return (
    <Flex h="calc(100vh - 100px)" w="100%" overflow="hidden" direction={{ base: "column", md: "row" }}>
      {/* LEFT SIDEBAR: SESSIONS */}
      <Box w={{ base: "100%", md: "260px" }} bg="var(--bg-dark-secondary)" borderRight="1px solid var(--border-color)" p={3} display="flex" flexDirection="column">
        <VStack align="stretch" mb={4} spacing={3}>
          <HStack justify="space-between">
            <BackButton />
            <IconButton aria-label="new" icon={<AddIcon />} size="sm" onClick={startNewChat} />
          </HStack>
          <InputGroup size="sm">
            <Input placeholder="Search chats..." value={sessionQuery} onChange={e => setSessionQuery(e.target.value)} bg="var(--bg-dark-primary)" />
            <InputRightElement><SearchIcon color="gray.500" /></InputRightElement>
          </InputGroup>
        </VStack>

        <Box flex="1" overflowY="auto">
          <VStack align="stretch" spacing={1}>
            {sessions.filter(s => !sessionQuery || s.title.toLowerCase().includes(sessionQuery.toLowerCase())).map(s => (
              <HStack key={s.id} p={2} borderRadius="md" cursor="pointer" bg={currentSessionId === s.id ? "var(--bg-dark-primary)" : "transparent"} _hover={{ bg: "var(--bg-dark-primary)" }} onClick={() => loadChat(s.id)} justify="space-between">
                <Text fontSize="sm" noOfLines={1} color="gray.300">{s.title}</Text>
                {currentSessionId === s.id && (
                  <IconButton size="xs" icon={<DeleteIcon />} variant="ghost" colorScheme="red" onClick={(e) => deleteChat(e, s.id)} />
                )}
              </HStack>
            ))}
          </VStack>
        </Box>
        
        <Button size="sm" mt={3} variant="outline" onClick={() => setShowLearning(!showLearning)}>
          {showLearning ? "Hide Learning Hub" : "Show Learning Hub"}
        </Button>
      </Box>

      {/* CENTER: CHAT AREA */}
      <Flex flex="1" direction="column" minW={0} bg="var(--bg-primary-dynamic)">
        <Box borderBottom="1px solid var(--border-color)" p={4} bg="var(--bg-dark-secondary)">
          <HStack>
            <Avatar size="sm" name="Portify" bg="blue.500" />
            <Box>
              <Text fontWeight="bold" fontSize="sm">Portify AI Coach</Text>
              <Text fontSize="xs" color="gray.400">{loading ? "Thinking..." : "Online"}</Text>
            </Box>
          </HStack>
        </Box>

        <Box flex="1" overflowY="auto" p={4}>
          <VStack spacing={4} align="stretch">
            {messages.map((m) => (
              <Box key={m.id} alignSelf={m.role === "user" ? "flex-end" : "flex-start"} maxW="85%">
                <HStack align="start" spacing={2} flexDirection={m.role === "user" ? "row-reverse" : "row"}>
                  <Avatar size="xs" name={m.role === "user" ? "You" : "AI"} bg={m.role === "user" ? "gray.600" : "blue.600"} />
                  <Box 
                    bg={m.role === "user" ? "blue.600" : "gray.700"} 
                    p={3} borderRadius="lg" 
                    borderTopRightRadius={m.role === "user" ? "0" : "lg"}
                    borderTopLeftRadius={m.role === "assistant" ? "0" : "lg"}
                  >
                    <Box fontSize="sm">
                      {m.role === "assistant" ? renderMessageContent(m.content) : <Text>{m.content}</Text>}
                    </Box>
                  </Box>
                </HStack>
              </Box>
            ))}
            <div ref={endRef} />
          </VStack>
        </Box>

        <Box p={4} bg="var(--bg-dark-secondary)">
          <HStack>
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && handleSend()} 
              placeholder="Ask about stocks, strategies, or chart data..." 
              bg="var(--bg-dark-primary)"
            />
            <IconButton icon={<ChatIcon />} colorScheme="blue" onClick={handleSend} isLoading={loading} />
          </HStack>
        </Box>
      </Flex>

      {/* RIGHT SIDEBAR: LEARNING HUB */}
      {showLearning && (
        <Box w={{ base: "100%", md: "320px" }} bg="var(--bg-dark-secondary)" borderLeft="1px solid var(--border-color)" display={{ base: "none", md: "flex" }} flexDirection="column">
          <Box p={3} borderBottom="1px solid var(--border-color)">
            <Heading size="xs" mb={3} textTransform="uppercase" color="gray.500" letterSpacing="wide">Learning Hub</Heading>
            <InputGroup size="sm">
              <Input placeholder="Find a topic..." value={learnQuery} onChange={e => setLearnQuery(e.target.value)} bg="var(--bg-dark-primary)" />
              <InputRightElement><SearchIcon color="gray.500" /></InputRightElement>
            </InputGroup>
            <HStack mt={2} spacing={2}>
              {["all", "basics", "strategy", "instruments"].map(t => (
                <Tag 
                  key={t} size="sm" variant={learnTag === t ? "solid" : "outline"} colorScheme="blue" 
                  cursor="pointer" onClick={() => setLearnTag(t)}
                >
                  {t}
                </Tag>
              ))}
            </HStack>
          </Box>

          <Box flex="1" overflowY="auto" p={3}>
            <VStack align="stretch" spacing={3}>
              {filteredCurriculum.map(mod => {
                const isBookmarked = !!learnBookmarks[mod.id];
                return (
                  <Box key={mod.id} p={3} bg="var(--bg-dark-primary)" borderRadius="md" border="1px solid var(--border-color)" _hover={{ borderColor: "blue.500" }}>
                    <Flex justify="space-between" align="start">
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="blue.200">{mod.title}</Text>
                        <Text fontSize="xs" color="gray.400" mt={1}>{mod.summary}</Text>
                        <HStack mt={2}>
                          <Badge size="sm" colorScheme="purple">{mod.time}m</Badge>
                        </HStack>
                      </Box>
                      <VStack>
                        <IconButton 
                          size="xs" icon={<StarIcon />} variant="ghost" 
                          color={isBookmarked ? "yellow.400" : "gray.600"} 
                          onClick={() => toggleLearnBookmark(mod.id)} 
                        />
                        <IconButton 
                          size="xs" icon={<ChevronRightIcon />} variant="ghost" 
                          onClick={() => {
                            alert(mod.content); // Simple view for now
                            setLearnProgress(prev => ({ ...prev, [mod.id]: true }));
                          }} 
                        />
                      </VStack>
                    </Flex>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        </Box>
      )}
    </Flex>
  );
}