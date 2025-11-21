// src/components/CommandPalette.js
import React, { useState, useEffect } from 'react';
import { 
    Modal, ModalOverlay, ModalContent, ModalBody, Input, 
    VStack, Text, Box, Kbd, Flex
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { searchStocks } from '../api/stocks';
import { useTheme } from '../context/ThemeContext';

function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const navigate = useNavigate();
    const { setThemeName } = useTheme();

    // Toggle with Cmd+K or Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle Commands & Search
    useEffect(() => {
        if (!query) {
            // Default options when nothing is typed
            setResults([
                { type: 'nav', label: 'Go to Dashboard', path: '/dashboard' },
                { type: 'nav', label: 'Go to Transactions', path: '/transactions' },
                { type: 'nav', label: 'Go to Learn', path: '/learn' },
                { type: 'nav', label: 'Go to SIP Calculator', path: '/sip-calculator' },
                { type: 'action', label: 'Switch Theme: Ocean', action: () => setThemeName('oceanic') },
                { type: 'action', label: 'Switch Theme: Sunset', action: () => setThemeName('sunset') },
            ]);
            return;
        }

        // Search Stocks if query exists
        if (query.length > 1) {
            const timer = setTimeout(async () => {
                const stocks = await searchStocks(query);
                const stockResults = stocks.map(s => ({
                    type: 'stock',
                    label: `${s.symbol} - ${s.name}`,
                    symbol: s.symbol
                }));
                setResults(stockResults);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [query, setThemeName]);

    const handleSelect = (item) => {
        if (item.type === 'nav') navigate(item.path);
        if (item.type === 'stock') navigate(`/stock/${item.symbol}`);
        if (item.type === 'action') item.action();
        
        // Reset and Close
        setIsOpen(false);
        setQuery('');
    };

    return (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
            <ModalOverlay backdropFilter="blur(5px)" />
            <ModalContent bg="#0f172a" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="xl" overflow="hidden" mt="15vh">
                <ModalBody p={0}>
                    <Box borderBottom="1px solid" borderColor="whiteAlpha.100" p={4}>
                        <Input 
                            placeholder="Type a command or search stock..." 
                            variant="unstyled" 
                            fontSize="lg" 
                            color="white"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </Box>
                    <VStack align="stretch" spacing={0} maxH="400px" overflowY="auto" p={2}>
                        {results.map((item, i) => (
                            <Flex 
                                key={i} 
                                p={3} 
                                align="center" 
                                justify="space-between" 
                                borderRadius="md" 
                                cursor="pointer" 
                                _hover={{ bg: 'blue.600', color: 'white' }}
                                onClick={() => handleSelect(item)}
                                transition="all 0.1s"
                            >
                                <Text fontWeight="500" color="gray.200">{item.label}</Text>
                                <Text fontSize="xs" opacity={0.7} textTransform="uppercase" color="gray.400">{item.type}</Text>
                            </Flex>
                        ))}
                        {results.length === 0 && (
                            <Text p={4} color="gray.500" textAlign="center">No results found.</Text>
                        )}
                    </VStack>
                    <Flex justify="space-between" p={3} bg="whiteAlpha.50" borderTop="1px solid" borderColor="whiteAlpha.100">
                        <Text fontSize="xs" color="gray.500">Pro Tip: Use arrow keys to navigate</Text>
                        <Flex gap={2} align="center">
                            <Kbd fontSize="xs" bg="gray.700" color="white">ESC</Kbd> <Text fontSize="xs" color="gray.500">to close</Text>
                        </Flex>
                    </Flex>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default CommandPalette;