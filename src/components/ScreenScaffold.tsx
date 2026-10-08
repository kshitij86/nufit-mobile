import React, { useEffect, useImperativeHandle, useRef } from "react";
import {
  View,
  ScrollView,
  ViewStyle,
  Keyboard,
  KeyboardAvoidingView,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import ScreenFade from "./ScreenFade";

// Space kept between the focused field and the keyboard (or the footer above it).
const KEYBOARD_GAP = 24;

// Scrolls whichever input is focused into view while the keyboard is up: when the keyboard
// opens, and again whenever focus moves to another field (e.g. "next" from password to confirm).
function useKeepFocusedInputVisible(
  scrollRef: React.RefObject<ScrollView | null>,
  contentRef: React.RefObject<View | null>,
  enabled: boolean
) {
  const offset = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let keyboardTop: number | null = null;
    let lastInput: unknown = null;
    let poll: ReturnType<typeof setInterval> | undefined;
    let settle: ReturnType<typeof setTimeout> | undefined;

    const reveal = () => {
      const scroll = scrollRef.current;
      const input = TextInput.State.currentlyFocusedInput();
      const content = contentRef.current;
      const native = scroll?.getNativeScrollRef();
      if (!scroll || !input || !content || !native || keyboardTop === null) return;
      const top = keyboardTop;
      native.measureInWindow((_x, scrollY, _w, scrollHeight) => {
        // Fails (and is ignored) when the input belongs to another screen's scroll view.
        input.measureLayout(
          content,
          (_ix, inputY, _iw, inputHeight) => {
            const visible = Math.min(scrollHeight, top - scrollY);
            if (visible <= 0) return;
            const from = offset.current;
            if (inputY + inputHeight + KEYBOARD_GAP > from + visible) {
              scroll.scrollTo({ y: inputY + inputHeight + KEYBOARD_GAP - visible, animated: true });
            } else if (inputY - KEYBOARD_GAP < from) {
              scroll.scrollTo({ y: Math.max(0, inputY - KEYBOARD_GAP), animated: true });
            }
          },
          () => {}
        );
      });
    };

    const shown = Keyboard.addListener("keyboardDidShow", (e) => {
      keyboardTop = e.endCoordinates.screenY;
      lastInput = TextInput.State.currentlyFocusedInput();
      // Let the KeyboardAvoidingView finish resizing before measuring.
      clearTimeout(settle);
      settle = setTimeout(reveal, 60);
      clearInterval(poll);
      poll = setInterval(() => {
        const focused = TextInput.State.currentlyFocusedInput();
        if (focused && focused !== lastInput) {
          lastInput = focused;
          reveal();
        }
      }, 200);
    });
    const hidden = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTop = null;
      clearInterval(poll);
    });

    return () => {
      shown.remove();
      hidden.remove();
      clearInterval(poll);
      clearTimeout(settle);
    };
  }, [scrollRef, contentRef, enabled]);

  return (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
  };
}

export default function ScreenScaffold({
  children,
  header,
  footer,
  scroll = true,
  bg = colors.cream,
  edges = ["top", "bottom"],
  contentStyle,
  scrollRef,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  bg?: string;
  edges?: ("top" | "bottom" | "left" | "right")[];
  contentStyle?: ViewStyle;
  scrollRef?: React.Ref<ScrollView | null>;
}) {
  const innerScrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  useImperativeHandle(scrollRef, () => innerScrollRef.current as ScrollView, []);
  const onScroll = useKeepFocusedInputVisible(innerScrollRef, contentRef, scroll);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>
      {/* Every screen avoids the keyboard here, so screens don't need their own KeyboardAvoidingView.
          "padding" on Android too: with edge-to-edge (always on from SDK 54) the window no longer resizes
          for the keyboard, and the padding only covers what the keyboard overlaps, so it never doubles up. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScreenFade>
          {header && <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>{header}</View>}
          {scroll ? (
            <ScrollView
              ref={innerScrollRef}
              innerViewRef={contentRef as React.RefObject<View>}
              style={{ flex: 1 }}
              contentContainerStyle={[
                { paddingHorizontal: 20, paddingBottom: footer ? 8 : 24, paddingTop: header ? 8 : 16 },
                contentStyle,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScroll={onScroll}
              scrollEventThrottle={16}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[{ flex: 1, paddingHorizontal: 20 }, contentStyle]}>{children}</View>
          )}
          {footer && (
            <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, gap: 10 }}>{footer}</View>
          )}
        </ScreenFade>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
