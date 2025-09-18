/**
 * 🔄 CROSS-CONTAINER DRAG SYSTEM
 * 
 * Advanced drag system that enables moving items between different containers
 * (e.g., moving recipes from Day 1 Breakfast to Day 2 Lunch)
 * 
 * Features:
 * - Global drop zone detection
 * - Visual feedback for valid drop targets
 * - Complex state management across containers
 * - Smooth animations and transitions
 */

import React, { useRef, useState, useContext, createContext } from 'react';
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
  Dimensions,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Context for managing global drag state
const CrossContainerDragContext = createContext({
  registerDropZone: () => {},
  unregisterDropZone: () => {},
  startDrag: () => {},
  updateDragPosition: () => {},
  endDrag: () => {},
  dropZones: [],
  isDragging: false,
  draggedItem: null,
});

// Provider component that wraps the entire meal plan screen
export const CrossContainerDragProvider = ({ children, onCrossContainerMove }) => {
  const [dropZones, setDropZones] = useState(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [activeDropZone, setActiveDropZone] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  
  // REFs for immediate, synchronous access
  const activeDropZoneRef = useRef(null);
  const draggedItemRef = useRef(null); // Add ref for draggedItem

  const registerDropZone = (id, layout, metadata) => {
    // Compact logging - only show container count for debugging
    // console.log(`📍 Registered ${id}`);
    setDropZones(prev => new Map(prev.set(id, { layout, metadata })));
  };

  const unregisterDropZone = (id) => {
    // console.log(`🗑️ Unregistered ${id}`);
    setDropZones(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const debugDropZones = () => {
    console.log(`📋 Currently registered drop zones (${dropZones.size}):`);
    for (const [id, zone] of dropZones) {
      console.log(`  • ${id}: (${zone.layout.x}, ${zone.layout.y}) ${zone.layout.width}x${zone.layout.height}`, zone.metadata);
    }
  };

  const forceRemeasureAllZones = () => {
    console.log(`🔄 Force re-measuring all drop zones...`);
    // This will trigger all useEffects to re-run
    setDropZones(new Map());
  };

  const startDrag = (item, sourceContainer) => {
    console.log(`🎯 Cross-container drag started: "${item.title}" from ${sourceContainer.dayId}-${sourceContainer.mealId}`);
    
    // Enhanced debugging - show what SHOULD be registered
    console.log(`🔍 Expected container format: ${sourceContainer.dayId}-${sourceContainer.mealId}`);
    console.log(`🔍 Looking for containers with dayId: ${sourceContainer.dayId}`);
    
    debugDropZones(); // Show all available drop zones when drag starts
    
    const dragData = { item, sourceContainer };
    setIsDragging(true);
    setDraggedItem(dragData);
    draggedItemRef.current = dragData; // Store in ref for synchronous access
  };

  const updateDragPosition = (globalX, globalY) => {
    setDragPosition({ x: globalX, y: globalY });
    
    // Find which drop zone we're over
    let newActiveDropZone = null;
    for (const [id, zone] of dropZones) {
      const { layout } = zone;
      if (
        globalX >= layout.x &&
        globalX <= layout.x + layout.width &&
        globalY >= layout.y &&
        globalY <= layout.y + layout.height
      ) {
        newActiveDropZone = id;
        break;
      }
    }
    
    if (newActiveDropZone !== activeDropZone) {
      // Update both state and ref
      setActiveDropZone(newActiveDropZone);
      activeDropZoneRef.current = newActiveDropZone;
      
      // Reduce logging frequency for better performance
      if (newActiveDropZone) {
        console.log(`🎯 Over drop zone: ${newActiveDropZone}`);
      }
    }
  };

  const endDrag = (capturedActiveDropZone = null) => {
    console.log(`🎯 Cross-container drag ended`);
    
    // Use captured activeDropZone if provided, otherwise use current
    const targetDropZone = capturedActiveDropZone || activeDropZone;
    // Use ref for draggedItem to get current value
    const currentDraggedItem = draggedItemRef.current;
    
    console.log(`📊 Target drop zone: ${targetDropZone}`);
    console.log(`📊 Dragged item:`, currentDraggedItem);
    
    if (targetDropZone && currentDraggedItem) {
      const targetZone = dropZones.get(targetDropZone);
      console.log(`📊 Target zone:`, targetZone);
      
      if (targetZone && onCrossContainerMove) {
        const { sourceContainer, item } = currentDraggedItem;
        const { metadata: targetContainer } = targetZone;
        
        console.log(`📊 Source container:`, sourceContainer);
        console.log(`📊 Target container:`, targetContainer);
        console.log(`📊 Same day? ${sourceContainer.dayId === targetContainer.dayId}`);
        console.log(`📊 Same meal? ${sourceContainer.mealId === targetContainer.mealId}`);
        
        // Only trigger move if it's actually a different container
        if (sourceContainer.dayId !== targetContainer.dayId || 
            sourceContainer.mealId !== targetContainer.mealId) {
          console.log(`🔄 Moving "${item.title}" from ${sourceContainer.dayId}-${sourceContainer.mealId} to ${targetContainer.dayId}-${targetContainer.mealId}`);
          onCrossContainerMove(item, sourceContainer, targetContainer);
        } else {
          console.log(`🚫 Same container - no cross-container move needed`);
        }
      } else {
        console.log(`🚫 Missing target zone or callback`);
      }
    } else {
      console.log(`🚫 Missing targetDropZone or draggedItem`);
    }
    
    setIsDragging(false);
    setDraggedItem(null);
    setActiveDropZone(null);
    activeDropZoneRef.current = null;
    draggedItemRef.current = null; // Reset ref
  };

  const contextValue = {
    registerDropZone,
    unregisterDropZone,
    startDrag,
    updateDragPosition,
    endDrag,
    debugDropZones, // Add debug function
    dropZones,
    isDragging,
    draggedItem,
    activeDropZone,
    activeDropZoneRef, // Add ref to context
    draggedItemRef, // Add draggedItem ref to context
  };

  return (
    <CrossContainerDragContext.Provider value={contextValue}>
      {children}
    </CrossContainerDragContext.Provider>
  );
};

// Hook to use the drag context
export const useCrossContainerDrag = () => {
  const context = useContext(CrossContainerDragContext);
  if (!context) {
    throw new Error('useCrossContainerDrag must be used within CrossContainerDragProvider');
  }
  return context;
};

// Enhanced draggable list that supports cross-container dropping
export const CrossContainerDraggableList = ({ 
  data, 
  renderItem, 
  onReorder,
  keyExtractor,
  style,
  containerId, // Unique identifier for this container
  containerMetadata, // { dayId, mealId } for meal planning
}) => {
  const dragContext = useCrossContainerDrag();
  const [items, setItems] = useState(data);
  const containerRef = useRef(null);

  // Register this container as a drop zone
  React.useEffect(() => {
    const measureContainer = () => {
      if (containerRef.current) {
        containerRef.current.measureInWindow((x, y, width, height) => {
          // Ensure minimum dimensions for empty containers
          const minHeight = 60; // Minimum height for drop zone detection
          const minWidth = 200; // Minimum width for drop zone detection
          
          const adjustedHeight = Math.max(height, minHeight);
          const adjustedWidth = Math.max(width, minWidth);
          
          // Compact logging - only log if there are issues
          // console.log(`📍 ${containerId}: ${adjustedWidth}x${adjustedHeight}`);
          
          dragContext.registerDropZone(containerId, { 
            x, 
            y, 
            width: adjustedWidth, 
            height: adjustedHeight 
          }, containerMetadata);
        });
      } else {
        console.log(`⚠️ Container ref not ready for: ${containerId}`);
      }
    };

    // Try multiple measurement attempts for better reliability
    const timer1 = setTimeout(measureContainer, 100);
    const timer2 = setTimeout(measureContainer, 300);
    const timer3 = setTimeout(measureContainer, 500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      dragContext.unregisterDropZone(containerId);
    };
  }, [containerId, containerMetadata.dayId, containerMetadata.mealId, data.length]); // Add data.length dependency

  // Update local items when data changes
  React.useEffect(() => {
    setItems(data);
  }, [data]);

  const handleItemDrag = (draggedItem, fromIndex, toIndex) => {
    // Handle local reordering (within same container)
    if (fromIndex === toIndex) return;
    
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    
    setItems(newItems);
    onReorder && onReorder(newItems, draggedItem, fromIndex, toIndex);
  };

  const isHighlighted = dragContext.isDragging && 
                      dragContext.activeDropZone === containerId &&
                      (dragContext.draggedItem?.sourceContainer?.dayId !== containerMetadata?.dayId ||
                       dragContext.draggedItem?.sourceContainer?.mealId !== containerMetadata?.mealId);

  return (
    <View 
      ref={containerRef}
      style={[
        style,
        isHighlighted && styles.highlightedDropZone
      ]}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        scrollEnabled={!dragContext.isDragging} // Disable scroll during drag
        keyboardShouldPersistTaps="handled"
        decelerationRate="normal"
      >
        {items.length === 0 ? (
          // Render empty state as droppable area
          <View style={styles.emptyDropZone}>
            <Text style={styles.emptyText}>(empty)</Text>
          </View>
        ) : (
          items.map((item, index) => {
            const baseKey = keyExtractor ? keyExtractor(item, index) : item.id;
            return (
              <CrossContainerDraggableItem
                key={baseKey}
                item={item}
                index={index}
                totalItems={items.length}
                onDrag={handleItemDrag}
                containerId={containerId}
                containerMetadata={containerMetadata}
              >
                {renderItem({ item, index })}
              </CrossContainerDraggableItem>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

// Individual draggable item with cross-container support
const CrossContainerDraggableItem = ({ 
  item, 
  index, 
  totalItems, 
  onDrag, 
  children,
  containerId,
  containerMetadata,
}) => {
  const dragContext = useCrossContainerDrag();
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);
  const itemRef = useRef(null);

  // Scale animation
  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isDragging ? 1.08 : 1,
      useNativeDriver: false,
      tension: 200,
      friction: 12,
    }).start();
  }, [isDragging]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only respond if touch is on the drag handle area (first 40px)
        const touchX = evt.nativeEvent.locationX;
        return touchX <= 40;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // More restrictive - require significant vertical movement AND touch on handle
        const touchX = evt.nativeEvent.locationX;
        const isOnHandle = touchX <= 40;
        const hasVerticalMovement = Math.abs(gestureState.dy) > 15; // Increased from 8
        const hasMinimalHorizontalMovement = Math.abs(gestureState.dx) < 25; // Prevent horizontal conflicts
        
        return isOnHandle && hasVerticalMovement && hasMinimalHorizontalMovement;
      },

      // Allow ScrollView to take priority when not dragging
      onPanResponderTerminationRequest: () => {
        return !isDragging; // Allow termination when not actively dragging
      },

      onPanResponderGrant: () => {
        setIsDragging(true);
        dragContext.startDrag(item, containerMetadata);
        
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (evt, gestureState) => {
        // Update local position
        Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        )(evt, gestureState);

        // Update global position for drop zone detection
        if (itemRef.current) {
          itemRef.current.measureInWindow((x, y, width, height) => {
            const globalX = x + gestureState.dx;
            const globalY = y + gestureState.dy;
            dragContext.updateDragPosition(globalX, globalY);
          });
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        
        // CRITICAL: Use ref for immediate, synchronous access
        const currentActiveDropZone = dragContext.activeDropZoneRef.current;
        const isDifferentContainer = currentActiveDropZone && 
                                   currentActiveDropZone !== containerId;
        
        console.log(`📊 Release: currentActiveDropZone=${currentActiveDropZone}, containerId=${containerId}, different=${isDifferentContainer}`);
        
        // End the drag context with the captured activeDropZone
        dragContext.endDrag(currentActiveDropZone);

        // Only do local reordering if we're NOT doing a cross-container move
        if (!isDifferentContainer && Math.abs(gestureState.dy) > 30) {
          const itemHeight = 46;
          let targetIndex = index + Math.round(gestureState.dy / itemHeight);
          targetIndex = Math.max(0, Math.min(totalItems - 1, targetIndex));
          
          if (targetIndex !== index) {
            console.log(`🔄 Local reorder within container: ${index} → ${targetIndex}`);
            onDrag(item, index, targetIndex);
          }
        } else if (isDifferentContainer) {
          console.log(`🔄 Cross-container move detected - skipping local reorder`);
        }

        // Smooth return animation
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 200,
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
    zIndex: isDragging ? 9999 : 1, // Maximum z-index during drag
    elevation: isDragging ? 25 : 0, // Maximum elevation during drag
    opacity: 1,
  };

  return (
    <Animated.View
      ref={itemRef}
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
  highlightedDropZone: {
    backgroundColor: '#e0f2fe', // Light blue highlight
    borderWidth: 2,
    borderColor: '#0284c7',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  draggableItem: {
    backgroundColor: 'transparent',
    marginVertical: 0,
    borderRadius: 0,
    overflow: 'visible', // Don't clip child content
  },
  draggingItem: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, // Increased shadow for better visibility
    shadowOpacity: 0.3, // More prominent shadow
    shadowRadius: 16, // Larger shadow radius
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    zIndex: 9999, // Very high z-index to ensure visibility
    elevation: 25, // Higher elevation on Android
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
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6b7280',
    marginHorizontal: 1.5,
  },
  itemContent: {
    flex: 1,
  },
  emptyDropZone: {
    minHeight: 44, // Comfortable tap target
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default CrossContainerDraggableList;