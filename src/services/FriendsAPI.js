/**
 * 👥 Friends API Service (v2)
 * Handles all Friends, Households, and Collaboration API calls
 * Updated to use v2 endpoints with proper user_id handling
 */

import YesChefAPI from './YesChefAPI';

class FriendsAPI {
    /**
     * Get current user ID from YesChefAPI
     */
    static getUserId() {
        const userId = YesChefAPI.user?.id;
        if (!userId) {
            throw new Error('User not logged in');
        }
        return userId;
    }

    /**
     * Get initials from name
     */
    static getInitials(name) {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    /**
     * Make authenticated API request (v2)
     */
    static async authenticatedRequest(endpoint, options = {}) {
        try {
            console.log(`🔵 FriendsAPI v2: ${options.method || 'GET'} ${endpoint}`);
            
            const response = await YesChefAPI.debugFetch(endpoint, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...YesChefAPI.getAuthHeaders(),
                    ...(options.headers || {})
                }
            });
            
            const result = await response.json();
            
            console.log(`📡 FriendsAPI v2 response:`, result.success ? '✅ SUCCESS' : '❌ FAILED');
            
            if (result.success === false) {
                throw new Error(result.error || 'API request failed');
            }
            
            return result;
        } catch (error) {
            console.error(`❌ FriendsAPI request to ${endpoint} failed:`, error);
            throw error;
        }
    }

    // ================================================================
    // FRIENDS MANAGEMENT (v2)
    // ================================================================

    /**
     * Get user's friends list (v2)
     */
    static async getFriends() {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(`/api/v2/friends/user/${userId}`);
            
            // Map v2 response to mobile app format
            const friends = (response.data?.friends || []).map(friend => ({
                id: friend.friend_id,
                name: friend.friend_name,
                email: friend.friend_email,
                status: friend.status || 'accepted',
                initials: this.getInitials(friend.friend_name),
                friendSince: friend.friend_since,
                friendship_id: friend.friendship_id,
                // Optional fields
                sharedLists: friend.shared_lists || 0,
                lastActive: friend.last_active || 'Unknown'
            }));
            
            return {
                success: true,
                friends: friends,
                count: response.data?.count || friends.length
            };
        } catch (error) {
            console.error('❌ Get friends error:', error);
            return {
                success: false,
                error: error.message || 'Failed to load friends',
                friends: []
            };
        }
    }

    /**
     * Get friend requests (incoming and outgoing) (v2)
     */
    static async getFriendRequests() {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(`/api/v2/friends/requests/user/${userId}`);
            
            // Map requests to mobile format
            const mapRequest = (req, type) => ({
                id: req.id,
                type: type,
                name: type === 'incoming' ? req.requester_name : req.recipient_name,
                email: type === 'incoming' ? req.requester_email : req.recipient_email,
                message: req.message || '',
                status: req.status,
                sentAt: req.created_at,
                initials: this.getInitials(type === 'incoming' ? req.requester_name : req.recipient_name),
                // Store IDs for actions
                requester_id: req.requester_id,
                recipient_id: req.recipient_id
            });
            
            const incoming = (response.data?.incoming || []).map(r => mapRequest(r, 'incoming'));
            const outgoing = (response.data?.outgoing || []).map(r => mapRequest(r, 'outgoing'));
            const all = [...incoming, ...outgoing];
            
            return {
                success: true,
                requests: all,
                incoming: incoming,
                outgoing: outgoing,
                incoming_count: response.data?.incoming_count || incoming.length,
                outgoing_count: response.data?.outgoing_count || outgoing.length
            };
        } catch (error) {
            console.error('❌ Get friend requests error:', error);
            return {
                success: false,
                error: error.message || 'Failed to load friend requests',
                requests: [],
                incoming: [],
                outgoing: []
            };
        }
    }

    /**
     * Send friend request by email (v2)
     */
    static async sendFriendRequest(email, message = '') {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest('/api/v2/friends/request', {
                method: 'POST',
                body: JSON.stringify({
                    requester_id: userId,
                    recipient_email: email.trim(),
                    message: message.trim() || undefined
                })
            });
            
            return {
                success: true,
                message: response.message || 'Friend request sent!',
                request_id: response.data?.id
            };
        } catch (error) {
            console.error('❌ Send friend request error:', error);
            return {
                success: false,
                error: error.message || 'Failed to send friend request'
            };
        }
    }

    /**
     * Accept friend request (v2)
     */
    static async acceptFriendRequest(requestId) {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(`/api/v2/friends/request/${requestId}/accept`, {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId
                })
            });
            
            return {
                success: true,
                message: response.message || 'Friend request accepted!'
            };
        } catch (error) {
            console.error('❌ Accept friend request error:', error);
            return {
                success: false,
                error: error.message || 'Failed to accept friend request'
            };
        }
    }

    /**
     * Decline friend request (v2)
     */
    static async declineFriendRequest(requestId) {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(`/api/v2/friends/request/${requestId}/decline`, {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId
                })
            });
            
            return {
                success: true,
                message: response.message || 'Friend request declined'
            };
        } catch (error) {
            console.error('❌ Decline friend request error:', error);
            return {
                success: false,
                error: error.message || 'Failed to decline friend request'
            };
        }
    }

    /**
     * Remove friend (v2)
     */
    static async removeFriend(friendId) {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(`/api/v2/friends/${friendId}?user_id=${userId}`, {
                method: 'DELETE'
            });
            
            return {
                success: true,
                message: response.message || 'Friend removed'
            };
        } catch (error) {
            console.error('❌ Remove friend error:', error);
            return {
                success: false,
                error: error.message || 'Failed to remove friend'
            };
        }
    }

    /**
     * Get friendship status between users (v2)
     */
    static async getFriendshipStatus(otherUserId) {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(
                `/api/v2/friends/status?user_id=${userId}&other_user_id=${otherUserId}`
            );
            
            return {
                success: true,
                status: response.data?.status || 'none'
            };
        } catch (error) {
            console.error('❌ Get friendship status error:', error);
            return {
                success: false,
                error: error.message || 'Failed to get friendship status',
                status: 'none'
            };
        }
    }

    // ================================================================
    // HOUSEHOLDS MANAGEMENT (v2)
    // ================================================================

    /**
     * Get user's households (v2)
     */
    static async getHouseholds() {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(`/api/v2/households/user/${userId}`);
            
            return {
                success: true,
                households: response.data?.households || [],
                count: response.data?.count || 0
            };
        } catch (error) {
            console.error('❌ Get households error:', error);
            return {
                success: false,
                error: error.message || 'Failed to load households',
                households: []
            };
        }
    }

    /**
     * Get household by ID (v2)
     */
    static async getHousehold(householdId) {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(
                `/api/v2/households/${householdId}?user_id=${userId}`
            );
            
            return {
                success: true,
                household: response.data?.household,
                members: response.data?.members || []
            };
        } catch (error) {
            console.error('❌ Get household error:', error);
            return {
                success: false,
                error: error.message || 'Failed to load household'
            };
        }
    }

    /**
     * Create new household (v2)
     */
    static async createHousehold(name, description = '') {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest('/api/v2/households', {
                method: 'POST',
                body: JSON.stringify({
                    created_by: userId,  // Backend expects created_by not user_id
                    name: name.trim(),
                    description: description.trim() || undefined
                })
            });
            
            return {
                success: true,
                message: response.message || 'Household created!',
                household: response.data
            };
        } catch (error) {
            console.error('❌ Create household error:', error);
            return {
                success: false,
                error: error.message || 'Failed to create household'
            };
        }
    }

    /**
     * Update household (v2)
     */
    static async updateHousehold(householdId, name, description) {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(`/api/v2/households/${householdId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    user_id: userId,
                    name: name?.trim(),
                    description: description?.trim()
                })
            });
            
            return {
                success: true,
                message: response.message || 'Household updated!',
                household: response.data
            };
        } catch (error) {
            console.error('❌ Update household error:', error);
            return {
                success: false,
                error: error.message || 'Failed to update household'
            };
        }
    }

    /**
     * Delete household (v2)
     */
    static async deleteHousehold(householdId) {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(
                `/api/v2/households/${householdId}?user_id=${userId}`, 
                {
                    method: 'DELETE'
                }
            );
            
            return {
                success: true,
                message: response.message || 'Household deleted successfully'
            };
        } catch (error) {
            console.error('❌ Delete household error:', error);
            return {
                success: false,
                error: error.message || 'Failed to delete household'
            };
        }
    }

    /**
     * Get household members (v2)
     */
    static async getHouseholdMembers(householdId) {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(
                `/api/v2/households/${householdId}/members?user_id=${userId}`
            );
            
            return {
                success: true,
                members: response.data?.members || []
            };
        } catch (error) {
            console.error('❌ Get household members error:', error);
            return {
                success: false,
                error: error.message || 'Failed to load household members',
                members: []
            };
        }
    }

    /**
     * Add member to household (v2)
     */
    static async addHouseholdMember(householdId, friendId, role = 'member') {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(
                `/api/v2/households/${householdId}/members`, 
                {
                    method: 'POST',
                    body: JSON.stringify({
                        user_id: userId,
                        new_member_id: friendId,
                        role: role
                    })
                }
            );
            
            return {
                success: true,
                message: response.message || 'Member added to household'
            };
        } catch (error) {
            console.error('❌ Add household member error:', error);
            return {
                success: false,
                error: error.message || 'Failed to add member to household'
            };
        }
    }

    /**
     * Remove member from household (v2)
     */
    static async removeHouseholdMember(householdId, memberId) {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(
                `/api/v2/households/${householdId}/members/${memberId}?user_id=${userId}`, 
                {
                    method: 'DELETE'
                }
            );
            
            return {
                success: true,
                message: response.message || 'Member removed from household'
            };
        } catch (error) {
            console.error('❌ Remove household member error:', error);
            return {
                success: false,
                error: error.message || 'Failed to remove member from household'
            };
        }
    }

    /**
     * Update member role in household (v2)
     */
    static async updateHouseholdMemberRole(householdId, memberId, newRole) {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(
                `/api/v2/households/${householdId}/members/${memberId}/role`, 
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        user_id: userId,
                        new_role: newRole
                    })
                }
            );
            
            return {
                success: true,
                message: response.message || 'Member role updated'
            };
        } catch (error) {
            console.error('❌ Update member role error:', error);
            return {
                success: false,
                error: error.message || 'Failed to update member role'
            };
        }
    }

    // ================================================================
    // UTILITY FUNCTIONS (v2)
    // ================================================================

    /**
     * Check if Friends API is available (v2)
     */
    static async isAvailable() {
        try {
            const userId = this.getUserId();
            const response = await this.authenticatedRequest(`/api/v2/friends/user/${userId}`);
            console.log('✅ Friends API v2 is available');
            return true;
        } catch (error) {
            console.log('ℹ️ Friends API v2 not available, will use fallback');
            return false;
        }
    }

    /**
     * Search users by email (for friend requests)
     * Note: v2 uses direct email in friend requests, no search needed
     */
    static async searchUsers(query) {
        try {
            // v2 API sends friend requests directly by email
            // No user search endpoint needed - backend looks up user
            return {
                success: true,
                users: [],
                message: 'Use sendFriendRequest() with email directly'
            };
        } catch (error) {
            console.error('❌ Search users error:', error);
            return {
                success: false,
                error: error.message || 'Failed to search users',
                users: []
            };
        }
    }
}

export default FriendsAPI;