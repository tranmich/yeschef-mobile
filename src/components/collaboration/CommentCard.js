// CommentCard Component - Individual comment display
// Shows user avatar, name, comment text, timestamp, reactions, and reply button

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Icon } from '../IconLibrary';

export default function CommentCard({ 
  comment, 
  onReply, 
  onReact,
  currentUserId,
  depth = 0, // Thread depth for indentation
}) {
  const [showReactions, setShowReactions] = useState(false);
  
  // Available emoji reactions
  const availableReactions = ['👍', '❤️', '😋', '🔥', '😂'];
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Get user initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  // Parse reactions object { '👍': [1, 5, 12], '❤️': [3, 7] }
  const reactions = comment.rx || {};
  const hasReactions = Object.keys(reactions).length > 0;
  
  // Check if current user has reacted
  const userReacted = (emoji) => {
    return reactions[emoji]?.includes(currentUserId);
  };
  
  // Handle reaction tap
  const handleReactionTap = (emoji) => {
    onReact?.(emoji);
    setShowReactions(false);
  };
  
  return (
    <View style={[
      styles.container,
      depth > 0 && { marginLeft: 20 * depth, borderLeftWidth: 2, borderLeftColor: '#e5e7eb' }
    ]}>
      {/* User Avatar */}
      <View style={styles.avatarContainer}>
        {comment.user_avatar ? (
          <Image 
            source={{ uri: comment.user_avatar }} 
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {getInitials(comment.user_name || comment.un)}
            </Text>
          </View>
        )}
      </View>
      
      {/* Comment Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.userName}>
            {comment.user_name || comment.un || 'Anonymous'}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(comment.created_at || comment.ca)}
          </Text>
        </View>
        
        {/* Comment Text */}
        <Text style={styles.commentText}>{comment.txt || comment.text}</Text>
        
        {/* Reactions Display */}
        {hasReactions && (
          <View style={styles.reactionsDisplay}>
            {Object.entries(reactions).map(([emoji, userIds]) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.reactionPill,
                  userReacted(emoji) && styles.reactionPillActive
                ]}
                onPress={() => handleReactionTap(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{userIds.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowReactions(!showReactions)}
          >
            <Icon name="heart" size={14} color="#6b7280" />
            <Text style={styles.actionText}>React</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onReply?.(comment)}
          >
            <Icon name="comment" size={14} color="#6b7280" />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        </View>
        
        {/* Reaction Picker */}
        {showReactions && (
          <View style={styles.reactionPicker}>
            {availableReactions.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionOption}
                onPress={() => handleReactionTap(emoji)}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
    fontFamily: 'Nunito-SemiBold',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Nunito-Regular',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Nunito-Regular',
  },
  reactionsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginRight: 6,
    marginBottom: 4,
  },
  reactionPillActive: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    fontFamily: 'Nunito-SemiBold',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
    fontFamily: 'Nunito-Regular',
  },
  reactionPicker: {
    flexDirection: 'row',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  reactionOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reactionOptionEmoji: {
    fontSize: 24,
  },
});
