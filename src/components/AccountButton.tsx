import React from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import { useAuth } from "../state/Auth";
import { initialsOf } from "../services/user";
import { RootNav } from "../navigation/types";
import { BackButton } from "./Primitives";

/** The signed-in member's initials; opens Profile, where they can see their details and log out. */
export default function AccountButton() {
  const navigation = useNavigation<RootNav>();
  const { user } = useAuth();

  return (
    <Pressable
      onPress={() => navigation.navigate("Profile")}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Your account"
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.ink,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 13 }}>{user ? initialsOf(user.fullName) : ""}</Text>
    </Pressable>
  );
}

/** Header for the pre-purchase screens: optional back button on the left, account on the right. */
export function AccountHeader({ back = true, onBack }: { back?: boolean; onBack?: () => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      {back ? <BackButton onPress={onBack} /> : <View />}
      <AccountButton />
    </View>
  );
}
