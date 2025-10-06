/**
 * Language Selector Component
 * Smart autocomplete for selecting recipe language/culture
 * 
 * Features:
 * - Type-to-search with fuzzy matching
 * - Popular language suggestions
 * - Cultural context display
 * - Whisper language code mapping
 * 
 * Created: October 6, 2025
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import YesChefAPI from '../services/YesChefAPI';
import { Icon } from './IconLibrary';

const LanguageSelector = ({ onSelect, initialLanguage = null }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(initialLanguage);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load popular languages on mount
  useEffect(() => {
    loadLanguages('');
  }, []);

  // Search as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== '' || !selected) {
        loadLanguages(query);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [query]);

  const loadLanguages = async (searchQuery) => {
    setIsLoading(true);
    try {
      const response = await YesChefAPI.searchLanguages(searchQuery);
      if (response.success) {
        setSuggestions(response.languages);
        if (searchQuery !== '' || !selected) {
          setShowSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Language search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (language) => {
    setSelected(language);
    setQuery(language.displayName);
    setShowSuggestions(false);
    onSelect(language);
  };

  const handleInputFocus = () => {
    if (!selected || query === '') {
      setShowSuggestions(true);
      loadLanguages(query);
    }
  };

  const renderLanguageItem = ({ item, index }) => {
    const isFirst = index === 0;
    
    return (
      <TouchableOpacity
        style={[
          styles.suggestionItem,
          isFirst && styles.suggestionFirst
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionContent}>
          <View style={styles.suggestionHeader}>
            {isFirst && (
              <Icon name="check" size={16} color="#28a745" style={styles.checkIcon} />
            )}
            <Text style={[
              styles.suggestionName,
              isFirst && styles.suggestionNameFirst
            ]}>
              {item.displayName}
            </Text>
          </View>
          <Text style={styles.suggestionSubtext}>
            {item.culture} • {item.region}
          </Text>
          {item.score && (
            <Text style={styles.suggestionScore}>
              Match: {Math.round(item.score / 10)}%
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Recipe Language/Culture:</Text>
      
      <View style={styles.inputContainer}>
        <Icon name="globe" size={20} color="#6b7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Type to search (e.g., 'Filipino', 'Mexican', 'Italian')"
          value={query}
          onChangeText={setQuery}
          onFocus={handleInputFocus}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {isLoading && (
          <ActivityIndicator size="small" color="#28a745" style={styles.loader} />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.id}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            maxToRender={10}
          />
        </View>
      )}

      {selected && !showSuggestions && (
        <View style={styles.selectedInfo}>
          <Icon name="check-circle" size={20} color="#28a745" />
          <View style={styles.selectedTextContainer}>
            <Text style={styles.infoText}>
              ✓ Selected: {selected.culture} ({selected.whisperCode})
            </Text>
            <Text style={styles.infoSubtext}>
              Whisper will use: {selected.displayName} language model
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1f2937',
  },
  loader: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsList: {
    flexGrow: 0,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionFirst: {
    backgroundColor: '#f0fdf4',
  },
  suggestionContent: {
    flexDirection: 'column',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkIcon: {
    marginRight: 8,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  suggestionNameFirst: {
    color: '#28a745',
    fontWeight: '600',
  },
  suggestionSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  suggestionScore: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  selectedTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 13,
    color: '#15803d',
  },
});

export default LanguageSelector;
