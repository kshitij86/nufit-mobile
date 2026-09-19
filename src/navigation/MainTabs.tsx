import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "./types";
import CustomTabBar from "./CustomTabBar";
import Today from "../screens/main/Today";
import Move from "../screens/main/Move";
import Kitchen from "../screens/main/Kitchen";
import Journey from "../screens/main/Journey";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Today" component={Today} />
      <Tab.Screen name="Move" component={Move} />
      <Tab.Screen name="Kitchen" component={Kitchen} />
      <Tab.Screen name="Journey" component={Journey} />
    </Tab.Navigator>
  );
}
