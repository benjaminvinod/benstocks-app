// src/pages/Leaderboard.js

import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/portfolio';
import { formatCurrency } from '../utils/format';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';
import { 
    Box, Container, Heading, Text, SimpleGrid, VStack, HStack, 
    Avatar, Badge, Table, Thead, Tbody, Tr, Th, Td, 
    Input, InputGroup, InputLeftElement, Spinner, Flex,
    useColorModeValue
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

// Replaced Card with Box for Chakra v1 compatibility
const TopInvestorCard = ({ user, rank }) => {
    let borderColor = 'gray.700';
    let badgeColor = 'gray';
    let label = '';
    let scale = 1;
    let shadow = 'none';

    if (rank === 1) {
        borderColor = '#FFD700'; // Gold
        badgeColor = 'yellow';
        label = '👑 Champion';
        scale = 1.05;
        shadow = '0 0 20px rgba(255, 215, 0, 0.2)';
    } else if (rank === 2) {
        borderColor = '#C0C0C0'; // Silver
        badgeColor = 'gray';
        label = '🥈 Runner Up';
    } else if (rank === 3) {
        borderColor = '#CD7F32'; // Bronze
        badgeColor = 'orange';
        label = '🥉 3rd Place';
    }

    return (
        <Box 
            bg="var(--bg-dark-secondary)" 
            border="1px solid" 
            borderColor={borderColor}
            transform={`scale(${scale})`}
            zIndex={rank === 1 ? 2 : 1}
            boxShadow={shadow}
            transition="all 0.3s ease"
            _hover={{ transform: `scale(${scale + 0.02})` }}
            borderRadius="lg"
            overflow="hidden"
            p={5} // Padding replaces CardBody
        >
            <VStack spacing={3} textAlign="center">
                <Box position="relative">
                    <Avatar size={rank === 1 ? "xl" : "lg"} name={user.username} src={user.avatar} />
                    <Badge 
                        position="absolute" 
                        bottom="-10px" 
                        left="50%" 
                        transform="translateX(-50%)"
                        colorScheme={badgeColor}
                        borderRadius="full"
                        px={2}
                    >
                        #{rank}
                    </Badge>
                </Box>
                
                <Box>
                    <Text fontWeight="bold" fontSize="lg" color="white">{user.username}</Text>
                    <Text fontSize="xs" color="gray.400" fontWeight="bold">{label}</Text>
                </Box>

                <Box bg="whiteAlpha.100" p={2} borderRadius="md" w="full">
                    <Text fontSize="xs" color="gray.400">Net Worth</Text>
                    <Text fontWeight="bold" color="green.300">
                        {formatCurrency(user.total_value_inr, 'INR')}
                    </Text>
                </Box>
            </VStack>
        </Box>
    );
};

function Leaderboard() {
    const { user: currentUser } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const data = await getLeaderboard(50); // Fetch top 50 for better density
            setLeaderboard(data);
        } catch (err) {
            setError('Failed to load leaderboard.');
            console.error(err);
        }
        setLoading(false);
    };

    // Filter logic
    const filteredLeaderboard = leaderboard.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const topThree = filteredLeaderboard.slice(0, 3);
    const restOfList = filteredLeaderboard.slice(3);

    const highlightBg = 'whiteAlpha.200';

    return (
        <Container maxW="container.xl" py={8}>
            <BackButton />
            
            <Flex justify="space-between" align="center" mb={8} direction={{base: 'column', md: 'row'}} gap={4}>
                <Box>
                    <Heading size="lg" display="flex" alignItems="center">
                        🏆 Wall of Fame
                    </Heading>
                    <Text color="gray.400">The highest net-worth investors in the BenStocks ecosystem.</Text>
                </Box>
                
                <InputGroup maxW="300px">
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.500" />
                    </InputLeftElement>
                    <Input 
                        placeholder="Find a trader..." 
                        variant="filled" 
                        bg="var(--bg-dark-secondary)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </InputGroup>
            </Flex>

            {loading ? (
                <Flex justify="center" align="center" minH="300px">
                    <Spinner size="xl" color="blue.500" />
                </Flex>
            ) : error ? (
                <Text color="red.400" textAlign="center">{error}</Text>
            ) : (
                <>
                    {/* --- THE PODIUM (Top 3) --- */}
                    {topThree.length > 0 && !searchTerm && (
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={12} alignItems="flex-end">
                            {/* Rank 2 */}
                            <Box order={{ base: 2, md: 1 }}>
                                {topThree[1] && <TopInvestorCard user={topThree[1]} rank={2} />}
                            </Box>
                            
                            {/* Rank 1 (Center & Bigger) */}
                            <Box order={{ base: 1, md: 2 }} mb={{ base: 0, md: 6 }}>
                                <TopInvestorCard user={topThree[0]} rank={1} />
                            </Box>
                            
                            {/* Rank 3 */}
                            <Box order={{ base: 3, md: 3 }}>
                                {topThree[2] && <TopInvestorCard user={topThree[2]} rank={3} />}
                            </Box>
                        </SimpleGrid>
                    )}

                    {/* --- THE LIST (Rank 4+) --- */}
                    <Box 
                        bg="var(--bg-dark-primary)" 
                        borderRadius="xl" 
                        border="1px solid var(--border-color)" 
                        overflow="hidden"
                    >
                        <Table variant="simple">
                            <Thead bg="whiteAlpha.50">
                                <Tr>
                                    <Th color="gray.400">Rank</Th>
                                    <Th color="gray.400">Trader</Th>
                                    <Th color="gray.400" isNumeric>Portfolio Value</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {(searchTerm ? filteredLeaderboard : restOfList).map((trader, index) => {
                                    // Calculate actual rank based on data index
                                    const actualRank = searchTerm ? index + 1 : index + 4;
                                    const isMe = currentUser?.username === trader.username;

                                    return (
                                        <Tr 
                                            key={trader.username} 
                                            bg={isMe ? highlightBg : 'transparent'}
                                            _hover={{ bg: 'whiteAlpha.50' }}
                                            borderLeft={isMe ? "4px solid #3182ce" : "none"}
                                        >
                                            <Td fontWeight="bold" color="gray.500">#{actualRank}</Td>
                                            <Td>
                                                <HStack>
                                                    <Avatar size="sm" name={trader.username} src={trader.avatar} />
                                                    <VStack align="start" spacing={0}>
                                                        <Text fontWeight="bold" color={isMe ? "blue.300" : "white"}>
                                                            {trader.username} {isMe && "(You)"}
                                                        </Text>
                                                        {actualRank <= 10 && <Badge colorScheme="purple" fontSize="xx-small">Top 10</Badge>}
                                                    </VStack>
                                                </HStack>
                                            </Td>
                                            <Td isNumeric>
                                                <Text fontWeight="bold" fontFamily="monospace" fontSize="md">
                                                    {formatCurrency(trader.total_value_inr, 'INR')}
                                                </Text>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </Tbody>
                        </Table>
                        
                        {filteredLeaderboard.length === 0 && (
                            <Box p={8} textAlign="center">
                                <Text color="gray.500">No traders found matching "{searchTerm}"</Text>
                            </Box>
                        )}
                    </Box>
                </>
            )}
        </Container>
    );
}

export default Leaderboard;