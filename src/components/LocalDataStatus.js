/**
 * 🎯 LOCAL DATA STATUS
 * 
 * UI component to show local data status (unsaved changes, auto-save, etc.)
 * Integrates with useLocalData hook for real-time status updates
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from './IconLibrary';

export function LocalDataStatus({ 
  hasUnsavedChanges, 
  isAutoSaving, 
  lastSaved, 
  error,
  onSaveAsDraft,
  onShowDrafts,
  style = {},
  compact = false 
}) {
  
  // ==============================================
  // 🎨 STATUS RENDERING
  // ==============================================

  const renderStatus = () => {
    if (error) {
      return (
        <View style={styles.statusContainer}>
          <Icon name="alert-circle" size={16} color="#ff4444" />
          <Text style={[styles.statusText, styles.errorText]}>
            Save Error
          </Text>
        </View>
      );
    }
    
    if (isAutoSaving) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={[styles.statusText, styles.savingText]}>
            Auto-saving...
          </Text>
        </View>
      );
    }
    
    if (hasUnsavedChanges) {
      return (
        <View style={styles.statusContainer}>
          <Icon name="circle" size={8} color="#ff9800" />
          <Text style={[styles.statusText, styles.unsavedText]}>
            Unsaved changes
          </Text>
        </View>
      );
    }
    
    if (lastSaved) {
      const timeAgo = getTimeAgo(lastSaved);
      return (
        <View style={styles.statusContainer}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={[styles.statusText, styles.savedText]}>
            Saved {timeAgo}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.statusContainer}>
        <Icon name="edit" size={16} color="#666" />
        <Text style={[styles.statusText, styles.draftText]}>
          Draft
        </Text>
      </View>
    );
  };

  const renderActions = () => {
    if (compact) return null;
    
    return (
      <View style={styles.actionsContainer}>
        {hasUnsavedChanges && onSaveAsDraft && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onSaveAsDraft}
          >
            <Icon name="save" size={16} color="#2196F3" />
            <Text style={styles.actionText}>Save Draft</Text>
          </TouchableOpacity>
        )}
        
        {onShowDrafts && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onShowDrafts}
          >
            <Icon name="clock" size={16} color="#666" />
            <Text style={styles.actionText}>Drafts</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ==============================================
  // 🎯 MAIN RENDER
  // ==============================================

  return (
    <View style={[styles.container, style]}>
      {renderStatus()}
      {renderActions()}
    </View>
  );
}

// ==============================================
// 🛠️ UTILITY FUNCTIONS
// ==============================================

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// ==============================================
// 🎨 STYLES
// ==============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    marginVertical: 4,
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  
  errorText: {
    color: '#ff4444',
  },
  
  savingText: {
    color: '#4CAF50',
  },
  
  unsavedText: {
    color: '#ff9800',
  },
  
  savedText: {
    color: '#4CAF50',
  },
  
  draftText: {
    color: '#666',
  },
  
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

/**
 * Compact version for space-constrained areas
 */
export function CompactLocalDataStatus(props) {
  return <LocalDataStatus {...props} compact={true} />;
}

/**
 * Draft list modal/picker component
 */
export function DraftPicker({ 
  visible, 
  drafts = [], 
  onSelectDraft, 
  onClose,
  title = "Select Draft"
}) {
  if (!visible) return null;
  
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="x" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.draftsList}>
          {drafts.map((draft) => (
            <TouchableOpacity
              key={draft.id}
              style={styles.draftItem}
              onPress={() => onSelectDraft(draft)}
            >
              <View style={styles.draftInfo}>
                <Text style={styles.draftName}>{draft.name}</Text>
                <Text style={styles.draftMeta}>
                  {new Date(draft.timestamp).toLocaleString()} • 
                  {draft.autoGenerated ? ' Auto-saved' : ' Manual save'}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
          
          {drafts.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="file" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No drafts available</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// Additional styles for modal components
const modalStyles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  
  draftsList: {
    maxHeight: 400,
  },
  
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  draftInfo: {
    flex: 1,
  },
  
  draftName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  
  draftMeta: {
    fontSize: 12,
    color: '#666',
  },
  
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

// Merge styles
Object.assign(styles, modalStyles);

export default LocalDataStatus;