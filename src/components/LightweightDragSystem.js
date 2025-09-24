/**
 * 🎨 LIGHTWEIGHT GOOGLE KEEP-STYLE DRAG SYSTEM
 * 
 * Key Innovation: Visual-only live preview
 * - Items APPEAR to switch places using transforms (not array changes)
 * - Data remains stable during drag
 * - Only reorder on final release
 * - Much lighter and smoother
 * 
 * Google Keep Accuracy:
 * ✅ Visual feedback only during drag
 * ✅ Transform-based positioning
 * ✅ Minimal state changes
 * ✅ Smooth, responsive feel
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
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [targetIndex, setTargetIndex] = useState(null);
  
  // Visual-only live preview (no array changes during drag)
  const handleLivePreview = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) {
      setTargetIndex(null);
      return;
    }
    
    // Only update visual target index (no array manipulation)
    setTargetIndex(toIndex);
  };

  // Final reorder only on release
  const handleFinalReorder = (draggedItem, fromIndex, toIndex) => {
    // Clear drag state immediately
    setDraggedIndex(null);
    setTargetIndex(null);
    
    if (fromIndex === toIndex) {
      return;
    }
    
    // Quick, single layout animation for final reorder
    LayoutAnimation.configureNext({
      duration: 180,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    // Final array reordering (source of truth from props)
    const newItems = [...data];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);

    setItems(newItems);
    onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);
  };

  // Update when props change
  useEffect(() => {
    setItems(data);
  }, [data]);

  return (
    <ScrollView 
      style={[styles.container, style]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      scrollEnabled={scrollEnabled && draggedIndex === null}
      scrollEventThrottle={16}
    >
      {items.map((item, index) => {
        const key = `${keyExtractor(item)}-${index}`;
        const isDragging = draggedIndex === index;
        
        // Calculate visual offset for smooth preview (Google Keep style)
        let visualOffset = 0;
        if (targetIndex !== null && !isDragging) {
          if (draggedIndex < targetIndex) {
            // Item being dragged down - move items up
            if (index > draggedIndex && index <= targetIndex) {
              visualOffset = -50; // Item height
            }
          } else {
            // Item being dragged up - move items down  
            if (index >= targetIndex && index < draggedIndex) {
              visualOffset = 50; // Item height
            }
          }
        }
        
        return (
          <LightweightDraggableItem
            key={key}
            item={item}
            index={index}
            totalItems={items.length}
            isDragging={isDragging}
            visualOffset={visualOffset}
            onLivePreview={handleLivePreview}
            onFinalReorder={handleFinalReorder}
            onDragStart={(idx) => setDraggedIndex(idx)}
            onDragEnd={() => {
              setDraggedIndex(null);
              setTargetIndex(null);
            }}
          >
            {renderItem({ item, index })}
          </LightweightDraggableItem>
        );
      })}
    </ScrollView>
  );
};

const LightweightDraggableItem = ({ 
  item, 
  index, 
  totalItems, 
  isDragging,
  visualOffset,
  onLivePreview,
  onFinalReorder, 
  onDragStart,
  onDragEnd,
  children 
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const offsetAnim = useRef(new Animated.Value(visualOffset)).current;

  // Smooth visual offset animation (for other items moving out of the way)
  useEffect(() => {
    Animated.timing(offsetAnim, {
      toValue: visualOffset,
      duration: 100, // Very quick for responsive feel
      useNativeDriver: true,
    }).start();
  }, [visualOffset, offsetAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 2; // Very sensitive
      },

      onPanResponderGrant: () => {
        onDragStart(index);
        
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
          listener: (_, gestureState) => {
            // Lightweight live preview calculation
            const itemHeight = 50;
            let targetIndex = index + Math.round(gestureState.dy / itemHeight);
            targetIndex = Math.max(0, Math.min(totalItems - 1, targetIndex));
            
            // Trigger visual preview (no heavy operations)
            if (Math.abs(gestureState.dy) > 10) {
              onLivePreview(index, targetIndex);
            }
          },
        }
      ),

      onPanResponderRelease: (_, gestureState) => {
        onDragEnd();
        
        // Calculate final position
        const itemHeight = 50;
        let targetIndex = index + Math.round(gestureState.dy / itemHeight);
        targetIndex = Math.max(0, Math.min(totalItems - 1, targetIndex));
        
        // Trigger final reorder
        if (Math.abs(gestureState.dy) > 10) {
          onFinalReorder(item, index, targetIndex);
        }

        // Quick return animation
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 200,
          friction: 10,
        }).start();
        
        pan.flattenOffset();
      },

      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const animatedStyle = {
    transform: [
      { translateY: offsetAnim }, // Visual offset for live preview
      ...pan.getTranslateTransform(), // Drag transform
      { scale: isDragging ? 1.02 : 1 }, // Subtle scale (lighter than before)
    ],
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.95 : 1,
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
        {/* Lightweight drag handle */}
        <View
          style={styles.dragHandle}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragDots}>
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
    borderRadius: 0,
    overflow: 'visible',
  },
  draggingItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 1.5,
    opacity: 0.5,
  },
  dotActive: {
    backgroundColor: '#6B7280',
    opacity: 0.8,
  },
  itemContent: {
    flex: 1,
  },
});

export default SimpleDraggableList;