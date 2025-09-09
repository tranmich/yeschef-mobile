import { registerRootComponent } from 'expo';

// � PRODUCTION: Use full app with all features
import App from './App';
// import MinimalApp from './MinimalApp'; // Keep for debugging

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
