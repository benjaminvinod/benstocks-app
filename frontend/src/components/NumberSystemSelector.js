// src/components/NumberSystemSelector.js
import React from 'react';
import { Select, Box } from '@chakra-ui/react';
import { useNumberFormat } from '../context/NumberFormatContext';

function NumberSystemSelector() {
  const { numberSystem, setNumberSystem } = useNumberFormat();

  return (
    <Box minWidth="100px" mr={2}>
      <Select
        size="sm"
        value={numberSystem}
        onChange={(e) => setNumberSystem(e.target.value)}
        bg="var(--bg-secondary-dynamic, var(--bg-dark-secondary))"
        borderColor="var(--border-dynamic, var(--border-color))"
        color="var(--text-primary-dynamic, var(--text-primary))"
        cursor="pointer"
        _hover={{ borderColor: 'var(--brand-primary-dynamic, var(--brand-primary))' }}
      >
        <option value="INTL" style={{ color: 'black' }}>INTL (M/B)</option>
        <option value="IN" style={{ color: 'black' }}>IND (L/Cr)</option>
      </Select>
    </Box>
  );
}

export default NumberSystemSelector;