// ActivityCard Component - Display household activity item
// Shows avatar, user action, timestamp, preview, and quick actions

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Icon } from '../IconLibrary';

export default function ActivityCard({ 
  activity,
  onPress,
  onReply,
  onView,
  style,
}) {
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

  // Get user initials
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'recipe_added':
        return { name: 'plus', color: '#10b981' };
      case 'comment_added':
        return { name: 'comment', color: '#3b82f6' };
      case 'tag_added':
        return { name: 'tag', color: '#f59e0b' };
      case 'grocery_updated':
        return { name: 'shopping-cart', color: '#8b5cf6' };
      case 'meal_plan_updated':
        return { name: 'calendar', color: '#ec4899' };
      case 'user_joined':
        return { name: 'user-plus', color: '#14b8a6' };
      default:
        return { name: 'activity', color: '#6b7280' };
    }
  };

  const activityIcon = getActivityIcon(activity.type);
  const user = activity.user || {};

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress?.(activity)}
      activeOpacity={0.7}
    >
      {/* User Avatar */}
      <View style={styles.avatarContainer}>
        {user.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {getInitials(user.name || user.username)}
            </Text>
          </View>
        )}
        {/* Activity type badge */}
        <View style={[styles.activityBadge, { backgroundColor: activityIcon.color }]}>
          <Icon name={activityIcon.name} size={10} color="#ffffff" />
        </View>
      </View>

      {/* Activity Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.textContent}>
            <Text style={styles.activityText}>
              <Text style={styles.userName}>{user.name || user.username || 'Someone'}</Text>
              {' '}
              {activity.action || 'did something'}
            </Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(activity.created_at || activity.timestamp)}
            </Text>
          </View>

          {/* Live indicator */}
          {activity.is_live && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
        </View>

        {/* Preview */}
        {activity.preview && (
          <View style={styles.preview}>
            <Text style={styles.previewText} numberOfLines={2}>
              {activity.preview}
            </Text>
          </View>
        )}

        {/* Tags */}
        {activity.tags && activity.tags.length > 0 && (
          <View style={styles.tags}>
            {activity.tags.slice(0, 3).map((tag, index) => (
              <View key={`${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {activity.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{activity.tags.length - 3}</Text>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actions}>
          {onReply && activity.type === 'comment_added' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onReply(activity);
              }}
            >
              <Icon name="comment" size={14} color="#6b7280" />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
          )}

          {onView && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onView(activity);
              }}
            >
              <Icon name="eye" size={14} color="#6b7280" />
              <Text style={styles.actionText}>View</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  activityBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  textContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 2,
    fontFamily: 'Nunito-Regular',
  },
  userName: {
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'Nunito-SemiBold',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'Nunito-Regular',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  liveText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  preview: {
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    fontFamily: 'Nunito-Regular',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    fontFamily: 'Nunito-SemiBold',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#9ca3af',
    alignSelf: 'center',
    fontFamily: 'Nunito-Regular',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontFamily: 'Nunito-Regular',
  },
});
