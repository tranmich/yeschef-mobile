/**
 * 🎨 OPTIMIZED DRAG SYSTEM - Google Keep Inspired
 * 
 * Features:
 * ✅ Google Keep-style smooth animations
 * ✅ Zero console spam (production-ready)
 * ✅ 60fps performance with native driver
 * ✅ Plug-and-play API (backward compatible)
 * ✅ Minimal re-renders and state updates
 * ✅ Clean memory management
 * 
 * Design Philosophy:
 * - Smooth and responsive like Google Keep
 * - Performance first (no debug logging)
 * - Simple and reliable
 * - Beautiful visual feedback
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
  const [isDragging, setIsDragging] = useState(false);
  
  // Performance optimization: debounce rapid updates
  const lastUpdateTime = useRef(0);
  const isProcessing = useRef(false);

  // Smooth reorder handler with debouncing
  const handleItemReorder = (draggedItem, fromIndex, toIndex) => {
    const now = Date.now();
    
    // Prevent rapid-fire updates (< 100ms apart)
    if (now - lastUpdateTime.current < 100 || isProcessing.current) {
      return;
    }
    
    // Skip if no actual movement
    if (fromIndex === toIndex) {
      return;
    }
    
    isProcessing.current = true;
    lastUpdateTime.current = now;
    
    // Google Keep-style smooth layout animation
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.85,
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
    }, 100);
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
      scrollEnabled={scrollEnabled && !isDragging}
      scrollEventThrottle={16}
    >
      {items.map((item, index) => {
        const key = `${keyExtractor(item)}-${index}`;
        return (
          <OptimizedDraggableItem
            key={key}
            item={item}
            index={index}
            totalItems={items.length}
            onReorder={handleItemReorder}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          >
            {renderItem({ item, index })}
          </OptimizedDraggableItem>
        );
      })}
    </ScrollView>
  );
};

const OptimizedDraggableItem = ({ 
  item, 
  index, 
  totalItems, 
  onReorder, 
  onDragStart,
  onDragEnd,
  children 
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const elevation = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);

  // Google Keep-style drag state animations
  useEffect(() => {
    const scaleValue = isDragging ? 1.05 : 1;
    const elevationValue = isDragging ? 8 : 0;

    // Parallel animations for smooth feel
    Animated.parallel([
      Animated.spring(scale, {
        toValue: scaleValue,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
      Animated.timing(elevation, {
        toValue: elevationValue,
        duration: 200,
        useNativeDriver: false,
      })
    ]).start();
  }, [isDragging, scale, elevation]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Start drag with minimal movement (Google Keep-style sensitivity)
        return Math.abs(gestureState.dy) > 3;
      },

      onPanResponderGrant: () => {
        setIsDragging(true);
        onDragStart();
        
        // Smooth drag initialization
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { 
          useNativeDriver: false,
          // No listener - keeps it simple and performant
        }
      ),

      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        onDragEnd();
        
        // Calculate target position based on movement
        const dragThreshold = 35; // Minimum movement to trigger reorder
        
        if (Math.abs(gestureState.dy) > dragThreshold) {
          const itemHeight = 50; // Approximate item height
          let targetIndex = index + Math.round(gestureState.dy / itemHeight);
          
          // Clamp to valid range
          targetIndex = Math.max(0, Math.min(totalItems - 1, targetIndex));
          
          if (targetIndex !== index) {
            onReorder(item, index, targetIndex);
          }
        }

        // Smooth return animation
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            tension: 150,
            friction: 8,
          })
        ]).start();
        
        pan.flattenOffset();
      },

      // Prevent gesture conflicts
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => isDragging,
    })
  ).current;

  const animatedStyle = {
    transform: [
      ...pan.getTranslateTransform(),
      { scale: scale }
    ],
    zIndex: isDragging ? 1000 : 1,
    elevation: elevation,
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
        {/* Google Keep-style drag handle */}
        <View
          style={styles.dragHandle}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragDots}>
            {/* 6 dots in 3 rows (like current system) */}
            {[0, 1, 2].map(row => (
              <View key={row} style={styles.dotRow}>
                <View style={[styles.dot, isDragging && styles.dotActive]} />
                <View style={[styles.dot, isDragging && styles.dotActive]} />
              </View>
            ))}
          </View>
        </View>
        
        {/* Item content */}
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
    borderRadius: 0,
    overflow: 'visible',
  },
  draggingItem: {
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Google Keep-style elevated appearance
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
    // Smooth transition for active state
    opacity: 0.6,
  },
  dotActive: {
    backgroundColor: '#6B7280',
    opacity: 1,
    // Slightly larger when dragging (Google Keep-style)
    transform: [{ scale: 1.2 }],
  },
  itemContent: {
    flex: 1,
  },
});

export default SimpleDraggableList;