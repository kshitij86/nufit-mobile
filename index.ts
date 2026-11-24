import { registerRootComponent } from 'expo';

import App from './App';
import { handleBackgroundPushes } from './src/services/push';

// Before the app registers: Android may start it headless to deliver a push.
handleBackgroundPushes();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
