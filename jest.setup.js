jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const ReactNative = require('react-native');

  const gestureMock = {
    activeOffsetX: () => gestureMock,
    enabled: () => gestureMock,
    onChange: () => gestureMock,
    onEnd: () => gestureMock,
    onFinalize: () => gestureMock,
    onStart: () => gestureMock,
    runOnJS: () => gestureMock,
    simultaneousWithExternalGesture: () => gestureMock,
  };

  return {
    Gesture: {
      Native: () => gestureMock,
      Pan: () => gestureMock,
      Tap: () => gestureMock,
    },
    GestureDetector: ({ children }) => children,
    GestureHandlerRootView: ({ children, style }) => (
      React.createElement(ReactNative.View, { style }, children)
    ),
  };
});

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = require('react');

  return ({ children }) => React.createElement(React.Fragment, null, children);
});

require('@testing-library/react-native');
