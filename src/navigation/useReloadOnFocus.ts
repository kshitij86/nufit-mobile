import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Calls `reload` when the screen comes back into focus or the app returns to the foreground, so a
 * plan the clinic publishes while the app is open shows up. Not on first focus: the resource has
 * just loaded.
 */
export function useReloadOnFocus(reload: () => void) {
  const focused = useRef(false);
  const seen = useRef(false);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      if (seen.current) reload();
      seen.current = true;
      return () => {
        focused.current = false;
      };
    }, [reload])
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && focused.current) reload();
    });
    return () => sub.remove();
  }, [reload]);
}
