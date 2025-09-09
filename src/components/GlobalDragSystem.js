/**
 * 🌍 GLOBAL CROSS-CATEGORY DRAG SYSTEM
 * 
 * Allows dragging items between different categories
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

export const GlobalDragList = ({ 
  children,
  onItemMove, // Callback when item moves between categories
  style 
}) => {
  const [globalDropInfo, setGlobalDropInfo] = useState(null);

  return (
    <View style={[styles.globalContainer, style]}>
      {/* Global drop indicator overlay */}
      {globalDropInfo && (
        <View 
          style={[
            styles.globalDropIndicator, 
            { top: globalDropInfo.y - 2 }
          ]} 
        />
      )}
      
      {React.Children.map(children, (child, index) => 
        React.cloneElement(child, {
          onGlobalDrop: setGlobalDropInfo,
          onItemMove: onItemMove,
        })
      )}
    </View>
  );
};

export const DraggableSection = ({ 
  category,
  items,
  renderItem,
  onItemsChange,
  onGlobalDrop,
  onItemMove,
  children 
}) => {
  const sectionRef = useRef(null);
  const [sectionLayout, setSectionLayout] = useState(null);

  const handleLayout = (event) => {
    sectionRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setSectionLayout({ x: pageX, y: pageY, width, height });
    });
  };

  const handleItemDrag = (draggedItem, fromIndex, globalY) => {
    // Calculate which section and position this global Y corresponds to
    // For now, just handle within-section movement
    console.log(`🌍 GLOBAL: Dragging ${draggedItem.name} from ${category} at global Y: ${globalY}`);
    
    // Calculate local drop position
    const itemHeight = 60;
    const localY = globalY - (sectionLayout?.y || 0);
    const toIndex = Math.max(0, Math.min(items.length - 1, Math.round(localY / itemHeight)));
    
    console.log(`📍 LOCAL: ${category} section Y=${sectionLayout?.y}, localY=${localY}, toIndex=${toIndex}`);
    
    if (fromIndex !== toIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      
      onItemsChange(category, newItems);
    }
  };

  return (
    <View 
      ref={sectionRef}
      onLayout={handleLayout}
      style={styles.section}
    >
      {children}
      
      {items.map((item, index) => (
        <GlobalDraggableItem
          key={item.id}
          item={item}
          index={index}
          category={category}
          totalItems={items.length}
          sectionLayout={sectionLayout}
          onDrag={handleItemDrag}
          onGlobalDrop={onGlobalDrop}
        >
          {renderItem({ item, index })}
        </GlobalDraggableItem>
      ))}
    </View>
  );
};

const GlobalDraggableItem = ({ 
  item, 
  index, 
  category,
  totalItems,
  sectionLayout,
  onDrag, 
  onGlobalDrop,
  children 
}) => {
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
        return Math.abs(gestureState.dy) > 1 || Math.abs(gestureState.dx) > 1;
      },

      onPanResponderGrant: () => {
        console.log(`🚀 GLOBAL: Drag started for ${item.name} in ${category}`);
        setIsDragging(true);
        
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
          listener: (evt, gestureState) => {
            // Calculate global position for cross-category dropping
            const globalY = (sectionLayout?.y || 0) + (index * 60) + gestureState.dy;
            
            onGlobalDrop({
              y: globalY,
              category: category,
              item: item,
            });
          },
        }
      ),

      onPanResponderRelease: (evt, gestureState) => {
        console.log(`🎯 GLOBAL: Drag ended for ${item.name}`);
        setIsDragging(false);
        onGlobalDrop(null);

        // Calculate global drop position
        const globalY = (sectionLayout?.y || 0) + (index * 60) + gestureState.dy;

        // Smoother spring animation back to position
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 120,
          friction: 8,
          velocity: gestureState.vy,
        }).start();

        // Trigger reorder with global position
        onDrag(item, index, globalY);
      },

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
        styles.globalDraggableItem,
        animatedStyle,
        isDragging && styles.globalDraggingItem,
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  globalContainer: {
    flex: 1,
    position: 'relative',
  },
  section: {
    marginVertical: 4,
  },
  globalDraggableItem: {
    backgroundColor: 'white',
    marginVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  globalDraggingItem: {
    backgroundColor: '#f8fafc',
    opacity: 0.95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  globalDropIndicator: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 4,
    backgroundColor: '#10b981',
    borderRadius: 2,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 999,
  },
});

export default { GlobalDragList, DraggableSection };
