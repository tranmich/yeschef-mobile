/**
 * 🔄 SIMPLIFIED DRAG & DROP SYSTEM (STABLE VERSION)
 * 
 * A stable drag & drop solution that avoids complex reanimated dependencies
 * while we debug the TurboModule issues.
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';

// 🎯 SIMPLIFIED DRAG CONTAINER
export const DragContainer = ({ children, style }) => {
  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
};

// 🎯 SIMPLIFIED DRAGGABLE LIST
export const DraggableList = ({
  data,
  renderItem,
  onDragEnd,
  keyExtractor,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  ...props
}) => {
  return (
    <DraggableFlatList
      data={data}
      renderItem={({ item, drag, isActive, getIndex }) => {
        const index = getIndex();
        return (
          <View style={isActive ? styles.activeItem : styles.normalItem}>
            {renderItem({ item, drag, isActive, index })}
          </View>
        );
      }}
      keyExtractor={keyExtractor}
      onDragEnd={onDragEnd}
      containerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      activationDistance={10}
      {...props}
    />
  );
};

// 🎯 SIMPLIFIED DRAG HANDLE
export const DragHandle = ({ onDrag, style, children, disabled = false }) => {
  return (
    <TouchableOpacity
      onLongPress={disabled ? undefined : onDrag}
      style={[styles.dragHandle, style]}
      delayLongPress={150}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dragHandle: {
    flex: 1,
  },
  normalItem: {
    backgroundColor: 'transparent',
  },
  activeItem: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default {
  DragContainer,
  DraggableList,
  DragHandle,
};
