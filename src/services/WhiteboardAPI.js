// Whiteboard API Service - Mobile Collaboration Features
// Provides access to whiteboard endpoints for comments, tags, presence, and activity

import YesChefAPI from './YesChefAPI';

class WhiteboardAPI {
  
  // ===================================
  // HOUSEHOLD ACTIVITY
  // ===================================
  
  /**
   * Get recent household activity (comments, recipe adds, etc.)
   * @param {number} householdId - Household ID
   * @param {number} limit - Number of activities to fetch (default: 20)
   * @returns {Promise} Array of activity objects
   */
  static async getHouseholdActivity(householdId, limit = 20) {
    try {
      const response = await YesChefAPI.get(`/api/v2/activity/households/${householdId}?limit=${limit}`);
      return {
        success: true,
        activities: response.activities || response.events || [],
      };
    } catch (error) {
      console.error('Failed to fetch household activity:', error);
      return {
        success: false,
        error: error.message,
        activities: [],
      };
    }
  }

  // ===================================
  // WHITEBOARD OBJECT LINKS
  // ===================================

  /**
   * Get whiteboard object for a recipe (if it exists on any whiteboard)
   * @param {number} recipeId - Recipe ID
   * @returns {Promise} Whiteboard object or null
   */
  static async getRecipeWhiteboardObject(recipeId) {
    try {
      const response = await YesChefAPI.get(`/api/v2/whiteboard/recipes/${recipeId}/whiteboard-object`);
      return {
        success: true,
        whiteboardObject: response.whiteboard_object || null,
      };
    } catch (error) {
      console.log('Recipe not on any whiteboard:', error);
      return {
        success: true,
        whiteboardObject: null,
      };
    }
  }

  /**
   * Get whiteboard object for a meal plan
   * @param {number} mealPlanId - Meal plan ID
   * @returns {Promise} Whiteboard object or null
   */
  static async getMealPlanWhiteboardObject(mealPlanId) {
    try {
      const response = await YesChefAPI.get(`/api/v2/whiteboard/meal-plans/${mealPlanId}/whiteboard-object`);
      return {
        success: true,
        whiteboardObject: response.whiteboard_object || null,
      };
    } catch (error) {
      console.log('Meal plan not on any whiteboard:', error);
      return {
        success: true,
        whiteboardObject: null,
      };
    }
  }

  /**
   * Get whiteboard object for a grocery list
   * @param {number} groceryListId - Grocery list ID
   * @returns {Promise} Whiteboard object or null
   */
  static async getGroceryListWhiteboardObject(groceryListId) {
    try {
      const response = await YesChefAPI.get(`/api/v2/whiteboard/grocery-lists/${groceryListId}/whiteboard-object`);
      return {
        success: true,
        whiteboardObject: response.whiteboard_object || null,
      };
    } catch (error) {
      console.log('Grocery list not on any whiteboard:', error);
      return {
        success: true,
        whiteboardObject: null,
      };
    }
  }

  // ===================================
  // COMMENTS
  // ===================================

    /**
   * Get comments for a whiteboard object
   * @param {number} whiteboardId - Whiteboard ID
   * @param {string} objectType - Object type (e.g., 'recipe')
   * @param {number} objectId - Object ID
   * @returns {Promise} Comments array
   */
  static async getComments(whiteboardId, objectType, objectId) {
    try {
      // Use the existing comments API that desktop uses
      const url = `/api/v2/comments?whiteboard_id=${whiteboardId}&object_type=${objectType}&object_id=${objectId}`;
      const response = await YesChefAPI.get(url);
      
      console.log('📝 Comments response:', JSON.stringify(response, null, 2));
      console.log('📝 Comments array:', response.comments);
      console.log('📝 Comments count:', response.comments?.length || 0);
      
      return {
        success: true,
        comments: response.comments || [],
      };
    } catch (error) {
      console.error('Failed to load comments:', error);
      return {
        success: false,
        error: error.message,
        comments: [],
      };
    }
  }

  /**
   * Add a comment to a whiteboard object
   * @param {number} whiteboardId - Whiteboard ID
   * @param {string} objectType - Object type (e.g., 'recipe')
   * @param {number} objectId - Object ID (e.g., recipe ID)
   * @param {string} text - Comment text
   * @param {number} parentId - Parent comment ID (for threading, optional)
   * @returns {Promise} Created comment object
   */
  static async addComment(whiteboardId, objectType, objectId, text, parentId = null) {
    try {
      const payload = { 
        whiteboard_id: whiteboardId,
        object_type: objectType,
        object_id: objectId,
        content: text,
      };
      
      if (parentId) {
        payload.parent_id = parentId;
      }
      
      const response = await YesChefAPI.post(`/api/v2/comments`, payload);
      
      return {
        success: true,
        comment: response.comment,
      };
    } catch (error) {
      console.error('Failed to add comment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Add a reaction (emoji) to a comment
   * @param {number} commentId - Comment ID
   * @param {string} emoji - Emoji reaction (e.g., '👍', '❤️', '😋')
   * @returns {Promise} Updated comment
   */
  static async addReaction(commentId, emoji) {
    try {
      const response = await YesChefAPI.post(`/api/v2/whiteboard/cm/${commentId}/rx`, {
        emoji: emoji,
      });
      return {
        success: true,
        comment: response.comment,
      };
    } catch (error) {
      console.error('Failed to add reaction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a comment
   * @param {number} commentId - Comment ID
   * @returns {Promise} Success status
   */
  static async deleteComment(commentId) {
    try {
      await YesChefAPI.delete(`/api/v2/whiteboard/cm/${commentId}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to delete comment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ===================================
  // TAGS
  // ===================================

  /**
   * Update tags for a whiteboard object
   * @param {number} objectId - Whiteboard object ID
   * @param {Array} tags - Array of tag strings
   * @returns {Promise} Updated object
   */
  static async updateTags(objectId, tags) {
    try {
      const response = await YesChefAPI.patch(`/api/v2/whiteboard/o/${objectId}`, {
        tags: tags,
      });
      return {
        success: true,
        object: response.object,
      };
    } catch (error) {
      console.error('Failed to update tags:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ===================================
  // PRESENCE
  // ===================================

  /**
   * Update user presence on a whiteboard
   * @param {number} whiteboardId - Whiteboard ID
   * @param {string} status - Activity status (e.g., 'viewing', 'editing')
   * @param {number} objectId - Current object being viewed (optional)
   * @returns {Promise} Success status
   */
  static async updatePresence(whiteboardId, status = 'viewing', objectId = null) {
    try {
      const payload = {
        ast: status,
      };
      
      if (objectId) {
        payload.coid = objectId;
      }
      
      const response = await YesChefAPI.post(`/api/v2/whiteboard/${whiteboardId}/pr`, payload);
      return {
        success: true,
        collaborators: response.collaborators || [],
      };
    } catch (error) {
      console.error('Failed to update presence:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get active collaborators on a whiteboard
   * @param {number} whiteboardId - Whiteboard ID
   * @returns {Promise} Array of active users
   */
  static async getCollaborators(whiteboardId) {
    try {
      const response = await YesChefAPI.get(`/api/v2/whiteboard/${whiteboardId}/co`);
      return {
        success: true,
        collaborators: response.collaborators || [],
      };
    } catch (error) {
      console.error('Failed to fetch collaborators:', error);
      return {
        success: false,
        error: error.message,
        collaborators: [],
      };
    }
  }

  // ===================================
  // WHITEBOARD CRUD (for future mobile enhancements)
  // ===================================

  /**
   * Get all whiteboards for a household
   * @param {number} householdId - Household ID
   * @returns {Promise} Array of whiteboards
   */
  static async getHouseholdWhiteboards(householdId) {
    try {
      const response = await YesChefAPI.get(`/api/v2/whiteboard/h/${householdId}`);
      return {
        success: true,
        whiteboards: response.whiteboards || [],
      };
    } catch (error) {
      console.error('Failed to fetch household whiteboards:', error);
      return {
        success: false,
        error: error.message,
        whiteboards: [],
      };
    }
  }

  /**
   * Get whiteboard details with all objects
   * @param {number} whiteboardId - Whiteboard ID
   * @returns {Promise} Whiteboard object
   */
  static async getWhiteboard(whiteboardId) {
    try {
      const response = await YesChefAPI.get(`/api/v2/whiteboard/${whiteboardId}`);
      return {
        success: true,
        whiteboard: response.whiteboard,
      };
    } catch (error) {
      console.error('Failed to fetch whiteboard:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

}

export default WhiteboardAPI;
