import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { Resource } from "../services/resource";
import { Body } from "./Primitives";

/** Shown in place of a resource's content until it has data: a spinner, or the error with a retry. */
export default function ResourceState({ resource, minHeight = 80 }: { resource: Resource<unknown>; minHeight?: number }) {
  return (
    <View style={{ minHeight, alignItems: "center", justifyContent: "center", paddingVertical: 12 }}>
      {resource.error ? (
        <Body color={colors.coralInk} size={14} style={{ textAlign: "center" }}>
          {resource.error}{" "}
          <Text
            onPress={resource.reload}
            accessibilityRole="button"
            style={{ fontFamily: "Nunito_700Bold", color: colors.orange }}
          >
            Try again
          </Text>
        </Body>
      ) : (
        <ActivityIndicator color={colors.orange} />
      )}
    </View>
  );
}
