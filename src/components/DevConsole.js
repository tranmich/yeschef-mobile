/**
 * 🚨 DEVELOPMENT ERROR CONSOLE
 * 
 * Creates a visible error console overlay for React Native
 * This will show errors directly on the phone screen
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  Share
} from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Temporarily disabled

const { width, height } = Dimensions.get('window');

const DevConsole = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    // Override console methods to capture logs
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
    };

    const addLog = (type, args) => {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = {
        id: Date.now() + Math.random(),
        type,
        timestamp,
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
      };

      setLogs(prev => [...prev.slice(-99), logEntry]); // Keep last 100 logs
      
      if (type === 'error') {
        setErrorCount(prev => prev + 1);
      }

      // Also call original console methods
      originalConsole[type](...args);
    };

    console.log = (...args) => addLog('log', args);
    console.error = (...args) => addLog('error', args);
    console.warn = (...args) => addLog('warn', args);

    // Capture global errors
    const originalErrorHandler = global.ErrorUtils?.getGlobalHandler();
    if (global.ErrorUtils) {
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        addLog('error', [`🚨 FATAL ERROR: ${error.message}`, error.stack]);
        if (originalErrorHandler) {
          originalErrorHandler(error, isFatal);
        }
      });
    }

    // Capture unhandled promise rejections
    const unhandledRejectionHandler = (event) => {
      addLog('error', ['🚨 UNHANDLED REJECTION:', event.reason]);
    };

    if (typeof global.addEventListener === 'function') {
      global.addEventListener('unhandledrejection', unhandledRejectionHandler);
    }

    console.log('🚀 DevConsole initialized');

    return () => {
      // Restore original console methods
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
    setErrorCount(0);
  };

  const shareLogs = async () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');

    try {
      await Share.share({
        message: `YesChef Debug Logs:\n\n${logText}`,
        title: 'YesChef Debug Logs'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share logs');
    }
  };

  const getLogStyle = (type) => {
    switch (type) {
      case 'error':
        return styles.errorLog;
      case 'warn':
        return styles.warnLog;
      default:
        return styles.normalLog;
    }
  };

  return (
    <View style={styles.container}>
      {children}
      
      {/* Floating Error Indicator */}
      {errorCount > 0 && (
        <TouchableOpacity 
          style={styles.errorIndicator}
          onPress={() => setIsVisible(true)}
        >
          <Text style={styles.errorIndicatorText}>🚨 {errorCount}</Text>
        </TouchableOpacity>
      )}

      {/* Console Toggle Button */}
      <TouchableOpacity 
        style={styles.consoleToggle}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.consoleToggleText}>📱</Text>
      </TouchableOpacity>

      {/* Console Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.consoleContainer}>
          <View style={styles.consoleHeader}>
            <Text style={styles.consoleTitle}>🚨 Dev Console ({logs.length} logs)</Text>
            <View style={styles.consoleButtons}>
              <TouchableOpacity onPress={shareLogs} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>📤</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearLogs} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>🗑️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.logContainer}>
            {logs.map(log => (
              <View key={log.id} style={getLogStyle(log.type)}>
                <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                <Text style={styles.logType}>{log.type.toUpperCase()}</Text>
                <Text style={styles.logMessage}>{log.message}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#ef4444',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 1000,
  },
  errorIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  consoleToggle: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#374151',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  consoleToggleText: {
    fontSize: 20,
  },
  consoleContainer: {
    flex: 1,
    backgroundColor: '#1f2937',
  },
  consoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
  },
  consoleTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  consoleButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 12,
    padding: 8,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 16,
  },
  logContainer: {
    flex: 1,
    padding: 8,
  },
  normalLog: {
    padding: 8,
    marginBottom: 4,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  errorLog: {
    padding: 8,
    marginBottom: 4,
    backgroundColor: '#7f1d1d',
    borderRadius: 4,
  },
  warnLog: {
    padding: 8,
    marginBottom: 4,
    backgroundColor: '#a16207',
    borderRadius: 4,
  },
  logTimestamp: {
    color: '#9ca3af',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  logType: {
    color: '#f3f4f6',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  logMessage: {
    color: '#f3f4f6',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});

export default DevConsole;
