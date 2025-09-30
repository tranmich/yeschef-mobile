import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './IconLibrary';

const FullScreenEditor = ({ 
  isVisible, 
  onClose, 
  onSave, 
  title, 
  initialValue, 
  placeholder,
  multiline = true,
  editorType = 'text' // 'title', 'description', 'ingredients', 'instructions'
}) => {
  const [value, setValue] = useState('');
  const textInputRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      setValue(initialValue || '');
      // Auto-focus when modal opens
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300);
    }
  }, [isVisible, initialValue]);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const handleCancel = () => {
    setValue(initialValue || '');
    onClose();
  };

  const getPlaceholderText = () => {
    if (placeholder) return placeholder;
    
    switch (editorType) {
      case 'title':
        return 'Enter recipe title...';
      case 'description':
        return 'Describe your recipe...\n\nWhat makes it special? Any tips or background?';
      case 'ingredients':
        return 'List ingredients, one per line:\n\n• 2 cups flour\n• 1 cup sugar\n• 3 eggs\n• 1 tsp vanilla';
      case 'instructions':
        return 'Write step-by-step instructions:\n\n1. Preheat oven to 350°F\n2. Mix dry ingredients\n3. Add wet ingredients\n4. Bake for 25 minutes';
      case 'info':
        return 'Edit recipe timing and servings:\n\nPrep Time: 15 min\nCook Time: 30 min\nServings: 4';
      default:
        return 'Enter text...';
    }
  };

  const getKeyboardType = () => {
    return editorType === 'title' ? 'default' : 'default';
  };

  const getReturnKeyType = () => {
    return editorType === 'title' ? 'done' : 'default';
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Icon name="x" size={24} color="#6B7280" />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Edit'}
          </Text>
          
          <TouchableOpacity 
            style={[styles.saveButton, !value.trim() && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={!value.trim()}
          >
            <Icon name="save" size={20} color={value.trim() ? "#FFFFFF" : "#9CA3AF"} />
            <Text style={[styles.saveText, !value.trim() && styles.saveTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Editing Area */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.editorContainer}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                editorType === 'title' && styles.titleInput,
                !multiline && styles.singleLineInput
              ]}
              value={value}
              onChangeText={setValue}
              placeholder={getPlaceholderText()}
              placeholderTextColor="#9CA3AF"
              multiline={multiline}
              textAlignVertical="top"
              keyboardType={getKeyboardType()}
              returnKeyType={getReturnKeyType()}
              autoCapitalize={editorType === 'title' ? 'words' : 'sentences'}
              autoCorrect={true}
              spellCheck={true}
              scrollEnabled={true}
            />
          </View>
        </KeyboardAvoidingView>

        {/* Helper Text */}
        {(editorType === 'ingredients' || editorType === 'instructions' || editorType === 'info') && (
          <View style={styles.helperContainer}>
            {editorType === 'ingredients' && (
              <Text style={styles.helperText}>
                💡 Tip: List each ingredient on a new line. The app will automatically format them with bullet points.
              </Text>
            )}
            {editorType === 'instructions' && (
              <Text style={styles.helperText}>
                💡 Tip: Write each step on a new line. The app will automatically number them in order.
              </Text>
            )}
            {editorType === 'info' && (
              <Text style={styles.helperText}>
                💡 Tip: Use the format "Prep Time: 15 min", "Cook Time: 30 min", "Servings: 4" - one per line.
              </Text>
            )}
          </View>
        )}

      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    // Drop shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 8,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1F2937',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#AAC6AD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  saveTextDisabled: {
    color: '#9CA3AF',
  },
  keyboardView: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#1F2937',
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  titleInput: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    lineHeight: 32,
  },
  singleLineInput: {
    flex: 0,
    minHeight: 50,
  },
  helperContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  helperText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default FullScreenEditor;