/**
 * 🎨 ULTRA-SMOOTH GOOGLE KEEP DRAG SYSTEM
 * 
 * Lessons learned:
 * ✅ Users confirmed: "It felt SO MUCH smoother!"
 * 🚨 Fixed: Animation driver conflicts (native vs JS)
 * 
 * New approach:
 * - Single transform approach (no mixed animations)
 * - Visual displacement without Animated.Values conflicts
 * - Pure Google Keep feel with zero driver issues
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
  const [dragState, setDragState] = useState({
    draggedIndex: null,
    targetIndex: null,
  });
  
  // Simplified live preview
  const handleLivePreview = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) {
      setDragState(prev => ({ ...prev, targetIndex: null }));
      return;
    }
    
    setDragState(prev => ({ ...prev, targetIndex: toIndex }));
  };

  // Final reorder with immediate cleanup
  const handleFinalReorder = (draggedItem, fromIndex, toIndex) => {
    // Clear all drag state immediately
    setDragState({ draggedIndex: null, targetIndex: null });
    
    if (fromIndex === toIndex) {
      return;
    }
    
    // Single smooth layout animation
    LayoutAnimation.configureNext({
      duration: 150,
      update: {
        type: LayoutAnimation.Types.easeOut,
      },
    });

    const newItems = [...data];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);

    setItems(newItems);
    onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);
  };

  useEffect(() => {
    setItems(data);
  }, [data]);

  return (
    <ScrollView 
      style={[styles.container, style]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      scrollEnabled={scrollEnabled && dragState.draggedIndex === null}
      scrollEventThrottle={16}
    >
      {items.map((item, index) => {
        const key = `${keyExtractor(item)}-${index}`;
        const isDragging = dragState.draggedIndex === index;
        
        // Calculate simple visual displacement (no complex animations)
        let translateY = 0;
        if (dragState.targetIndex !== null && !isDragging) {
          const { draggedIndex, targetIndex } = dragState;
          
          if (draggedIndex < targetIndex) {
            // Dragging down - move items up
            if (index > draggedIndex && index <= targetIndex) {
              translateY = -50;
            }
          } else {
            // Dragging up - move items down
            if (index >= targetIndex && index < draggedIndex) {
              translateY = 50;
            }
          }
        }
        
        return (
          <UltraSmoothDraggableItem
            key={key}
            item={item}
            index={index}
            totalItems={items.length}
            isDragging={isDragging}
            translateY={translateY}
            onLivePreview={handleLivePreview}
            onFinalReorder={handleFinalReorder}
            onDragStart={(idx) => setDragState(prev => ({ ...prev, draggedIndex: idx }))}
            onDragEnd={() => setDragState({ draggedIndex: null, targetIndex: null })}
          >
            {renderItem({ item, index })}
          </UltraSmoothDraggableItem>
        );
      })}
    </ScrollView>
  );
};

const UltraSmoothDraggableItem = ({ 
  item, 
  index, 
  totalItems, 
  isDragging,
  translateY,
  onLivePreview,
  onFinalReorder, 
  onDragStart,
  onDragEnd,
  children 
}) => {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 2;
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
          useNativeDriver: false, // Consistent JS driver
          listener: (_, gestureState) => {
            const itemHeight = 50;
            let targetIndex = index + Math.round(gestureState.dy / itemHeight);
            targetIndex = Math.max(0, Math.min(totalItems - 1, targetIndex));
            
            if (Math.abs(gestureState.dy) > 8) {
              onLivePreview(index, targetIndex);
            }
          },
        }
      ),

      onPanResponderRelease: (_, gestureState) => {
        onDragEnd();
        
        const itemHeight = 50;
        let targetIndex = index + Math.round(gestureState.dy / itemHeight);
        targetIndex = Math.max(0, Math.min(totalItems - 1, targetIndex));
        
        if (Math.abs(gestureState.dy) > 8) {
          onFinalReorder(item, index, targetIndex);
        }

        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false, // Consistent JS driver
          tension: 180,
          friction: 8,
        }).start();
        
        pan.flattenOffset();
      },

      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // Single, clean transform (no animation conflicts)
  const animatedStyle = {
    transform: [
      { translateY: translateY }, // Simple number, no Animated.Value
      ...pan.getTranslateTransform(), // Both use same JS driver
      { scale: isDragging ? 1.02 : 1 },
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
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
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