import React from "react";
import { Alert, View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import ResourceState from "../components/ResourceState";
import { BackButton, Body, Card, Divider, ProgressBar } from "../components/Primitives";
import { useAuth } from "../state/Auth";
import { RootNav, RootStackParamList } from "../navigation/types";
import { ProgrammeStatus, useProgrammeStatus } from "../services/journey";
import { useMeasurements } from "../services/measurements";
import { useReminders } from "../services/reminders";
import { orderStatusLabel, OrderStatus, useOrders } from "../services/orders";
import { initialsOf } from "../services/user";
import { formatBirthDate, formatCalendarDay, formatDay, formatInr, formatPhone } from "../utils/format";

const statusInk: Record<OrderStatus, string> = {
  created: colors.muted,
  payment_pending: colors.amberInk,
  paid: colors.sageInk,
  payment_failed: colors.coralInk,
  cancelled: colors.muted,
  refunded: colors.muted,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: colors.muted, marginBottom: 10 }}>
      {children}
    </Text>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 10 }}>
      <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 14, color: colors.muted }}>{label}</Text>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: colors.ink, flexShrink: 1, textAlign: "right" }}>{value}</Text>
    </View>
  );
}

function Orders() {
  const orders = useOrders();
  if (!orders.data) return <ResourceState resource={orders} />;
  if (orders.data.length === 0) {
    return <Body size={14}>No orders yet. Your programme payments will appear here.</Body>;
  }
  return (
    <>
      {orders.data.map((order, i) => (
        <View key={order.id}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink }}>{order.planName}</Text>
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {formatDay(order.paidAt ?? order.placedAt)} · {formatInr(order.amountPaise / 100)}
              </Text>
            </View>
            <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: statusInk[order.status] }}>
              {orderStatusLabel[order.status]}
            </Text>
          </View>
          {i < orders.data!.length - 1 && <Divider />}
        </View>
      ))}
      {orders.error && <Body color={colors.coralInk} size={13}>{orders.error}</Body>}
    </>
  );
}

function programmeHeadline(status: ProgrammeStatus): string {
  switch (status.status) {
    case "awaiting_plan":
      return "Your plan is being prepared";
    case "scheduled":
      return status.startDate ? `Starts ${formatCalendarDay(status.startDate)}` : "Starting soon";
    case "completed":
      return "Programme complete";
    default:
      return status.nextReview ? `Next review ${status.nextReview}` : "On track";
  }
}

export default function Profile() {
  const navigation = useNavigation<RootNav>();
  const { user, userError, reloadUser, signOut } = useAuth();
  const status = useProgrammeStatus().data;
  const measurements = useMeasurements();
  const reminders = useReminders().data;
  const confirmLogOut = () =>
    Alert.alert("Log out?", "You'll need to log in again to use 360° Fitness on this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void signOut() },
    ]);

  const measurementCount = measurements.data?.length;
  const links: { label: string; meta: string; screen: keyof RootStackParamList }[] = [
    { label: "Intake answers", meta: "14 of 14", screen: "Intake" },
    {
      label: "Measurements",
      meta: measurementCount === undefined ? "" : measurementCount === 0 ? "None yet" : `${measurementCount} logged`,
      screen: "Measure",
    },
    { label: "Consent & documents", meta: "Signed", screen: "Consent" },
    { label: "Nudges", meta: reminders ? `${reminders.filter((r) => r.enabled).length} on` : "", screen: "Reminders" },
    { label: "Your circle", meta: "8 members", screen: "Circle" },
  ];

  return (
    <ScreenScaffold header={<BackButton />}>
      <View style={{ alignItems: "center", marginTop: 6, marginBottom: 20 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Text style={{ color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 22 }}>{user ? initialsOf(user.fullName) : ""}</Text>
        </View>
        {user ? (
          <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 20, color: colors.ink }}>{user.fullName}</Text>
        ) : userError ? (
          <Body color={colors.coralInk} size={14} style={{ textAlign: "center" }}>
            {userError}{" "}
            <Text onPress={reloadUser} style={{ fontFamily: "Nunito_700Bold", color: colors.orange }}>Try again</Text>
          </Body>
        ) : (
          <Body color={colors.muted} size={14}>Loading your details…</Body>
        )}
        {status?.programmeName && (
          <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted, marginTop: 2 }}>
            {status.programmeName}
            {status.status === "active" ? ` · day ${status.day}` : ""}
          </Text>
        )}
      </View>

      {status && status.status !== "none" && (
        <Card bg={colors.amberTint} style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 12, color: colors.amberInk, marginBottom: 10 }}>
            Programme
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {status.status === "awaiting_plan" && <Ionicons name="hourglass-outline" size={17} color={colors.amberInk} />}
            <Text style={{ flex: 1, fontFamily: "Outfit_700Bold", fontSize: 15, color: colors.ink }}>{programmeHeadline(status)}</Text>
          </View>
          {(status.status === "active" || status.status === "completed") && status.totalDays > 0 && (
            <>
              <ProgressBar progress={status.day / status.totalDays} color={colors.amberStrong} track="#FFFFFF" />
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.amberInk, marginTop: 8 }}>
                Day {status.day} of {status.totalDays}
              </Text>
            </>
          )}
        </Card>
      )}

      {user && (
        <>
          <SectionLabel>Your details</SectionLabel>
          <Card style={{ marginBottom: 20, paddingVertical: 6 }}>
            <DetailRow label="Email" value={user.email} />
            <Divider />
            <DetailRow label="Phone" value={formatPhone(user.phoneNumber)} />
            <Divider />
            <DetailRow label="Date of birth" value={formatBirthDate(user.dateOfBirth)} />
            {user.createdAt ? (
              <>
                <Divider />
                <DetailRow label="Member since" value={formatDay(user.createdAt)} />
              </>
            ) : null}
          </Card>
        </>
      )}

      <SectionLabel>Orders</SectionLabel>
      <Card style={{ marginBottom: 20, paddingVertical: 10 }}>
        <Orders />
      </Card>

      <View style={{ gap: 4 }}>
        {links.map((link) => (
          <Pressable
            key={link.label}
            onPress={() => navigation.navigate(link.screen as never)}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.hairline }}
          >
            <Body color={colors.ink} size={15} style={{ flex: 1 }}>{link.label}</Body>
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.muted, marginRight: 8 }}>
              {link.meta}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.faint} />
          </Pressable>
        ))}
        <Pressable
          onPress={confirmLogOut}
          accessibilityRole="button"
          style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 18 }}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.orange} />
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, color: colors.orange }}>Log out</Text>
        </Pressable>
      </View>
    </ScreenScaffold>
  );
}
