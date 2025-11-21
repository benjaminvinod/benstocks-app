// src/components/NewsTicker.js
import React, { useState, useEffect } from 'react';
import { Box, VStack, Text, Link, Badge, Flex, Skeleton, Stack } from '@chakra-ui/react';
import { getFinancialNews } from '../api/newsApi';

// Helper for Sentiment Badge using Chakra UI styling
const SentimentBadge = ({ sentiment }) => {
    let colorScheme = 'gray';
    if (sentiment === 'POSITIVE') colorScheme = 'green';
    if (sentiment === 'NEGATIVE') colorScheme = 'red';

    return (
        <Badge 
            colorScheme={colorScheme} 
            fontSize="0.65em" 
            variant="subtle" 
            mr={2}
            px={2}
            py={0.5}
            borderRadius="md"
        >
            {sentiment}
        </Badge>
    );
};

function NewsTicker() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const data = await getFinancialNews();
                setNews(data);
            } catch (err) {
                setError('Unavailable');
            }
            setLoading(false);
        };
        fetchNews();
    }, []);

    // --- MODIFIED: LOADING STATE ---
    // Replaced Spinner with a Skeleton Layout that mimics the news list
    if (loading) {
        return (
            <Stack spacing={4}>
                {[1, 2, 3].map((i) => (
                    <Box key={i} py={2}>
                        <Skeleton height="12px" width="60px" mb={2} startColor="whiteAlpha.100" endColor="whiteAlpha.300" />
                        <Skeleton height="16px" width="100%" startColor="whiteAlpha.100" endColor="whiteAlpha.300" />
                    </Box>
                ))}
            </Stack>
        );
    }

    if (error) {
        return <Text color="red.400" fontSize="sm">{error}</Text>;
    }

    return (
        <VStack spacing={0} align="stretch" divider={<Box borderBottom="1px solid" borderColor="whiteAlpha.100" />}>
            {news.length > 0 ? (
                news.slice(0, 6).map((item, index) => (
                    <Box key={index} py={3} _first={{ pt: 0 }} _last={{ pb: 0, borderBottom: 'none' }}>
                        <Flex align="center" mb={1}>
                            <SentimentBadge sentiment={item.sentiment} />
                            <Text fontSize="xs" color="gray.500">Today</Text>
                        </Flex>
                        <Link 
                            href={item.link} 
                            isExternal 
                            fontSize="sm" 
                            fontWeight="500" 
                            color="gray.200"
                            _hover={{ color: 'brand.400', textDecoration: 'none' }}
                            lineHeight="1.4"
                            display="block"
                        >
                            {item.title}
                        </Link>
                    </Box>
                ))
            ) : (
                <Text color="gray.500" fontSize="sm">No recent news found.</Text>
            )}
        </VStack>
    );
}

export default NewsTicker;