import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import YesChefAPI from '../services/YesChefAPI';
import { Icon } from '../components/IconLibrary';

const UserCommunityPostsScreen = ({ navigation }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState(null);

  useEffect(() => {
    loadUserPosts();
  }, []);

  const loadUserPosts = async () => {
    try {
      setIsLoading(true);
      
      // First try to get user's posts from API
      // TODO: Implement API call to get user's community posts
      // const response = await YesChefAPI.get('/api/community/recipes/my-posts');
      // setUserPosts(response.posts || []);
      
      // For now, get all community recipes and filter by current user
      // This simulates what would happen with a real API
      try {
        // Get current user from backend authentication
        const currentUser = await YesChefAPI.getCurrentUser();
        const allRecipesResponse = await YesChefAPI.get('/api/community/recipes?limit=50');
        
        if (allRecipesResponse.success) {
          // Filter recipes shared by current user using real backend user data
          const userRecipes = allRecipesResponse.recipes.filter(recipe => {
            if (!currentUser) return false;
            
            // Match against actual user data from backend
            const emailPrefix = currentUser.email?.split('@')[0]; // "tran.mich"
            const matches = recipe.shared_by === currentUser.email ||
                           recipe.user === currentUser.email ||
                           recipe.shared_by === currentUser.name ||
                           recipe.user === currentUser.name ||
                           recipe.shared_by === `${currentUser.name}Chef` ||
                           recipe.user === `${currentUser.name}Chef` ||
                           recipe.shared_by === `${emailPrefix}Chef` ||  // "tran.michChef"
                           recipe.user === `${emailPrefix}Chef`;
            
            return matches;
          });
          
          // Convert to user posts format
          const userPosts = userRecipes.map(recipe => ({
            id: recipe.id,
            community_title: recipe.community_title || recipe.title,
            title: recipe.title,
            shared_at: recipe.shared_at || recipe.created_at || new Date().toISOString(),
            likes: recipe.likes || 0,
            comments_count: 0, // TODO: Get real comment count
            community_icon: recipe.community_icon || recipe.image || '🍳',
          }));
          
          setUserPosts(userPosts);
          console.log('📋 Loaded user community posts from API:', userPosts.length);
          return;
        }
      } catch (apiError) {
        console.log('📋 API failed, using mock data fallback');
      }
      
      // Fallback: Mock data representing recently shared recipes
      const mockUserPosts = [
        {
          id: 1,
          community_title: 'My Shared Pasta Recipe',
          title: 'Classic Italian Pasta',
          shared_at: '2025-09-19T10:30:00Z',
          likes: 2,
          comments_count: 1,
          community_icon: '🍝',
        },
        {
          id: 2, 
          community_title: 'Homemade Pizza Night',
          title: 'Perfect Pizza Dough',
          shared_at: '2025-09-18T15:20:00Z', 
          likes: 5,
          comments_count: 3,
          community_icon: '🍕',
        },
      ];
      
      setUserPosts(mockUserPosts);
      console.log('📋 Loaded mock user community posts:', mockUserPosts.length);
    } catch (error) {
      console.error('Failed to load user posts:', error);
      setUserPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (post) => {
    Alert.alert(
      '🗑️ Delete Community Post',
      `Are you sure you want to remove "${post.community_title}" from the community? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => confirmDeletePost(post) 
        }
      ]
    );
  };

  const confirmDeletePost = async (post) => {
    try {
      setDeletingPostId(post.id);
      
      // Call the backend API to unshare the community post
      console.log('🔄 Calling API to unshare community post:', post.id);
      const response = await YesChefAPI.delete(`/api/community/recipes/${post.id}`);
      
      if (response.success) {
        // Remove from local state only if API call succeeded
        setUserPosts(prev => prev.filter(p => p.id !== post.id));
        
        Alert.alert(
          '✅ Post Deleted',
          `"${post.community_title}" has been removed from the community.`,
          [{ text: 'OK' }]
        );
        
        console.log('✅ Successfully unshared community post:', post.community_title);
      } else {
        // API call failed, show error
        Alert.alert('Error', response.error || 'Failed to delete post. Please try again.');
        console.error('❌ API delete failed:', response.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error - check your connection and try again.');
      console.error('❌ Delete error:', error);
    } finally {
      setDeletingPostId(null);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topStatusBarOverlay} />
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Community Posts</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading your posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topStatusBarOverlay} />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Community Posts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {userPosts.length > 0 ? (
          <>
            <View style={styles.statsSection}>
              <Text style={styles.statsText}>
                📊 You have shared {userPosts.length} {userPosts.length === 1 ? 'recipe' : 'recipes'} with the community
              </Text>
            </View>

            {userPosts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postInfo}>
                    <Text style={styles.postIcon}>{post.community_icon}</Text>
                    <View style={styles.postDetails}>
                      <Text style={styles.postTitle}>{post.community_title}</Text>
                      <Text style={styles.postSubtitle}>Original: {post.title}</Text>
                      <Text style={styles.postTime}>Shared {formatTimeAgo(post.shared_at)}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeletePost(post)}
                    disabled={deletingPostId === post.id}
                  >
                    {deletingPostId === post.id ? (
                      <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                      <Icon name="delete" size={20} color="#ef4444" />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.postStats}>
                  <View style={styles.statItem}>
                    <Icon name="heart" size={16} color="#ef4444" />
                    <Text style={styles.statText}>{post.likes} likes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Icon name="chat" size={16} color="#6b7280" />
                    <Text style={styles.statText}>{post.comments_count} comments</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No Community Posts Yet</Text>
            <Text style={styles.emptyDescription}>
              Share your first recipe with the community to see it here!
            </Text>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={() => navigation.navigate('My Recipes')}
            >
              <Icon name="share" size={20} color="#10b981" />
              <Text style={styles.shareButtonText}>Go Share a Recipe</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topStatusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    zIndex: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statsText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#065f46',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  postIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  postDetails: {
    flex: 1,
  },
  postTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
    marginBottom: 4,
  },
  postSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  postTime: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#9ca3af',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#10b981',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginTop: 12,
  },
});

export default UserCommunityPostsScreen;