/**
 * Transcript Approval Screen
 * Review and edit transcript before generating recipe
 * 
 * Features:
 * - Show combined transcript
 * - Edit capability
 * - Confidence indicator
 * - Generate recipe button
 * 
 * Created: October 6, 2025
 * Phase 2: Mobile UI Implementation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Icon } from '../components/IconLibrary';
import YesChefAPI from '../services/YesChefAPI';

const TranscriptApprovalScreen = ({ route, navigation }) => {
  const { transcript: initialTranscript, metadata } = route.params;
  
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateRecipe = async () => {
    setIsGenerating(true);

    try {
      const result = await YesChefAPI.generateRecipeFromTranscript(transcript, metadata);

      if (result.success) {
        // Navigate to recipe review (reuse RecipeImportReview!)
        navigation.navigate('RecipeImportReview', {
          recipe: result.recipe,
          recipe_id: result.recipe_id,
          source: 'voice_recording',
          metadata: {
            ...metadata,
            extraction_method: result.extraction_method,
            confidence: result.confidence
          }
        });
      } else {
        Alert.alert('Generation Failed', result.error || 'Failed to generate recipe from transcript.');
      }
    } catch (error) {
      console.error('Recipe generation error:', error);
      Alert.alert('Error', 'An error occurred while generating the recipe.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#28a745';
    if (confidence >= 0.6) return '#f59e0b';
    return '#dc2626';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return 'Excellent';
    if (confidence >= 0.6) return 'Good';
    return 'Fair';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Transcript</Text>
        <TouchableOpacity 
          onPress={() => setIsEditing(!isEditing)} 
          style={styles.editButton}
        >
          <Icon name={isEditing ? "check" : "edit"} size={20} color="#28a745" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Confidence indicator */}
        <View style={styles.confidenceContainer}>
          <View style={styles.confidenceHeader}>
            <Icon name="bar-chart" size={20} color={getConfidenceColor(metadata.confidence)} />
            <Text style={styles.confidenceTitle}>Transcription Quality</Text>
          </View>
          <View style={styles.confidenceBar}>
            <View 
              style={[
                styles.confidenceBarFill,
                { 
                  width: `${metadata.confidence * 100}%`,
                  backgroundColor: getConfidenceColor(metadata.confidence)
                }
              ]} 
            />
          </View>
          <Text style={styles.confidenceText}>
            {getConfidenceText(metadata.confidence)} ({Math.round(metadata.confidence * 100)}%)
          </Text>
        </View>

        {/* Metadata info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="user" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>Recorded by:</Text>
            <Text style={styles.infoValue}>{metadata.recorded_by}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="globe" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>Culture:</Text>
            <Text style={styles.infoValue}>{metadata.culture}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="clock" size={16} color="#6b7280" />
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>
              {Math.round(metadata.duration / 1000)}s
            </Text>
          </View>
        </View>

        {/* Transcript */}
        <View style={styles.transcriptContainer}>
          <View style={styles.transcriptHeader}>
            <Text style={styles.transcriptTitle}>Transcript</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <TextInput
              style={styles.transcriptInput}
              value={transcript}
              onChangeText={setTranscript}
              multiline
              autoFocus
              placeholder="Enter your recipe transcript here..."
            />
          ) : (
            <Text style={styles.transcriptText}>{transcript}</Text>
          )}

          {isEditing && (
            <View style={styles.editTips}>
              <Icon name="info" size={16} color="#3b82f6" />
              <Text style={styles.editTipsText}>
                Fix any errors or add missing details. The AI will structure this into a recipe.
              </Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Icon name="lightbulb" size={20} color="#f59e0b" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>What happens next?</Text>
            <Text style={styles.tipText}>
              • AI will extract ingredients and quantities
            </Text>
            <Text style={styles.tipText}>
              • Instructions will be organized step-by-step
            </Text>
            <Text style={styles.tipText}>
              • You'll review and edit before saving
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Back to Recording</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={generateRecipe}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <Text style={styles.generateButtonText}>Generate Recipe</Text>
              <Icon name="arrow-right" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginLeft: 12,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  confidenceContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  transcriptContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  transcriptText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
  transcriptInput: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  editTips: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  editTipsText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    marginLeft: 8,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#78350f',
    marginBottom: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  generateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
});

export default TranscriptApprovalScreen;
