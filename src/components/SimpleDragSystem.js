/**
 * 🔄 SIMPLIFIED DRAG SYSTEM
 * 
 * A much simpler approach that avoids state timing issues
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const SimpleDraggableList = ({ 
  data, 
  renderItem, 
  onReorder,
  onCrossCategoryMove, // NEW: Callback for cross-category moves
  allItems, // NEW: All items in all categories for cross-category detection
  category, // NEW: Current category name
  keyExtractor,
  style 
}) => {
  const [items, setItems] = useState(data);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState(null);

  const handleItemDrag = (draggedItem, fromIndex, toIndex) => {
    console.log(`🔄 SIMPLE: Moving "${draggedItem.name}" from ${fromIndex} to ${toIndex}`);
    
    if (fromIndex === toIndex) {
      console.log(`🚫 SIMPLE: Same position, no change needed`);
      return;
    }

    // Check if this is a cross-category move (item dragged far outside current category)
    if (onCrossCategoryMove && allItems && (toIndex < 0 || toIndex >= items.length)) {
      console.log(`🌍 CROSS-CATEGORY: ${draggedItem.name} moving outside ${category}`);
      onCrossCategoryMove(draggedItem, category, toIndex);
      return;
    }

    // Smoother, faster animation
    LayoutAnimation.configureNext({
      duration: 200,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.8,
      },
    });

    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);

    console.log(`✅ SIMPLE: Reorder complete. New order:`, newItems.map(item => item.name));
    
    setItems(newItems);
    onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);
  };

  React.useEffect(() => {
    setItems(data);
  }, [data]);

  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => (
        <View key={keyExtractor ? keyExtractor(item) : item.id}>
          {/* Drop indicator */}
          {dropIndicatorIndex === index && (
            <View style={styles.dropIndicator} />
          )}
          
          <SimpleDraggableItem
            item={item}
            index={index}
            totalItems={items.length}
            onDrag={handleItemDrag}
            onDropIndicator={setDropIndicatorIndex}
          >
            {renderItem({ item, index })}
          </SimpleDraggableItem>
          
          {/* Drop indicator at end */}
          {dropIndicatorIndex === items.length && index === items.length - 1 && (
            <View style={styles.dropIndicator} />
          )}
        </View>
      ))}
    </View>
  );
};

const SimpleDraggableItem = ({ item, index, totalItems, onDrag, onDropIndicator, children }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);

  // Smooth scale animation for drag state
  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isDragging ? 1.05 : 1.0,
      useNativeDriver: false,
      tension: 150,
      friction: 8,
    }).start();
  }, [isDragging, scaleAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // More sensitive - start drag with minimal movement
        return Math.abs(gestureState.dy) > 1 || Math.abs(gestureState.dx) > 1;
      },

      onPanResponderGrant: () => {
        // console.log(`🚀 SIMPLE: Drag started for ${item.name} at index ${index}`);
        setIsDragging(true);
        
        // Smooth grant animation
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
        
        // Immediate haptic feedback (if available)
        if (Platform.OS === 'ios') {
          // Could add haptic feedback here
        }
      },

      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        {
          useNativeDriver: false,
          listener: (evt, gestureState) => {
            // Throttle the drop indicator updates for smoothness
            if (Math.abs(gestureState.dy) % 5 < 2) {
              const itemHeight = 60;
              
              // FIXED: Simple approach - just add the drag distance to current index
              let dropIndex = index + Math.round(gestureState.dy / itemHeight);
              
              // Clamp to valid range
              dropIndex = Math.max(0, Math.min(totalItems, dropIndex));
              
              console.log(`📏 FIXED: index=${index}, dy=${gestureState.dy.toFixed(1)}, dropIndex=${dropIndex}`);
              
              onDropIndicator(dropIndex);
            }
          },
        }
      ),

      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        onDropIndicator(null);

        // FIXED: Same simple calculation for release
        const itemHeight = 60;
        let toIndex = index + Math.round(gestureState.dy / itemHeight);
        
        // Clamp to valid range
        toIndex = Math.max(0, Math.min(totalItems - 1, toIndex));
        
        console.log(`🎯 FIXED RELEASE: ${item.name} from ${index} to ${toIndex} (dy=${gestureState.dy.toFixed(1)})`);

        // Smoother spring animation back to position
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 120,
          friction: 8,
          velocity: gestureState.vy,
        }).start();

        // Trigger reorder
        onDrag(item, index, toIndex);
      },

      // Smooth termination handling
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  const animatedStyle = {
    transform: [
      ...pan.getTranslateTransform(),
      { scale: scaleAnim }
    ],
    zIndex: isDragging ? 1000 : 1,
    elevation: isDragging ? 12 : 0,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  draggableItem: {
    backgroundColor: 'white',
    marginVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  draggingItem: {
    backgroundColor: '#f8fafc',
    opacity: 0.95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropIndicator: {
    height: 4,
    backgroundColor: '#3b82f6',
    marginHorizontal: 12,
    borderRadius: 2,
    marginVertical: 1,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },
});

export default SimpleDraggableList;
