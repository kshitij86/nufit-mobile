import React from "react";
import { Text } from "react-native";

/** A module standing in for a screen in navigator tests: it renders just the screen's name. */
export function screenStub(name: string) {
  function Screen() {
    return <Text>{`screen:${name}`}</Text>;
  }
  return { __esModule: true, default: Screen };
}
