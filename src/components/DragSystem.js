/**
 * 🔄 SIMPLIFIED DRAG SYSTEM
 * 
 * A      console.log('🚫 PARENT DEBOUNCED: Too soon since last reorder');much simpler approach that avoids state timing issues
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
  ScrollView,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const SimpleDraggableList = ({ 
  data, 
  renderItem, 
  onReorder,
  keyExtractor,
  style 
}) => {
  const [items, setItems] = useState(data);
  
  // Bulletproof debouncing at the parent level to prevent ALL spam
  const lastExecutionTime = useRef(0);
  const isProcessing = useRef(false);

  const handleItemDrag = (draggedItem, fromIndex, toIndex) => {
    const now = Date.now();
    
    // Prevent spam: must be at least 100ms since last execution
    if (now - lastExecutionTime.current < 100) {
      console.log('� PARENT DEBOUNCED: Too soon since last reorder');
      return;
    }
    
    // Prevent concurrent execution
    if (isProcessing.current) {
      console.log('🚫 PARENT BLOCKED: Already processing a reorder');
      return;
    }
    
    // Only proceed if indices actually changed
    if (fromIndex === toIndex) {
      console.log('🚫 PARENT SKIPPED: No position change');
      return;
    }
    
    isProcessing.current = true;
    lastExecutionTime.current = now;
    
    console.log(`✅ PARENT EXECUTING: Moving "${draggedItem.name}" from ${fromIndex} to ${toIndex}`);

    // Buttery smooth animation - fast and responsive
    LayoutAnimation.configureNext({
      duration: 180, // Quick but visible
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.9, // High damping for smooth stop
      },
    });

    // Smooth reordering algorithm
    const newItems = [];
    const draggedItemData = items[fromIndex];
    const itemsWithoutDragged = items.filter((_, index) => index !== fromIndex);
    
    let adjustedToIndex = toIndex;
    if (toIndex > fromIndex) {
      adjustedToIndex = toIndex - 1;
    }
    
    for (let i = 0; i <= itemsWithoutDragged.length; i++) {
      if (i === adjustedToIndex) {
        newItems.push(draggedItemData);
      }
      if (i < itemsWithoutDragged.length) {
        newItems.push(itemsWithoutDragged[i]);
      }
    }

    setItems(newItems);
    onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessing.current = false;
    }, 50);
  };

  React.useEffect(() => {
    setItems(data);
  }, [data]);

  return (
    <ScrollView 
      style={[styles.container, style]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      scrollEventThrottle={16}
    >
      {items.map((item, index) => (
        <SimpleDraggableItem
          key={keyExtractor ? keyExtractor(item) : item.id}
          item={item}
          index={index}
          totalItems={items.length}
          onDrag={handleItemDrag}
        >
          {renderItem({ item, index })}
        </SimpleDraggableItem>
      ))}
    </ScrollView>
  );
};

const SimpleDraggableItem = ({ 
  item, 
  index, 
  totalItems, 
  onDrag, 
  children 
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);

  // Buttery smooth scale animation
  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isDragging ? 1.08 : 1, // Slightly larger for better feedback
      useNativeDriver: false,
      tension: 200, // Higher tension for snappy response
      friction: 12, // Higher friction for smooth stop
    }).start();
  }, [isDragging]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Less sensitive - require more movement to start drag
        return Math.abs(gestureState.dy) > 8;
      },

      onPanResponderGrant: () => {
        setIsDragging(true);
        // Set offset for smooth dragging
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
        // Removed live shuffling listener completely for buttery smooth feel
      ),

      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        
        // Only reorder if there was significant movement (more than 30px)
        if (Math.abs(gestureState.dy) > 30) {
          const itemHeight = 46;
          let finalTargetIndex;
          
          if (gestureState.dy > 0) {
            finalTargetIndex = index + Math.round(gestureState.dy / itemHeight);
          } else {
            finalTargetIndex = index + Math.round(gestureState.dy / itemHeight);
          }
          
          finalTargetIndex = Math.max(0, Math.min(totalItems - 1, finalTargetIndex));
          
          // Call parent directly - it has the bulletproof debouncing
          onDrag(item, index, finalTargetIndex);
        }

        // Smooth return animation
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 200, // Snappier return
          friction: 12,
        }).start();
        
        pan.flattenOffset();
      },
    })
  ).current;

  const animatedStyle = {
    transform: [
      ...pan.getTranslateTransform(),
      { scale: scaleAnim }
    ],
    zIndex: isDragging ? 1000 : 1,
    elevation: isDragging ? 20 : 0, // High elevation for floating effect
    opacity: isDragging ? 0.95 : 1, // Slight transparency when dragging
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
        {/* Drag Handle */}
        <View
          style={styles.dragHandle}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragDots}>
            <View style={styles.dotRow}>
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
            <View style={styles.dotRow}>
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
            <View style={styles.dotRow}>
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        </View>
        
        {/* Item Content */}
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
    backgroundColor: 'white',
    marginVertical: 0.5, // Minimal margin for tighter spacing
    borderRadius: 4, // Smaller radius for cleaner look
    overflow: 'hidden',
  },
  draggingItem: {
    backgroundColor: '#fafafa', // Very subtle background change
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // Balanced shadow
    shadowOpacity: 0.15, // Subtle shadow
    shadowRadius: 8, // Smooth shadow radius
    borderWidth: 0.5, // Thinner border
    borderColor: '#e5e7eb',
    // Removed rotation for smoother feel
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    width: 24,
    height: 44, // Fixed height to match grocery item height
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 2,
  },
  dragDots: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    marginVertical: 0.5,
  },
  dot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#9ca3af',
    marginHorizontal: 1,
  },
  itemContent: {
    flex: 1,
  },
});

export default SimpleDraggableList;
