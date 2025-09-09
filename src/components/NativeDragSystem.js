/**
 * 🔄 PRODUCTION-READY DRAG & DROP SYSTEM
 * 
 * A robust drag & drop solution using React Native's PanResponder
 * No external dependencies, fully compatible with all RN versions
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

export const DraggableItem = ({ 
  item, 
  index, 
  onDrag, 
  onDragMove,
  onDragEnd, 
  children, 
  dragEnabled = true 
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        console.log(`🎯 Start should set responder? ${dragEnabled}`);
        return dragEnabled;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const shouldDrag = dragEnabled && Math.abs(gestureState.dy) > 2;
        console.log(`🎯 Should start drag? ${shouldDrag} (dy: ${gestureState.dy})`);
        return shouldDrag;
      },

      onPanResponderGrant: (evt, gestureState) => {
        if (!dragEnabled) return;
        
        console.log(`🚀 Drag started for item:`, item.name);
        setIsDragging(true);
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
        
        onDrag && onDrag(item, index);
      },

      onPanResponderMove: (evt, gestureState) => {
        if (!dragEnabled) return;
        
        console.log(`🔄 Dragging: dy=${gestureState.dy}, moveY=${gestureState.moveY}`);
        
        // Update visual position
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(evt, gestureState);
        
        // Notify parent of drag movement for drop indicators
        onDragMove && onDragMove(gestureState);
      },

      onPanResponderRelease: (evt, gestureState) => {
        if (!dragEnabled) return;
        
        console.log(`🎯 Drag ended: dy=${gestureState.dy}, moveY=${gestureState.moveY}`);
        setIsDragging(false);
        pan.flattenOffset();

        // Animate back to position
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();

        // Notify parent of drop with gesture info
        onDragEnd && onDragEnd(item, index, gestureState);
      },

      onPanResponderTerminationRequest: () => false, // Don't allow termination during drag
      onShouldBlockNativeResponder: () => false, // Allow native gestures
    })
  ).current;

  const animatedStyle = {
    transform: pan.getTranslateTransform(),
    zIndex: isDragging ? 1000 : 1,
    elevation: isDragging ? 8 : 0,
  };

  return (
    <Animated.View
      style={[
        styles.draggableItem,
        animatedStyle,
        isDragging && styles.draggingItem,
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
};

export const DraggableList = ({ 
  data, 
  renderItem, 
  onReorder, 
  keyExtractor,
  style 
}) => {
  const [items, setItems] = useState(data);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const containerRef = useRef(null);

  const handleDragStart = (item, index) => {
    setDraggedIndex(index);
    setDropIndex(null);
  };

  const handleDragMove = (gestureState) => {
    // Use fromIndex parameter instead of draggedIndex state
    console.log(`📏 Drag move: moveY=${gestureState.moveY}, dy=${gestureState.dy}`);
    
    // More precise drop calculation
    const itemHeight = 60;
    const yPosition = gestureState.moveY;
    
    // Calculate which "slot" we're hovering over
    let newDropIndex = Math.round(yPosition / itemHeight);
    
    console.log(`📍 Calculated drop index: ${newDropIndex} (from y=${yPosition})`);
    
    // Clamp to valid range
    newDropIndex = Math.max(0, Math.min(items.length, newDropIndex));
    
    console.log(`📍 Clamped drop index: ${newDropIndex} (range: 0-${items.length})`);
    
    // Always show drop indicator during drag
    console.log(`✅ Setting drop index: ${newDropIndex}`);
    setDropIndex(newDropIndex);
  };

  const handleDragEnd = (draggedItem, fromIndex, gestureState) => {
    console.log(`🎯 Drag end called: fromIndex=${fromIndex}, draggedIndex=${draggedIndex}`);
    
    if (fromIndex === null) {
      console.log(`❌ Drag end cancelled: fromIndex is null`);
      return;
    }

    const itemHeight = 60;
    let toIndex = Math.round(gestureState.moveY / itemHeight);
    
    // Clamp to valid range
    toIndex = Math.max(0, Math.min(items.length - 1, toIndex));

    console.log(`🎯 Drag end: from ${fromIndex} to ${toIndex} (${draggedItem.name})`);
    console.log(`📊 Gesture: moveY=${gestureState.moveY}, dy=${gestureState.dy}`);

    if (fromIndex !== toIndex) {
      console.log(`🔄 Reordering items...`);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const newItems = [...items];
      
      // Remove the item from its original position
      const [removed] = newItems.splice(fromIndex, 1);
      console.log(`📤 Removed: ${removed.name} from position ${fromIndex}`);
      
      // Insert at new position
      newItems.splice(toIndex, 0, removed);
      console.log(`📥 Inserted: ${removed.name} at position ${toIndex}`);

      setItems(newItems);
      onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);
    } else {
      console.log(`🚫 No reorder needed (same position)`);
    }

    // Clear drag state AFTER processing
    setDraggedIndex(null);
    setDropIndex(null);
    console.log(`✅ Drag state cleared`);
  };

  React.useEffect(() => {
    setItems(data);
  }, [data]);

  return (
    <View ref={containerRef} style={[styles.container, style]}>
      {items.map((item, index) => (
        <View key={keyExtractor ? keyExtractor(item) : item.id}>
          {/* 🎯 DROP INDICATOR LINE - Show above current item */}
          {dropIndex === index && draggedIndex !== null && (
            <View style={styles.dropIndicator} />
          )}
          
          <DraggableItem
            item={item}
            index={index}
            onDrag={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            dragEnabled={true}
          >
            {renderItem({ item, index, isDragging: draggedIndex === index })}
          </DraggableItem>
          
          {/* 🎯 DROP INDICATOR LINE - Show at bottom if dropping at end */}
          {dropIndex === items.length && index === items.length - 1 && draggedIndex !== null && (
            <View style={styles.dropIndicator} />
          )}
        </View>
      ))}
    </View>
  );
};

// 🎯 DRAG HANDLE COMPONENT
export const DragHandle = ({ style, children }) => (
  <View style={[styles.dragHandle, style]}>
    {children || <Text style={styles.dragIndicator}>⋮⋮</Text>}
  </View>
);

// 🎯 SORTABLE SECTION WITH DRAG & DROP
export const SortableSection = ({
  title,
  data,
  renderItem,
  onItemsReorder,
  isCollapsed = false,
  onToggleCollapse,
  style,
}) => {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text 
          style={[styles.collapseArrow, isCollapsed && styles.collapsedArrow]}
          onPress={onToggleCollapse}
        >
          ▼
        </Text>
      </View>
      
      {!isCollapsed && (
        <DraggableList
          data={data}
          renderItem={renderItem}
          onReorder={onItemsReorder}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  draggableItem: {
    backgroundColor: 'white',
    marginVertical: 2,
    borderRadius: 8,
  },
  draggingItem: {
    backgroundColor: '#f3f4f6',
    opacity: 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    transform: [{ scale: 1.02 }],
  },
  dragHandle: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragIndicator: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  collapseArrow: {
    fontSize: 12,
    color: '#666',
    transform: [{ rotate: '0deg' }],
  },
  collapsedArrow: {
    transform: [{ rotate: '-90deg' }],
  },
  dropIndicator: {
    height: 3,
    backgroundColor: '#3b82f6',
    marginHorizontal: 16,
    borderRadius: 2,
    marginVertical: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 4,
  },
});

export default {
  DraggableItem,
  DraggableList,
  DragHandle,
  SortableSection,
};
