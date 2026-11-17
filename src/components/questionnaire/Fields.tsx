import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { Body, Card } from "../Primitives";
import { Ctx, Field, Option, fieldLabel, getPath } from "../../data/questionnaire";
import { MEAL_SLOTS, MealEntry, Photo, PhotoView, uploadPhoto } from "../../services/questionnaire";
import { userMessage } from "../../services/http";
import { bmiLabel, computeBmi } from "../../utils/format";
import { decimalInput, wholeNumberInput } from "../../utils/numericInput";

/* One renderer per field type. Every field reads from and writes to the answers by dotted path. */

const inputStyle = {
  backgroundColor: colors.card,
  borderRadius: 16,
  borderWidth: 1.5,
  borderColor: colors.hairline,
  paddingVertical: 14,
  paddingHorizontal: 16,
  fontFamily: "Nunito_700Bold",
  fontSize: 15,
  color: colors.ink,
} as const;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 13, color: colors.secondary, marginBottom: 8 }}>{children}</Text>
  );
}

export function FieldView({
  field,
  ctx,
  set,
  photos,
}: {
  field: Field;
  ctx: Ctx;
  set: (path: string, value: unknown) => void;
  photos: Photo[];
}) {
  const label = fieldLabel(field, ctx);
  const value = getPath(ctx.a, field.field);

  let body: React.ReactNode = null;
  switch (field.type) {
    case "choice":
      body = (
        <ChoiceField
          options={field.options.filter((o) => !o.when || o.when(ctx))}
          columns={field.columns ?? 1}
          multi={!!field.multi}
          value={field.multi ? ((value as string[]) ?? []) : value == null || value === "" ? [] : [String(value)]}
          onChange={(ids) => {
            if (field.multi) {
              // An exclusive option ("None") clears the rest, and picking anything clears it.
              const added = ids.find((id) => !((value as string[]) ?? []).includes(id));
              const next = field.exclusive
                ? added === field.exclusive
                  ? [field.exclusive]
                  : ids.filter((id) => id !== field.exclusive)
                : ids;
              set(field.field, next);
            } else {
              const id = ids[0] ?? null;
              set(field.field, id != null && field.numeric ? Number(id) : id);
            }
          }}
        />
      );
      break;
    case "text":
      body = (
        <View>
          <TextInput
            value={(value as string) ?? ""}
            onChangeText={(t) => set(field.field, t)}
            placeholder={field.placeholder}
            placeholderTextColor={colors.faint}
            multiline={field.multiline}
            style={[inputStyle, field.multiline ? { minHeight: 96, textAlignVertical: "top" } : null]}
          />
          {field.quick && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              {field.quick.map((q) => {
                const on = value === q;
                return (
                  <Pressable
                    key={q}
                    onPress={() => set(field.field, on ? "" : q)}
                    style={{
                      paddingVertical: 7,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      backgroundColor: on ? colors.rose : colors.blushTint,
                    }}
                  >
                    <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: on ? colors.roseInk : colors.roseText }}>{q}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      );
      break;
    case "number":
      body = (
        <NumberInput
          value={value == null ? "" : String(value)}
          unit={field.unit}
          placeholder={field.placeholder}
          decimal={!field.integer}
          onChange={(t) => {
            if (field.asText) set(field.field, t);
            else set(field.field, t === "" || Number.isNaN(Number(t)) ? null : Number(t));
          }}
        />
      );
      break;
    case "yesNo":
      body = <YesNo value={value as boolean | null} onChange={(v) => set(field.field, v)} />;
      break;
    case "yesNoGrid":
      body = (
        <View style={{ gap: 8 }}>
          {field.rows.map((row) => {
            const map = (value as Record<string, boolean>) ?? {};
            return (
              <View
                key={row.id}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.card, borderRadius: 16, paddingVertical: 10, paddingLeft: 16, paddingRight: 8 }}
              >
                <Body color={colors.ink} size={15} style={{ flex: 1 }}>{row.label}</Body>
                <YesNo compact value={map[row.id] ?? null} onChange={(v) => set(field.field, { ...map, [row.id]: v })} />
              </View>
            );
          })}
        </View>
      );
      break;
    case "stepper":
      body = <Stepper value={(value as number | null) ?? null} unit={field.unit} step={field.step} min={field.min} max={field.max} onChange={(v) => set(field.field, v)} />;
      break;
    case "heightWeight":
      body = <HeightWeight ctx={ctx} set={set} />;
      break;
    case "meals":
      body = <Meals meals={ctx.a.meals} onChange={(m) => set("meals", m)} />;
      break;
    case "photos":
      body = <Photos photos={photos} />;
      break;
    case "notice":
      body = (
        <View style={{ flexDirection: "row", gap: 10, backgroundColor: field.tone === "warn" ? colors.amberTint : colors.blushTint, borderRadius: 16, padding: 14 }}>
          <Ionicons name="information-circle-outline" size={20} color={field.tone === "warn" ? colors.amberInk : colors.roseText} />
          <Body size={13} color={field.tone === "warn" ? colors.amberInk : colors.roseText} style={{ flex: 1 }}>{field.text}</Body>
        </View>
      );
      break;
  }

  return (
    <View style={{ marginBottom: 18 }}>
      {label ? <Label>{label}</Label> : null}
      {body}
    </View>
  );
}

function ChoiceField({ options, columns, multi, value, onChange }: {
  options: Option[];
  columns: number;
  multi: boolean;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <Pressable
            key={o.id}
            accessibilityRole={multi ? "checkbox" : "radio"}
            accessibilityState={{ checked: on }}
            onPress={() => onChange(multi ? (on ? value.filter((v) => v !== o.id) : [...value, o.id]) : on ? [] : [o.id])}
            style={{
              flexBasis: columns === 1 ? "100%" : columns === 2 ? "47%" : "30%",
              flexGrow: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: o.sub ? 13 : 15,
              paddingHorizontal: 14,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: on ? colors.rose : colors.hairline,
              backgroundColor: on ? colors.blushTint : colors.card,
            }}
          >
            {columns === 1 && (
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: multi ? 6 : 10,
                  borderWidth: 2,
                  borderColor: on ? colors.rose : colors.hairline,
                  backgroundColor: on ? colors.rose : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {on && <Ionicons name="checkmark" size={13} color={colors.roseInk} />}
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: on ? "Nunito_800ExtraBold" : "Nunito_700Bold", color: colors.ink, fontSize: 15, textAlign: columns === 3 ? "center" : "left" }}>
                {o.label}
              </Text>
              {o.sub && <Text style={{ fontFamily: "Nunito_600SemiBold", color: colors.muted, fontSize: 12.5, marginTop: 2 }}>{o.sub}</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function YesNo({ value, onChange, compact }: { value: boolean | null; onChange: (v: boolean) => void; compact?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: compact ? 4 : 10 }}>
      {([true, false] as const).map((v) => {
        const on = value === v;
        return (
          <Pressable
            key={String(v)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(v)}
            style={{
              flex: compact ? undefined : 1,
              paddingVertical: compact ? 8 : 16,
              paddingHorizontal: compact ? 16 : 0,
              borderRadius: compact ? 999 : 16,
              alignItems: "center",
              borderWidth: compact ? 0 : 1.5,
              borderColor: on ? colors.rose : colors.hairline,
              backgroundColor: on ? colors.rose : compact ? colors.cream : colors.card,
            }}
          >
            <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: compact ? 12 : 15, color: on ? colors.roseInk : colors.secondary }}>{v ? "Yes" : "No"}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NumberInput({ value, unit, placeholder, decimal, onChange }: {
  value: string;
  unit: string;
  placeholder?: string;
  decimal: boolean;
  onChange: (t: string) => void;
}) {
  // Keep what's typed ("72.") rather than the parsed number, so a trailing dot isn't swallowed.
  const [text, setText] = useState(value);
  return (
    <View style={[inputStyle, { flexDirection: "row", alignItems: "center", paddingVertical: 4 }]}>
      <TextInput
        value={text}
        onChangeText={(t) => {
          const clean = decimal ? decimalInput(t) : wholeNumberInput(t);
          setText(clean);
          onChange(clean);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        keyboardType={decimal ? "decimal-pad" : "number-pad"}
        style={{ flex: 1, fontFamily: "Outfit_700Bold", fontSize: 22, color: colors.ink, paddingVertical: 10 }}
      />
      <Text style={{ fontFamily: "Nunito_700Bold", color: colors.muted, fontSize: 14 }}>{unit}</Text>
    </View>
  );
}

function Stepper({ value, unit, step, min, max, onChange }: {
  value: number | null;
  unit: string;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const current = value ?? min;
  const btn = (icon: "remove" | "add", next: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === "add" ? "More" : "Less"}
      disabled={disabled}
      onPress={() => onChange(Math.round(next * 100) / 100)}
      style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: disabled ? colors.hairline : colors.rose, alignItems: "center", justifyContent: "center" }}
    >
      <Ionicons name={icon} size={24} color={disabled ? colors.faint : colors.roseInk} />
    </Pressable>
  );
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      {btn("remove", current - step, value == null || current <= min)}
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 34, color: value == null ? colors.faint : colors.ink }}>{value == null ? "–" : current}</Text>
        {!!unit && <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: colors.muted }}>{unit}</Text>}
      </View>
      {btn("add", value == null ? min + (min === 0 && step < 1 ? 1 : 0) : current + step, value != null && current >= max)}
    </Card>
  );
}

function HeightWeight({ ctx, set }: { ctx: Ctx; set: (path: string, value: unknown) => void }) {
  const { heightCm, weightKg } = ctx.a;
  const bmi = heightCm && weightKg ? computeBmi(heightCm, weightKg) : null;
  return (
    <View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Label>Height</Label>
          <NumberInput value={heightCm == null ? "" : String(heightCm)} unit="cm" placeholder="162" decimal onChange={(t) => set("heightCm", t ? Number(t) : null)} />
        </View>
        <View style={{ flex: 1 }}>
          <Label>Weight</Label>
          <NumberInput value={weightKg == null ? "" : String(weightKg)} unit="kg" placeholder="68" decimal onChange={(t) => set("weightKg", t ? Number(t) : null)} />
        </View>
      </View>
      <View style={{ marginTop: 14, backgroundColor: colors.blushTint, borderRadius: 16, padding: 16 }}>
        {bmi ? (
          <>
            <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 24, color: colors.roseText }}>BMI {bmi.toFixed(1)}</Text>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: colors.roseText, marginTop: 4 }}>{bmiLabel(bmi)}</Text>
          </>
        ) : (
          <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.roseText }}>Your BMI appears once both are filled</Text>
        )}
      </View>
    </View>
  );
}

function Meals({ meals, onChange }: { meals: MealEntry[]; onChange: (m: MealEntry[]) => void }) {
  const [open, setOpen] = useState<string | null>(() => meals.find((m) => !m.items)?.slot ?? null);
  const update = (slot: string, key: keyof MealEntry, v: string) => onChange(meals.map((m) => (m.slot === slot ? { ...m, [key]: v } : m)));
  const small = { ...inputStyle, paddingVertical: 10, fontSize: 14, borderRadius: 12, backgroundColor: colors.cream, borderWidth: 0 };

  return (
    <View style={{ gap: 10 }}>
      {MEAL_SLOTS.map((slot) => {
        const meal = meals.find((m) => m.slot === slot.id)!;
        const filled = !!meal.items.trim();
        const isOpen = open === slot.id;
        return (
          <Card key={slot.id} style={{ paddingVertical: 12 }}>
            <Pressable onPress={() => setOpen(isOpen ? null : slot.id)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name={filled ? "checkmark-circle" : "ellipse-outline"} size={20} color={filled ? colors.sageInk : colors.faint} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 15, color: colors.ink }}>{slot.label}</Text>
                {!isOpen && filled && (
                  <Text numberOfLines={1} style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12.5, color: colors.muted }}>
                    {[meal.time, meal.items, meal.quantity].filter(Boolean).join(" · ")}
                  </Text>
                )}
                {!isOpen && !filled && !!slot.hint && <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12.5, color: colors.faint }}>{slot.hint}</Text>}
              </View>
              <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
            </Pressable>
            {isOpen && (
              <View style={{ gap: 8, marginTop: 12 }}>
                <TextInput value={meal.time} onChangeText={(t) => update(slot.id, "time", t)} placeholder="Time, e.g. 8:30 am" placeholderTextColor={colors.faint} style={small} />
                <TextInput value={meal.items} onChangeText={(t) => update(slot.id, "items", t)} placeholder="What you eat or drink" placeholderTextColor={colors.faint} style={small} />
                <TextInput value={meal.quantity} onChangeText={(t) => update(slot.id, "quantity", t)} placeholder="How much, e.g. 2 rotis, 1 cup" placeholderTextColor={colors.faint} style={small} />
                <TextInput value={meal.note} onChangeText={(t) => update(slot.id, "note", t)} placeholder="Any comment (optional)" placeholderTextColor={colors.faint} style={small} />
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

function Photos({ photos }: { photos: Photo[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {(["front", "side"] as PhotoView[]).map((view) => (
        <PhotoTile key={view} view={view} photo={photos.find((p) => p.view === view)} />
      ))}
    </View>
  );
}

function PhotoTile({ view, photo }: { view: PhotoView; photo?: Photo }) {
  const [busy, setBusy] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const uri = localUri ?? photo?.url ?? null;

  const pick = async (source: "camera" | "library") => {
    const permission =
      source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", `Allow ${source === "camera" ? "camera" : "photo"} access in Settings to add your photo.`);
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7 };
    const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setBusy(true);
    try {
      await uploadPhoto(view, asset);
      setLocalUri(asset.uri);
    } catch (e) {
      Alert.alert("Upload failed", userMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const choose = () =>
    Alert.alert(`${view === "front" ? "Front" : "Side"} photo`, "Stand straight, full length, arms relaxed.", [
      { text: "Take photo", onPress: () => void pick("camera") },
      { text: "Choose from library", onPress: () => void pick("library") },
      { text: "Cancel", style: "cancel" },
    ]);

  return (
    <Pressable
      onPress={choose}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={`${uri ? "Replace" : "Add"} ${view} photo`}
      style={{ flex: 1, aspectRatio: 0.66, borderRadius: 20, overflow: "hidden", backgroundColor: colors.card, borderWidth: 1.5, borderStyle: uri ? "solid" : "dashed", borderColor: uri ? colors.rose : colors.hairline, alignItems: "center", justifyContent: "center" }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="cover" />
      ) : (
        <>
          <Ionicons name={view === "front" ? "body-outline" : "accessibility-outline"} size={44} color={colors.faint} />
          <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 14, color: colors.ink, marginTop: 10 }}>{view === "front" ? "Front" : "Side"}</Text>
          <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.muted, marginTop: 2 }}>Tap to add</Text>
        </>
      )}
      {uri && !busy && (
        <View style={{ position: "absolute", bottom: 10, backgroundColor: "rgba(0,0,0,.55)", borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 }}>
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: "#fff" }}>{view === "front" ? "Front" : "Side"} · Replace</Text>
        </View>
      )}
      {busy && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,.7)", alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.rose} />
        </View>
      )}
    </Pressable>
  );
}
