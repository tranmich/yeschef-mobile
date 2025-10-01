/**
 * 🔍 Recipe Debug Helper
 * Helps diagnose differences between development and production builds
 */

import YesChefAPI from '../services/YesChefAPI';

export class RecipeDebugger {
  
  static async diagnoseRecipeIssues() {
    const report = {
      timestamp: new Date().toISOString(),
      buildType: __DEV__ ? 'Development (Expo Go)' : 'Production (AAB)',
      issues: [],
      recommendations: []
    };

    try {
      // Test 1: API Connection
      console.log('🔍 Testing API connection...');
      const connectionTest = await YesChefAPI.testConnection();
      report.apiConnection = connectionTest ? 'Success' : 'Failed';
      
      if (!connectionTest) {
        report.issues.push('API connection failed');
        report.recommendations.push('Check internet connection and API URL');
      }

      // Test 2: Authentication Status
      console.log('🔍 Checking authentication...');
      const isAuthenticated = await YesChefAPI.isAuthenticated();
      report.authenticated = isAuthenticated;
      
      if (!isAuthenticated) {
        report.issues.push('User not authenticated');
        report.recommendations.push('Try logging in again');
      }

      // Test 3: Recipe Data
      console.log('🔍 Testing recipe data fetch...');
      try {
        const recipes = await YesChefAPI.getAllRecipes();
        report.recipeCount = recipes ? recipes.length : 0;
        report.hasRecipes = recipes && recipes.length > 0;
        
        if (!recipes || recipes.length === 0) {
          report.issues.push('No recipes returned from API');
          report.recommendations.push('Check if recipes exist in database');
        }
      } catch (error) {
        report.issues.push(`Recipe fetch error: ${error.message}`);
        report.recommendations.push('Check API endpoints and database');
      }

      // Test 4: Community Recipes
      console.log('🔍 Testing community recipes...');
      try {
        const communityRecipes = await YesChefAPI.getCommunityRecipes();
        report.communityRecipeCount = communityRecipes ? communityRecipes.length : 0;
        report.hasCommunityRecipes = communityRecipes && communityRecipes.length > 0;
        
        if (!communityRecipes || communityRecipes.length === 0) {
          report.issues.push('No community recipes returned');
          report.recommendations.push('Check community recipes in database');
        }
      } catch (error) {
        report.issues.push(`Community recipe fetch error: ${error.message}`);
      }

      // Test 5: User Profile
      console.log('🔍 Testing user profile...');
      try {
        const profile = await YesChefAPI.getUserProfile();
        report.hasProfile = !!profile;
        report.userId = profile?.id || 'Unknown';
        
        if (!profile) {
          report.issues.push('No user profile found');
          report.recommendations.push('Check user authentication and profile data');
        }
      } catch (error) {
        report.issues.push(`Profile fetch error: ${error.message}`);
      }

    } catch (error) {
      report.issues.push(`Diagnostic error: ${error.message}`);
    }

    return report;
  }

  static async showDiagnosticAlert() {
    const report = await this.diagnoseRecipeIssues();
    
    const summary = [
      `Build Type: ${report.buildType}`,
      `API Connected: ${report.apiConnection || 'Unknown'}`,
      `Authenticated: ${report.authenticated ? 'Yes' : 'No'}`,
      `Recipes: ${report.recipeCount || 0}`,
      `Community Recipes: ${report.communityRecipeCount || 0}`,
      `Issues: ${report.issues.length}`,
    ].join('\n');

    console.log('🔍 Recipe Diagnostic Report:', report);
    
    if (report.issues.length > 0) {
      console.warn('⚠️ Issues found:', report.issues);
      console.log('💡 Recommendations:', report.recommendations);
    }

    return report;
  }

  // Helper to compare builds
  static getExpectedBehavior() {
    return {
      development: {
        onAPIFailure: 'Shows mock recipes as fallback',
        authRequired: 'Less strict, may work without login',
        dataSource: 'API + Mock fallback'
      },
      production: {
        onAPIFailure: 'Shows empty screen or error',
        authRequired: 'Strict authentication required',
        dataSource: 'API only'
      }
    };
  }
}

export default RecipeDebugger;