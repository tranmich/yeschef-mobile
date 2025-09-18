import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  ScrollView,
  ImageBackground,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { Icon, IconButton } from '../components/IconLibrary';
import { ThemedText, typography } from '../components/Typography';
import FriendsAPI from '../services/FriendsAPI';

export default function FriendsScreen({ navigation }) {
  // 🎨 Background Configuration (matches other screens)
  const SELECTED_BACKGROUND = require('../../assets/images/backgrounds/home_green.jpg');
  
  // State for Friends page
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'households'
  
  // Modal states
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showCreateHouseholdModal, setShowCreateHouseholdModal] = useState(false);
  const [showFriendActionMenu, setShowFriendActionMenu] = useState(null);
  const [showHouseholdActionMenu, setShowHouseholdActionMenu] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [newHouseholdName, setNewHouseholdName] = useState('');
  
  // Real data from API
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load data when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadAllData();
    }, [])
  );

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadFriends(),
        loadRequests(),
        loadHouseholds()
      ]);
    } catch (error) {
      console.error('❌ Error loading Friends data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const result = await FriendsAPI.getFriends();
      if (result.success) {
        setFriends(result.friends);
      } else {
        console.error('Failed to load friends:', result.error);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadRequests = async () => {
    try {
      const result = await FriendsAPI.getFriendRequests();
      if (result.success) {
        setRequests(result.requests);
      } else {
        console.error('Failed to load requests:', result.error);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const loadHouseholds = async () => {
    try {
      const result = await FriendsAPI.getHouseholds();
      if (result.success) {
        setHouseholds(result.households);
      } else {
        console.error('Failed to load households:', result.error);
      }
    } catch (error) {
      console.error('Error loading households:', error);
    }
  };

  const loadHouseholdMembers = async (householdId) => {
    try {
      const result = await FriendsAPI.getHouseholdMembers(householdId);
      if (result.success) {
        setHouseholdMembers(result.members);
      } else {
        console.error('Failed to load household members:', result.error);
        setHouseholdMembers([]);
      }
    } catch (error) {
      console.error('Error loading household members:', error);
      setHouseholdMembers([]);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!newFriendEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await FriendsAPI.sendFriendRequest(newFriendEmail);
      if (result.success) {
        Alert.alert('Success!', result.message);
        setNewFriendEmail('');
        setShowAddFriendModal(false);
        loadRequests(); // Refresh requests to show the new outgoing request
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) {
      Alert.alert('Error', 'Please enter a household name');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await FriendsAPI.createHousehold(newHouseholdName);
      if (result.success) {
        Alert.alert('Success!', result.message);
        setNewHouseholdName('');
        setShowCreateHouseholdModal(false);
        loadHouseholds(); // Refresh households
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create household');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (request) => {
    setIsLoading(true);
    try {
      const result = await FriendsAPI.acceptFriendRequest(request.id);
      if (result.success) {
        Alert.alert('Success!', result.message);
        loadFriends(); // Refresh friends list
        loadRequests(); // Refresh requests
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRequest = async (request) => {
    setIsLoading(true);
    try {
      const result = await FriendsAPI.declineFriendRequest(request.id);
      if (result.success) {
        Alert.alert('Request Declined', result.message);
        loadRequests(); // Refresh requests
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async (friend) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await FriendsAPI.removeFriend(friend.id);
              if (result.success) {
                Alert.alert('Friend Removed', result.message);
                setShowFriendActionMenu(null);
                loadFriends(); // Refresh friends list
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteHousehold = async (household) => {
    Alert.alert(
      'Delete Household',
      `Are you sure you want to delete "${household.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await FriendsAPI.deleteHousehold(household.id);
              if (result.success) {
                Alert.alert('Household Deleted', result.message);
                loadHouseholds(); // Refresh households list
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete household');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddMemberToHousehold = async (friendId) => {
    setIsLoading(true);
    try {
      const result = await FriendsAPI.addHouseholdMember(selectedHousehold.id, friendId);
      if (result.success) {
        Alert.alert('Member Added!', result.message);
        setShowAddMemberModal(false);
        setSelectedHousehold(null);
        loadHouseholds(); // Refresh households list
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add member to household');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMemberFromHousehold = async (memberId) => {
    setIsLoading(true);
    try {
      const result = await FriendsAPI.removeHouseholdMember(selectedHousehold.id, memberId);
      if (result.success) {
        Alert.alert('Member Removed', result.message);
        setShowRemoveMemberModal(false);
        setSelectedHousehold(null);
        loadHouseholds(); // Refresh households list
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove member from household');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitialsCircle = (initials, size = 40) => (
    <View style={[styles.initialsCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initialsText, { fontSize: size * 0.35 }]}>{initials || 'U'}</Text>
    </View>
  );

  const renderFriendCard = ({ item }) => (
    <View style={styles.friendCard}>
      <View style={styles.friendHeader}>
        <View style={styles.friendInfo}>
          {getInitialsCircle(item.initials || 'U', 56)} {/* Larger profile picture */}
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.name || 'Unknown User'}</Text>
            <Text style={styles.friendStatus}>Status: {item.status || 'Unknown'}</Text>
          </View>
        </View>
        <View style={styles.friendActionsContainer}>
          <TouchableOpacity 
            style={styles.friendActions}
            onPress={() => setShowFriendActionMenu(showFriendActionMenu === item.id ? null : item.id)}
          >
            <Icon name="more-horizontal" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          {/* Friend options dropdown */}
          {showFriendActionMenu === item.id && (
            <View style={styles.friendOptionsMenu}>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  const friend = friends.find(f => f.id === showFriendActionMenu);
                  if (friend) handleRemoveFriend(friend);
                }}
              >
                <Icon name="delete" size={20} color="#dc2626" />
                <Text style={[styles.optionText, { color: '#dc2626' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <View style={styles.friendStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.sharedLists || 0}</Text>
          <Text style={styles.statLabel}>Shared Lists</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.lastActive || 'Unknown'}</Text>
          <Text style={styles.statLabel}>Last Active</Text>
        </View>
      </View>
    </View>
  );

  const renderRequestCard = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        {getInitialsCircle(item.initials || 'U', 48)} {/* Slightly smaller for requests */}
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{item.name || 'Unknown User'}</Text>
          <Text style={styles.requestEmail}>{item.email || 'No email'}</Text>
          <Text style={styles.requestMessage}>"{item.message || 'No message'}"</Text>
          <Text style={styles.requestTime}>{item.sentAt || 'Unknown time'}</Text>
        </View>
      </View>
      {item.type === 'incoming' && (
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(item)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleDeclineRequest(item)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
      {item.type === 'outgoing' && (
        <View style={styles.outgoingStatus}>
          <Text style={styles.outgoingStatusText}>Request Sent</Text>
        </View>
      )}
    </View>
  );

  const renderHouseholdCard = ({ item }) => (
    <View style={styles.householdCard}>
      <View style={styles.householdHeader}>
        <View style={styles.householdInfo}>
          <View style={[styles.initialsCircle, { backgroundColor: '#059669', width: 56, height: 56, borderRadius: 28 }]}>
            <Icon name="home" size={28} color="white" />
          </View>
          <View style={styles.householdDetails}>
            <Text style={styles.householdName}>{item.name || 'Unknown Household'}</Text>
            <Text style={styles.householdRole}>You are: {item.role || 'member'}</Text>
            <Text style={styles.householdMeta}>
              {item.members || 0} members • Created {item.createdAt || 'Unknown'}
            </Text>
          </View>
        </View>
        <View style={styles.householdActionsContainer}>
          <TouchableOpacity 
            style={styles.householdActions}
            onPress={() => setShowHouseholdActionMenu(showHouseholdActionMenu === item.id ? null : item.id)}
          >
            <Icon name="more-horizontal" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          {/* Household options dropdown */}
          {showHouseholdActionMenu === item.id && (
            <View style={styles.householdOptionsMenu}>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setSelectedHousehold(item);
                  setShowHouseholdActionMenu(null);
                  setShowAddMemberModal(true);
                }}
              >
                <Icon name="add" size={18} color="#22C55E" style={{marginRight: 12}} />
                <Text style={styles.optionText}>Member</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setSelectedHousehold(item);
                  setShowHouseholdActionMenu(null);
                  loadHouseholdMembers(item.id);
                  setShowRemoveMemberModal(true);
                }}
              >
                <Icon name="minus" size={18} color="#DC313F" style={{marginRight: 12}} />
                <Text style={styles.optionText}>Member</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.optionItem, styles.deleteOptionItem]}
                onPress={() => {
                  setShowHouseholdActionMenu(null);
                  handleDeleteHousehold(item);
                }}
              >
                <Icon name="delete" size={18} color="#DC313F" style={{marginRight: 12}} />
                <Text style={styles.deleteOptionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <View style={styles.householdStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.members || 0}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.sharedLists || 0}</Text>
          <Text style={styles.statLabel}>Shared Lists</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.sharedPlans || 0}</Text>
          <Text style={styles.statLabel}>Meal Plans</Text>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'friends':
        return (
          <FlatList
            data={friends}
            renderItem={renderFriendCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={loadFriends}
          />
        );
      case 'requests':
        return (
          <FlatList
            data={requests}
            renderItem={renderRequestCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={loadRequests}
          />
        );
      case 'households':
        return (
          <FlatList
            data={households}
            renderItem={renderHouseholdCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={loadHouseholds}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ImageBackground source={SELECTED_BACKGROUND} style={styles.backgroundImage}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.overlay} />
      
      {/* Status bar overlay */}
      <View style={styles.topStatusBarOverlay} />
      
      <SafeAreaView style={styles.container}>
        {/* Tab Navigation and Action Buttons */}
        <View style={styles.titleCard}>
          {/* Tab Navigation with Icons */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
              onPress={() => setActiveTab('friends')}
            >
              <Icon name="user-friends" size={20} color={activeTab === 'friends' ? '#1d4ed8' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                Friends ({friends.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Icon name="user-plus" size={20} color={activeTab === 'requests' ? '#1d4ed8' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                Requests ({requests.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'households' && styles.activeTab]}
              onPress={() => setActiveTab('households')}
            >
              <Icon name="home" size={20} color={activeTab === 'households' ? '#1d4ed8' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'households' && styles.activeTabText]}>
                Households ({households.length})
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.primaryActionButton}
              onPress={() => setShowAddFriendModal(true)}
            >
              <Icon name="user-plus" size={16} color="white" />
              <Text style={styles.primaryActionText}>Add Friend</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => setShowCreateHouseholdModal(true)}
            >
              <Icon name="home" size={16} color="#374151" />
              <Text style={styles.secondaryActionText}>Create Household</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        <TouchableWithoutFeedback onPress={() => {
        setShowFriendActionMenu(null);
        setShowHouseholdActionMenu(null);
      }}>
          <View style={styles.contentContainer}>
            {renderTabContent()}
          </View>
        </TouchableWithoutFeedback>

        {/* Add Friend Modal */}
        <Modal
          visible={showAddFriendModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddFriendModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Friend</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowAddFriendModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>Friend's Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={newFriendEmail}
                  onChangeText={setNewFriendEmail}
                  placeholder="friend@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleSendFriendRequest}
                >
                  <Text style={styles.submitButtonText}>Send Friend Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Create Household Modal */}
        <Modal
          visible={showCreateHouseholdModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCreateHouseholdModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Household</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowCreateHouseholdModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>Household Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newHouseholdName}
                  onChangeText={setNewHouseholdName}
                  placeholder="My Family"
                />
                
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleCreateHousehold}
                >
                  <Text style={styles.submitButtonText}>Create Household</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Member Modal */}
        <Modal
          visible={showAddMemberModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddMemberModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>👥 Add Member</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowAddMemberModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>
                  Add a friend to "{selectedHousehold?.name}"
                </Text>
                
                <ScrollView style={styles.friendsListScroll}>
                  {friends.length > 0 ? (
                    friends.map((friend) => (
                      <TouchableOpacity
                        key={friend.id}
                        style={styles.friendSelectItem}
                        onPress={() => handleAddMemberToHousehold(friend.id)}
                      >
                        {getInitialsCircle(friend.initials, 40)}
                        <View style={styles.friendSelectInfo}>
                          <Text style={styles.friendSelectName}>{friend.name}</Text>
                          <Text style={styles.friendSelectEmail}>{friend.email}</Text>
                        </View>
                        <Icon name="add" size={20} color="#059669" />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No friends available to add</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>

        {/* Remove Member Modal */}
        <Modal
          visible={showRemoveMemberModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRemoveMemberModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>👤 Remove Member</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowRemoveMemberModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>
                  Remove a member from "{selectedHousehold?.name}"
                </Text>
                
                <ScrollView style={styles.friendsListScroll}>
                  {householdMembers.length > 0 ? (
                    householdMembers
                      .filter(member => member.role !== 'owner') // Can't remove owner
                      .map((member) => (
                        <TouchableOpacity
                          key={member.id}
                          style={styles.friendSelectItem}
                          onPress={() => handleRemoveMemberFromHousehold(member.id)}
                        >
                          {getInitialsCircle(member.initials, 40)}
                          <View style={styles.friendSelectInfo}>
                            <Text style={styles.friendSelectName}>{member.name}</Text>
                            <Text style={styles.friendSelectEmail}>
                              {member.role} • Joined {member.joined_at}
                            </Text>
                          </View>
                          <Icon name="minus" size={20} color="#ea580c" />
                        </TouchableOpacity>
                      ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No removable members found</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // White opaque background like grocery/meal plan
  },
  topStatusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 50,
  },
  titleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'column', // Changed from row to column for icon above text
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, // Increased padding for vertical layout
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    gap: 4, // Space between icon and text
  },
  activeTab: {
    backgroundColor: '#e5f3ff',
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    fontWeight: '600',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    gap: 6,
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
  },
  // Initials Circle Styles
  initialsCircle: {
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  initialsText: {
    color: 'white',
    fontFamily: 'Nunito-ExtraBold',
    textAlign: 'center',
  },
  // Friend Card Styles
  friendCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    padding: 16,
  },
  friendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from flex-start to center for better alignment
    flex: 1,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
  },
  friendActions: {
    padding: 8,
  },
  friendActionsContainer: {
    position: 'relative', // For dropdown positioning
  },
  // Friend dropdown menu styles (like meal plan)
  friendOptionsMenu: {
    position: 'absolute',
    top: 24,
    right: 4,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    minWidth: 120,
  },
  friendMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteFriendMenuItem: {
    borderRadius: 6,
  },
  deleteFriendText: {
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 8,
    fontFamily: 'Nunito-Regular',
  },
  friendStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(243, 244, 246, 0.7)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    padding: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from flex-start to center
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 4, // Small margin since initials circle already has marginRight
  },
  requestName: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
    marginBottom: 2,
  },
  requestEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  requestMessage: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  declineButtonText: {
    color: '#374151',
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    fontWeight: '600',
  },
  outgoingStatus: {
    alignItems: 'center',
    paddingTop: 8,
  },
  outgoingStatusText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  householdCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    padding: 16,
  },
  householdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  householdInfo: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from flex-start to center
    flex: 1,
  },
  householdDetails: {
    flex: 1,
  },
  householdName: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
    marginBottom: 2,
  },
  householdRole: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  householdMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  householdActions: {
    padding: 8,
  },
  householdActionsContainer: {
    position: 'relative',
  },
  householdOptionsMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    minWidth: 160,
  },
  householdStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(243, 244, 246, 0.7)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#111827',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    fontWeight: '600',
  },
  // Friend Selection Styles
  friendsList: {
    maxHeight: 300,
  },
  friendsListScroll: {
    maxHeight: 300,
    marginTop: 16,
  },
  friendSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  friendSelectInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendSelectName: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#111827',
  },
  friendSelectEmail: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  membersList: {
    maxHeight: 300,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Option item styles for menus
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#374151',
    flex: 1,
  },
  deleteOptionItem: {
    backgroundColor: '#fef2f2', // Light red background
  },
  deleteOptionText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#dc2626',
    flex: 1,
    fontWeight: '500',
  },
});