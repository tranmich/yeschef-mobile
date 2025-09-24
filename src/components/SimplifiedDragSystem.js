/**
 * 🎨 SIMPLIFIED DRAG SYSTEM - No Complex Animations
 * 
 * SAFE VERSION - Eliminates animation issues from OptimizedDragSystem
 * 
 * Features:
 * ✅ Google Keep-style basic feedback  
 * ✅ Zero animation loops (production-safe)
 * ✅ Plug-and-play API (backward compatible)
 * ✅ Performance optimized with minimal animations
 * ✅ No console spam
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const SimpleDraggableList = ({ 
  data = [], 
  renderItem, 
  onReorder,
  keyExtractor = (item) => item.id,
  style,
  scrollEnabled = true,
  showsVerticalScrollIndicator = false
}) => {
  const [items, setItems] = useState(data);
  
  // Performance optimization: debounce rapid updates
  const lastUpdateTime = useRef(0);
  const isProcessing = useRef(false);

  // Simple reorder handler with debouncing
  const handleItemReorder = (draggedItem, fromIndex, toIndex) => {
    const now = Date.now();
    
    // Prevent rapid-fire updates (< 150ms apart) 
    if (now - lastUpdateTime.current < 150 || isProcessing.current) {
      return;
    }
    
    // Skip if no actual movement
    if (fromIndex === toIndex) {
      return;
    }
    
    isProcessing.current = true;
    lastUpdateTime.current = now;
    
    // Simple layout animation
    LayoutAnimation.configureNext({
      duration: 200,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    // Clean array reordering
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);

    setItems(newItems);
    onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);
    
    // Reset processing flag
    setTimeout(() => {
      isProcessing.current = false;
    }, 150);
  };

  // Update items when data changes
  useEffect(() => {
    setItems(data);
  }, [data]);

  return (
    <ScrollView 
      style={[styles.container, style]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      scrollEnabled={scrollEnabled}
      scrollEventThrottle={16}
    >
      {items.map((item, index) => {
        const key = `${keyExtractor(item)}-${index}`;
        return (
          <SimplifiedDraggableItem
            key={key}
            item={item}
            index={index}
            totalItems={items.length}
            onReorder={handleItemReorder}
          >
            {renderItem({ item, index })}
          </SimplifiedDraggableItem>
        );
      })}
    </ScrollView>
  );
};

const SimplifiedDraggableItem = ({ 
  item, 
  index, 
  totalItems, 
  onReorder, 
  children 
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },

      onPanResponderGrant: () => {
        setIsDragging(true);
        
        // Simple drag initialization without complex animations
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        
        // Calculate target position
        const dragThreshold = 40;
        
        if (Math.abs(gestureState.dy) > dragThreshold) {
          const itemHeight = 50;
          let targetIndex = index + Math.round(gestureState.dy / itemHeight);
          targetIndex = Math.max(0, Math.min(totalItems - 1, targetIndex));
          
          if (targetIndex !== index) {
            onReorder(item, index, targetIndex);
          }
        }

        // Simple return animation
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 120,
          friction: 8,
        }).start(() => {
          pan.flattenOffset();
        });
      },

      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => isDragging,
    })
  ).current;

  // Simple animated style - no complex animations
  const animatedStyle = {
    transform: pan.getTranslateTransform(),
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <Animated.View
      style={[
        styles.draggableItem,
        animatedStyle,
        isDragging && styles.draggingItem,
      ]}
    >
      <View style={styles.itemContainer}>
        {/* Simple drag handle */}
        <View
          style={[styles.dragHandle, isDragging && styles.dragHandleActive]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragDots}>
            {/* Simple 6 dots */}
            {[0, 1, 2].map(row => (
              <View key={row} style={styles.dotRow}>
                <View style={[styles.dot, isDragging && styles.dotActive]} />
                <View style={[styles.dot, isDragging && styles.dotActive]} />
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.itemContent}>
          {children}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  draggableItem: {
    backgroundColor: 'transparent',
    marginVertical: 0,
  },
  draggingItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    width: 32,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 4,
  },
  dragHandleActive: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
  },
  dragDots: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dotRow: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 1.5,
    opacity: 0.6,
  },
  dotActive: {
    backgroundColor: '#6B7280',
    opacity: 1,
  },
  itemContent: {
    flex: 1,
  },
});

export default SimpleDraggableList;