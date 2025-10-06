/**
 * Voice Recipe Recorder
 * Multi-segment voice recording for family recipes
 * 
 * Features:
 * - Session-based recording (90-120s per segment)
 * - Local storage with AsyncStorage
 * - Segment management (play/delete/redo)
 * - Language selection
 * - Batch upload to backend
 * 
 * Created: October 6, 2025
 * Phase 2: Mobile UI Implementation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon } from '../components/IconLibrary';
import LanguageSelector from '../components/LanguageSelector';
import YesChefAPI from '../services/YesChefAPI';

const MAX_SEGMENT_DURATION_MS = 120 * 1000; // 120 seconds
const SEGMENT_LABELS = ['What you need', 'How to prepare', 'Cooking steps'];

const VoiceRecipeRecorder = ({ navigation }) => {
  // Session state
  const [sessionId] = useState(`session_${Date.now()}`);
  const [segments, setSegments] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingSegmentId, setPlayingSegmentId] = useState(null);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Setup state
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [recordedBy, setRecordedBy] = useState('');
  const [showSetup, setShowSetup] = useState(true);

  useEffect(() => {
    // Load saved session on mount
    loadSession();
    
    // Cleanup on unmount
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    // Save session whenever segments change
    if (segments.length > 0) {
      saveSession();
    }
  }, [segments]);

  // Update recording duration
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 100;
          if (newDuration >= MAX_SEGMENT_DURATION_MS) {
            stopRecording();
            return MAX_SEGMENT_DURATION_MS;
          }
          return newDuration;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const loadSession = async () => {
    try {
      const saved = await AsyncStorage.getItem(`recipe_session_${sessionId}`);
      if (saved) {
        const sessionData = JSON.parse(saved);
        setSegments(sessionData.segments || []);
        setSelectedLanguage(sessionData.language_config || null);
        setRecordedBy(sessionData.recorded_by || '');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const saveSession = async () => {
    try {
      const sessionData = {
        session_id: sessionId,
        segments,
        language_config: selectedLanguage,
        recorded_by: recordedBy,
        created_at: new Date().toISOString()
      };
      await AsyncStorage.setItem(
        `recipe_session_${sessionId}`,
        JSON.stringify(sessionData)
      );
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access to record recipes.');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();

      // Add segment to list
      const newSegment = {
        segment_id: segments.length + 1,
        audio_uri: uri,
        duration_ms: status.durationMillis,
        label: SEGMENT_LABELS[currentSegmentIndex] || `Segment ${segments.length + 1}`,
        recorded_at: new Date().toISOString()
      };

      setSegments([...segments, newSegment]);
      setRecording(null);
      setRecordingDuration(0);
      
      // Move to next segment label
      if (currentSegmentIndex < SEGMENT_LABELS.length - 1) {
        setCurrentSegmentIndex(currentSegmentIndex + 1);
      }

      console.log('Recording saved:', newSegment);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording.');
    }
  };

  const playSegment = async (segment) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: segment.audio_uri },
        { shouldPlay: true }
      );

      setPlayingSegmentId(segment.segment_id);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingSegmentId(null);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Failed to play segment:', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  const deleteSegment = (segmentId) => {
    Alert.alert(
      'Delete Segment',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setSegments(segments.filter(s => s.segment_id !== segmentId));
          }
        }
      ]
    );
  };

  const processSession = async () => {
    if (segments.length === 0) {
      Alert.alert('No Recordings', 'Please record at least one segment before continuing.');
      return;
    }

    if (!selectedLanguage) {
      Alert.alert('Language Required', 'Please select a language before processing.');
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate total duration
      const totalDuration = segments.reduce((sum, seg) => sum + seg.duration_ms, 0);

      // Process session
      const result = await YesChefAPI.processVoiceSession({
        session_id: sessionId,
        segments: segments,
        total_duration_ms: totalDuration,
        language_config: {
          whisperCode: selectedLanguage.whisperCode,
          culture: selectedLanguage.culture,
          region: selectedLanguage.region
        }
      });

      if (result.success) {
        // Navigate to transcript approval
        navigation.navigate('TranscriptApproval', {
          transcript: result.transcript,
          metadata: {
            recorded_by: recordedBy || 'Family',
            culture: selectedLanguage.culture,
            language: selectedLanguage.whisperCode,
            duration: totalDuration,
            session_id: sessionId,
            confidence: result.confidence
          }
        });
      } else {
        Alert.alert('Processing Failed', result.error || 'Failed to process recordings.');
      }
    } catch (error) {
      console.error('Session processing error:', error);
      Alert.alert('Error', 'An error occurred while processing your recordings.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (showSetup) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.setupContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🎤 Record Family Recipe</Text>
        </View>

        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>Quick Setup</Text>
          <Text style={styles.setupSubtitle}>Help us understand your recipe better</Text>

          <View style={styles.setupSection}>
            <LanguageSelector
              onSelect={setSelectedLanguage}
              initialLanguage={selectedLanguage}
            />
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.label}>Who's recording? (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder='e.g., "Grandma", "Mom", "Uncle"'
              value={recordedBy}
              onChangeText={setRecordedBy}
            />
          </View>

          <View style={styles.setupTips}>
            <Icon name="lightbulb" size={20} color="#f59e0b" />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Tips for great recordings:</Text>
              <Text style={styles.tipText}>• Record in parts (ingredients → prep → cooking)</Text>
              <Text style={styles.tipText}>• Speak clearly and at a natural pace</Text>
              <Text style={styles.tipText}>• You have 2 minutes per segment</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.startButton, !selectedLanguage && styles.startButtonDisabled]}
            onPress={() => setShowSetup(false)}
            disabled={!selectedLanguage}
          >
            <Text style={styles.startButtonText}>Start Recording →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recording Session</Text>
        <TouchableOpacity onPress={() => setShowSetup(true)} style={styles.settingsButton}>
          <Icon name="settings" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {SEGMENT_LABELS.map((label, index) => (
            <View key={index} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                index < segments.length && styles.progressDotComplete,
                index === currentSegmentIndex && isRecording && styles.progressDotActive
              ]}>
                {index < segments.length && (
                  <Icon name="check" size={12} color="#fff" />
                )}
              </View>
              <Text style={styles.progressLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Segment list */}
        {segments.length > 0 && (
          <View style={styles.segmentsContainer}>
            <Text style={styles.sectionTitle}>Recorded Segments ({segments.length})</Text>
            {segments.map((segment) => (
              <View key={segment.segment_id} style={styles.segmentCard}>
                <View style={styles.segmentHeader}>
                  <Text style={styles.segmentNumber}>{segment.segment_id}</Text>
                  <Text style={styles.segmentLabel}>{segment.label}</Text>
                  <Text style={styles.segmentDuration}>
                    {formatDuration(segment.duration_ms)}
                  </Text>
                </View>
                <View style={styles.segmentActions}>
                  <TouchableOpacity
                    onPress={() => playSegment(segment)}
                    style={styles.segmentActionButton}
                  >
                    <Icon 
                      name={playingSegmentId === segment.segment_id ? "pause" : "play"} 
                      size={16} 
                      color="#28a745" 
                    />
                    <Text style={styles.segmentActionText}>
                      {playingSegmentId === segment.segment_id ? 'Playing' : 'Play'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteSegment(segment.segment_id)}
                    style={styles.segmentActionButton}
                  >
                    <Icon name="trash" size={16} color="#dc2626" />
                    <Text style={[styles.segmentActionText, { color: '#dc2626' }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recording interface */}
        {isRecording ? (
          <View style={styles.recordingContainer}>
            <Text style={styles.recordingTitle}>🎙️ Recording...</Text>
            <Text style={styles.currentSegmentLabel}>{SEGMENT_LABELS[currentSegmentIndex]}</Text>
            <Text style={styles.timer}>
              {formatDuration(recordingDuration)} / {formatDuration(MAX_SEGMENT_DURATION_MS)}
            </Text>
            <View style={styles.waveform}>
              {/* Simple waveform animation placeholder */}
              <Text style={styles.waveformText}>🎵</Text>
            </View>
            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <Icon name="square" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.buttonLabel}>Stop Recording</Text>
          </View>
        ) : (
          <View style={styles.recordingContainer}>
            <Text style={styles.recordingTitle}>Ready to Record</Text>
            <Text style={styles.currentSegmentLabel}>{SEGMENT_LABELS[currentSegmentIndex]}</Text>
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
              <Icon name="mic" size={48} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.buttonLabel}>Press to Start</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomStats}>
          <Text style={styles.bottomStatsText}>
            {segments.length} segment{segments.length !== 1 ? 's' : ''} recorded
          </Text>
          {segments.length > 0 && (
            <Text style={styles.bottomStatsSubtext}>
              Total: {formatDuration(segments.reduce((sum, s) => sum + s.duration_ms, 0))}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.processButton, (segments.length === 0 || isProcessing) && styles.processButtonDisabled]}
          onPress={processSession}
          disabled={segments.length === 0 || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.processButtonText}>Process & Continue</Text>
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
  setupContainer: {
    padding: 20,
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
  settingsButton: {
    padding: 8,
  },
  setupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  setupSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  setupSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  setupTips: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
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
  startButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressDotComplete: {
    backgroundColor: '#28a745',
  },
  progressDotActive: {
    backgroundColor: '#dc2626',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  segmentsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  segmentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  segmentNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
    width: 24,
  },
  segmentLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  segmentDuration: {
    fontSize: 14,
    color: '#6b7280',
  },
  segmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  segmentActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#28a745',
    marginLeft: 6,
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  recordingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  currentSegmentLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  timer: {
    fontSize: 48,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 24,
  },
  waveform: {
    height: 60,
    marginBottom: 32,
  },
  waveformText: {
    fontSize: 48,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
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
  },
  bottomStats: {
    flex: 1,
  },
  bottomStatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  bottomStatsSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  processButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
});

export default VoiceRecipeRecorder;
