// CommentsSection Component - Complete commenting system
// Displays comments list, handles adding comments, threading, and real-time updates

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Icon } from '../IconLibrary';
import CommentCard from './CommentCard';
import WhiteboardAPI from '../../services/WhiteboardAPI';

export default function CommentsSection({ 
  objectType, // 'recipe', 'grocery_list', 'meal_plan'
  objectId,
  currentUser,
  onCommentAdded,
  style,
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [whiteboardObjectId, setWhiteboardObjectId] = useState(null);
  const [whiteboardId, setWhiteboardId] = useState(null);
  const [commentObjectType, setCommentObjectType] = useState(null);
  const [commentObjectId, setCommentObjectId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [error, setError] = useState(null);

  // Load comments on mount
  useEffect(() => {
    loadComments();
  }, [objectId]);

  // Load whiteboard object and comments
  const loadComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get whiteboard object ID for this entity
      let whiteboardObjectResponse;
      let desktopObjectType;
      let desktopObjectId;
      
      switch (objectType) {
        case 'recipe':
          whiteboardObjectResponse = await WhiteboardAPI.getRecipeWhiteboardObject(objectId);
          desktopObjectType = 'recipeCard';  // Desktop uses 'recipeCard'
          desktopObjectId = `recipe-${objectId}`;  // Desktop uses 'recipe-123' format
          break;
        case 'grocery_list':
          whiteboardObjectResponse = await WhiteboardAPI.getGroceryListWhiteboardObject(objectId);
          desktopObjectType = 'groceryListNode';  // Desktop uses 'groceryListNode'
          desktopObjectId = `grocery-list-${objectId}`;  // Desktop uses 'grocery-list-123' format
          break;
        case 'meal_plan':
          whiteboardObjectResponse = await WhiteboardAPI.getMealPlanWhiteboardObject(objectId);
          desktopObjectType = 'mealPlanContainer';  // Desktop uses 'mealPlanContainer'
          desktopObjectId = `meal-plan-${objectId}`;  // Desktop uses 'meal-plan-123' format
          break;
        default:
          throw new Error(`Unknown object type: ${objectType}`);
      }
      
      if (whiteboardObjectResponse.success && whiteboardObjectResponse.whiteboardObject) {
        const wbObject = whiteboardObjectResponse.whiteboardObject;
        setWhiteboardObjectId(wbObject.id);
        setWhiteboardId(wbObject.whiteboard_id);
        setCommentObjectType(desktopObjectType);
        setCommentObjectId(desktopObjectId);
        
        // Load comments for this object using the desktop format
        const commentsResponse = await WhiteboardAPI.getComments(
          wbObject.whiteboard_id,
          desktopObjectType,
          desktopObjectId
        );
        
        if (commentsResponse.success) {
          // Normalize comments to ensure they have the fields CommentCard expects
          const normalizedComments = (commentsResponse.comments || []).map(comment => ({
            ...comment,
            // Desktop uses 'content', mobile components use 'txt'/'text'
            txt: comment.content || comment.txt || comment.text,
            text: comment.content || comment.text || comment.txt,
            // User info - desktop has nested user object
            user_name: comment.user?.name || comment.user_name || 'Anonymous',
            un: comment.user?.name || comment.un || 'Anonymous',
            // Timestamps
            ca: comment.created_at || comment.ca,
            ua: comment.updated_at || comment.ua,
          }));
          
          console.log('📝 Normalized comments:', JSON.stringify(normalizedComments, null, 2));
          
          setComments(normalizedComments);
        }
      } else {
        // No whiteboard object yet - no comments available
        setComments([]);
        setWhiteboardObjectId(null);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Failed to load comments');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!whiteboardId || !commentObjectType || !commentObjectId) {
      setError('This item must be added to a whiteboard first');
      return;
    }
    
    try {
      setIsPosting(true);
      
      const response = await WhiteboardAPI.addComment(
        whiteboardId,
        commentObjectType,  // Use desktop format (e.g., 'recipeCard')
        commentObjectId,    // Use desktop format (e.g., 'recipe-2609')
        newComment.trim(),
        replyingTo?.id || null
      );
      
      if (response.success && response.comment) {
        // Normalize comment structure for desktop API compatibility
        const normalizedComment = {
          ...response.comment,
          id: response.comment.id || Date.now(),
          // Desktop uses 'content', mobile components use 'txt'/'text'
          txt: response.comment.content || response.comment.txt || response.comment.text,
          text: response.comment.content || response.comment.text || response.comment.txt,
          content: response.comment.content,
          // User info
          user_name: response.comment.user?.name || currentUser?.name || 'You',
          un: response.comment.user?.name || currentUser?.name || 'You',
          created_at: response.comment.created_at || new Date().toISOString(),
          ca: response.comment.created_at || new Date().toISOString(),
        };
        
        // Add comment to local state
        setComments([...comments, normalizedComment]);
        setNewComment('');
        setReplyingTo(null);
        
        // Notify parent component
        onCommentAdded?.(normalizedComment);
      } else {
        setError('Failed to post comment');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to post comment');
    } finally {
      setIsPosting(false);
    }
  };

  // Handle reply to comment
  const handleReply = (comment) => {
    setReplyingTo(comment);
  };

  // Handle reaction to comment
  const handleReact = async (commentId, emoji) => {
    try {
      const response = await WhiteboardAPI.addReaction(commentId, emoji);
      
      if (response.success) {
        // Update comment in local state
        setComments(comments.map(c => 
          c.id === commentId ? response.comment : c
        ));
      }
    } catch (err) {
      console.error('Failed to add reaction:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#10b981" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      </View>
    );
  }

  // Not on whiteboard yet
  if (!whiteboardObjectId) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💬</Text>
          <Text style={styles.emptyStateText}>No comments yet</Text>
          <Text style={styles.emptyStateSubtext}>
            This {objectType.replace('_', ' ')} needs to be added to a whiteboard first
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Family Discussion</Text>
        <Text style={styles.commentCount}>
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <View style={styles.commentsList}>
          {comments.map((comment, index) => {
            const depth = comment.td || 0;
            return (
              <CommentCard
                key={comment?.id?.toString() || `comment-${index}`}
                comment={comment}
                currentUserId={currentUser?.id}
                depth={depth}
                onReply={handleReply}
                onReact={(emoji) => handleReact(comment.id, emoji)}
              />
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>💬</Text>
          <Text style={styles.emptyStateText}>No comments yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Be the first to share your thoughts!
          </Text>
        </View>
      )}

      {/* Reply Indicator */}
      {replyingTo && (
        <View style={styles.replyIndicator}>
          <Text style={styles.replyText}>
            Replying to {replyingTo.user_name || replyingTo.un}
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Icon name="close" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Add Comment Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
          editable={!isPosting}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!newComment.trim() || isPosting) && styles.sendButtonDisabled
          ]}
          onPress={handleAddComment}
          disabled={!newComment.trim() || isPosting}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Icon name="send" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Nunito-Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Nunito-Bold',
  },
  commentCount: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Nunito-Regular',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginLeft: 8,
    fontFamily: 'Nunito-Regular',
  },
  commentsList: {
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'Nunito-SemiBold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  replyText: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Nunito-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    maxHeight: 100,
    paddingVertical: 8,
    fontFamily: 'Nunito-Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});
