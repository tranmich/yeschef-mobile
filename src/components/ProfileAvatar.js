/**
 * 🎨 Custom Profile Avatar Component
 * Displays user's custom profile icon with background + foreground
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ProfileAvatar = ({ 
  profile, 
  size = 'medium', 
  onPress = null, 
  showBorder = true,
  style = {} 
}) => {
  // Default profile if none provided
  const defaultProfile = {
    background: 'default',
    icon: '🍎'
  };

  const userProfile = profile || defaultProfile;

  // 🎨 Background colors mapping
  const backgroundColors = {
    'default': '#f8fafc',
    'warm': '#fef3e2',
    'fresh': '#f0fdf4',
    'ocean': '#eff6ff',
    'sunset': '#fef2f2',
    'lavender': '#f3e8ff',
    'gradient1': '#ff9a9e', // Simplified for now - can add gradients later
    'gradient2': '#a8edea',
    'gradient3': '#d299c2',
  };

  // 📏 Size configurations
  const sizeConfig = {
    small: {
      container: 32,
      icon: 16,
      borderRadius: 16,
      borderWidth: 2,
    },
    medium: {
      container: 48,
      icon: 24,
      borderRadius: 24,
      borderWidth: 2,
    },
    large: {
      container: 64,
      icon: 32,
      borderRadius: 32,
      borderWidth: 3,
    },
    xlarge: {
      container: 96,
      icon: 48,
      borderRadius: 48,
      borderWidth: 4,
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;
  const backgroundColor = backgroundColors[userProfile.background] || backgroundColors.default;

  const avatarStyle = {
    width: config.container,
    height: config.container,
    borderRadius: config.borderRadius,
    backgroundColor: backgroundColor,
    borderWidth: showBorder ? config.borderWidth : 0,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    ...style,
  };

  const iconStyle = {
    fontSize: config.icon,
  };

  const AvatarContent = () => (
    <View style={avatarStyle}>
      <Text style={iconStyle}>{userProfile.icon}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <AvatarContent />
      </TouchableOpacity>
    );
  }

  return <AvatarContent />;
};

export default ProfileAvatar;