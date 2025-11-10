// PresenceBar Component - Show active household members
// Displays avatar stack of users currently viewing/editing with online indicators

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';

export default function PresenceBar({ 
  users = [], 
  text = "active now",
  maxDisplay = 3,
  size = 28,
  style,
}) {
  if (!users || users.length === 0) {
    return null;
  }

  // Get user initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Avatar colors (cycling through household members)
  const avatarColors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
  
  const getAvatarColor = (index) => {
    return avatarColors[index % avatarColors.length];
  };

  // Displayed users (limit to maxDisplay)
  const displayedUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;

  // Format text
  const formatText = () => {
    if (users.length === 1) {
      return `${users[0].name || users[0].un} ${text}`;
    }
    return `${users.length} ${users.length === 1 ? 'person' : 'people'} ${text}`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Avatar Stack */}
      <View style={styles.avatarStack}>
        {displayedUsers.map((user, index) => (
          <View
            key={user.id || index}
            style={[
              styles.avatarContainer,
              { marginLeft: index > 0 ? -10 : 0, zIndex: displayedUsers.length - index }
            ]}
          >
            {user.avatar || user.ua ? (
              <Image
                source={{ uri: user.avatar || user.ua }}
                style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
              />
            ) : (
              <View style={[
                styles.avatarPlaceholder,
                { 
                  width: size, 
                  height: size, 
                  borderRadius: size / 2,
                  backgroundColor: getAvatarColor(index)
                }
              ]}>
                <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
                  {getInitials(user.name || user.un)}
                </Text>
              </View>
            )}
            {/* Online indicator dot */}
            <View style={[styles.onlineDot, { width: size * 0.35, height: size * 0.35 }]} />
          </View>
        ))}
        
        {/* Remaining count bubble */}
        {remainingCount > 0 && (
          <View style={[
            styles.remainingBubble,
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              marginLeft: -10,
              zIndex: 0
            }
          ]}>
            <Text style={[styles.remainingText, { fontSize: size * 0.35 }]}>
              +{remainingCount}
            </Text>
          </View>
        )}
      </View>

      {/* Presence Text */}
      <Text style={styles.presenceText}>{formatText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 100,
  },
  remainingBubble: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  remainingText: {
    color: '#6b7280',
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  presenceText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
    fontFamily: 'Nunito-SemiBold',
  },
});
