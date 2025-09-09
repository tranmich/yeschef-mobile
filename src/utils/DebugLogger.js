/**
 * 🚨 METRO ERROR INTERCEPTOR
 * 
 * Catches errors at the bundler level before they reach React
 * This should help with TurboModule and native-level errors
 */

import { YellowBox, LogBox } from 'react-native';

// Disable all warnings for cleaner debugging
if (__DEV__) {
  // Configure LogBox to show errors more clearly
  LogBox.ignoreAllLogs(false); // Show logs
  
  // Enhanced error reporting
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  console.error = (...args) => {
    // Log to original console
    originalError(...args);
    
    // Create a more visible log
    originalLog('\n🚨🚨🚨 CRITICAL ERROR 🚨🚨🚨');
    originalLog('Error Details:', ...args);
    originalLog('Time:', new Date().toISOString());
    originalLog('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n');
    
    // Try to extract useful information
    args.forEach((arg, index) => {
      if (typeof arg === 'string') {
        originalLog(`String ${index}:`, arg);
      } else if (arg && arg.stack) {
        originalLog(`Stack ${index}:`, arg.stack);
      } else if (arg && typeof arg === 'object') {
        originalLog(`Object ${index}:`, JSON.stringify(arg, null, 2));
      }
    });
    originalLog('\n===========================================\n');
  };

  console.warn = (...args) => {
    originalWarn(...args);
    originalLog('\n⚠️ WARNING:', ...args, '\n');
  };

  // Catch unhandled promise rejections
  const handleUnhandledRejection = (event) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', event.reason);
    if (event.reason && event.reason.stack) {
      console.error('Stack:', event.reason.stack);
    }
  };

  // Catch general errors
  const handleError = (error) => {
    console.error('🚨 GENERAL ERROR:', error);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  };

  // Set up global error handlers
  if (typeof global !== 'undefined') {
    global.addEventListener?.('unhandledrejection', handleUnhandledRejection);
    global.addEventListener?.('error', handleError);
  }

  // Override the global error handler
  const originalGlobalHandler = global.ErrorUtils?.getGlobalHandler();
  if (global.ErrorUtils) {
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('🚨 GLOBAL ERROR HANDLER:', error, 'isFatal:', isFatal);
      if (originalGlobalHandler) {
        originalGlobalHandler(error, isFatal);
      }
    });
  }

  console.log('🚀 Enhanced Error Debugging Initialized');
  console.log('📱 App starting in debug mode...');
}

export default {};
