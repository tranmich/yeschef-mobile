/**
 * 🔄 SIMPLIFIED DRAG SYSTEM
 * 
 * A      consol    // Prevent spam: must be at least 100    
      newItems.splice(toIndex, 0, draggedItemData);

    setItems(newItems);
    onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessing.current = false;
      setRenderKey(prev => prev + 1); // Increment to force re-render
    }, 50);
  };t the new position
    newItems.splice(toIndex, 0, draggedItemData);

    setItems(newItems);
    onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);t execution
    if (now - lastExecutionTime.current < 100) {
      return;
    }('🚫 PARENT DEBOUNCED: Too soon since l    console.log(`📊 AFTER STATE:`, newItems.map((item, idx) => `${idx}: "${item.name}"`));
    console.log(`✅ FINAL: Array has ${newItems.length} items`);
    console.log(`🔍 DRAG DEBUG END\n`);

    // Update state and notify parent
    setItems(newItems);
    onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);
    
    // Force complete re-render to fix UI update issues
    setTimeout(() => {
      console.log(`🔄 FORCING UI REFRESH with new render key`);
      setRenderKey(prev => prev + 1); // Increment to force re-render
    }, 50);order');much simpler approach that avoids state timing issues
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
  const [renderKey, setRenderKey] = useState(0); // Force re-render counter
  
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
      return;
    }
    
    // Only proceed if indices actually changed
    if (fromIndex === toIndex) {
      return;
    }
    
    isProcessing.current = true;
    lastExecutionTime.current = now;
    
    // Smooth animation
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

    // Simple and reliable reordering algorithm
    const newItems = [...items];
    const draggedItemData = newItems[fromIndex];
    
    // Remove the item from its original position
    const removedItems = newItems.splice(fromIndex, 1);
    
    // Insert it at the new position
    newItems.splice(toIndex, 0, draggedItemData);
    console.log(`🔄 STEP 4: Inserted item at position ${toIndex}`);
    console.log(`🔄 STEP 4: Array now has ${newItems.length} items`);

    console.log(`� AFTER STATE:`, newItems.map((item, idx) => `${idx}: "${item.name}"`));
    console.log(`✅ FINAL: Array has ${newItems.length} items`);
    console.log(`🔍 DRAG DEBUG END\n`);

    setItems(newItems);
    onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessing.current = false;
    }, 50);
  };

  React.useEffect(() => {
    console.log(`🔄 DATA CHANGED: Updating items from ${items.length} to ${data.length}`);
    setItems(data);
    setRenderKey(prev => prev + 1); // Force re-render when data changes
  }, [data]);

  return (
    <ScrollView 
      style={[styles.container, style]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      scrollEventThrottle={16}
    >
      {items.map((item, index) => {
        const baseKey = keyExtractor ? keyExtractor(item) : item.id;
        const uniqueKey = `${baseKey}-${renderKey}-${index}`; // Unique key with position
        return (
          <SimpleDraggableItem
            key={uniqueKey}
            item={item}
            index={index}
            totalItems={items.length}
            onDrag={handleItemDrag}
          >
            {renderItem({ item, index })}
          </SimpleDraggableItem>
        );
      })}
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
      onStartShouldSetPanResponder: (evt, gestureState) => {
        console.log(`🎯 START RESPONDER: Should set? YES`);
        return true;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Less sensitive - require more movement to start drag
        const shouldSet = Math.abs(gestureState.dy) > 8;
        console.log(`🎯 MOVE RESPONDER: dy=${gestureState.dy}px, should set? ${shouldSet}`);
        return shouldSet;
      },

      // CRITICAL: Block navigation gestures
      onShouldBlockNativeResponder: () => {
        console.log(`🛡️ BLOCKING native responder`);
        return true;
      },
      onPanResponderTerminationRequest: () => {
        console.log(`🚫 TERMINATION REQUEST: Denied`);
        return false; // Don't let other gestures steal
      },

      onPanResponderGrant: () => {
        console.log(`✅ DRAG GRANTED: Starting drag for "${item.name}"`);
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
        
        console.log(`\n🎯 GESTURE DEBUG - ${new Date().toLocaleTimeString()}`);
        console.log(`👆 Gesture dy: ${gestureState.dy}px`);
        console.log(`📍 Item index: ${index}`);
        console.log(`📏 Total items: ${totalItems}`);
        
        // Only reorder if there was significant movement (more than 30px)
        if (Math.abs(gestureState.dy) > 30) {
          const itemHeight = 46;
          let finalTargetIndex;
          
          if (gestureState.dy > 0) {
            finalTargetIndex = index + Math.round(gestureState.dy / itemHeight);
          } else {
            finalTargetIndex = index + Math.round(gestureState.dy / itemHeight);
          }
          
          console.log(`📐 Raw calculated index: ${finalTargetIndex}`);
          
          finalTargetIndex = Math.max(0, Math.min(totalItems - 1, finalTargetIndex));
          
          console.log(`🎯 Final target index: ${finalTargetIndex}`);
          console.log(`📋 Item being moved: "${item.name}"`);
          console.log(`🎯 GESTURE DEBUG END\n`);
          
          // Call parent directly - it has the bulletproof debouncing
          onDrag(item, index, finalTargetIndex);
        } else {
          console.log(`🚫 Movement too small (${gestureState.dy}px), not reordering`);
          console.log(`🎯 GESTURE DEBUG END\n`);
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
    opacity: 1, // Always visible - no transparency issues
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
    backgroundColor: 'transparent', // Let child control background
    marginVertical: 0,
    borderRadius: 0,
    overflow: 'visible', // Don't clip child content
  },
  draggingItem: {
    backgroundColor: 'transparent', // Let child control background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 0, // No border interference
    borderColor: 'transparent',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    width: 32,        // Increased from 24 for better touch area
    height: 44,       // Keep same height to match grocery item
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,   // Increased from 6 for more space
    paddingRight: 4,  // Increased from 2 for more space
  },
  dragDots: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,       // Added padding around dots for better touch
  },
  dotRow: {
    flexDirection: 'row',
    marginVertical: 1, // Increased from 0.5 for more spacing
  },
  dot: {
    width: 4,         // Increased from 2.5 for better visibility
    height: 4,        // Increased from 2.5 for better visibility
    borderRadius: 2,  // Updated to match new size
    backgroundColor: '#6b7280', // Slightly darker for better visibility
    marginHorizontal: 1.5, // Increased from 1 for better spacing
  },
  itemContent: {
    flex: 1,
  },
});

export default SimpleDraggableList;
