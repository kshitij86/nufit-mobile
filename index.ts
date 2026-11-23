import { registerRootComponent } from 'expo';

import App from './App';
import { pushSupported } from './src/services/pushSupport';

// Before the app registers: Android may start it headless to deliver a push. Required lazily,
// since importing Firebase at all crashes Expo Go.
if (pushSupported) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./src/services/push').handleBackgroundPushes();
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
