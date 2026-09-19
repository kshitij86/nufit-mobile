import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../theme/colors";
import ScreenScaffold from "../components/ScreenScaffold";
import PillButton, { TextButton } from "../components/PillButton";
import { BackButton, Body, Card, Heading, ProgressBar } from "../components/Primitives";
import { intakeSteps } from "../data/intake";
import { useAppState } from "../state/AppState";
import { RootNav } from "../navigation/types";
import { bmiLabel, computeBmi } from "../utils/format";

function FieldInput({ value, onChangeText, placeholder, keyboardType }: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.faint}
      keyboardType={keyboardType}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.hairline,
        paddingVertical: 16,
        paddingHorizontal: 16,
        fontFamily: "Nunito_700Bold",
        fontSize: 16,
        color: colors.ink,
      }}
    />
  );
}

function ChipsField({ opts, value, onToggle }: { opts: string[]; value: string[]; onToggle: (o: string) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {opts.map((opt) => {
        const selected = value.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => onToggle(opt)}
            style={{
              paddingVertical: 15,
              paddingHorizontal: 16,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: selected ? colors.orange : colors.hairline,
              backgroundColor: selected ? colors.orangeTint : colors.card,
            }}
          >
            <Text style={{ fontFamily: selected ? "Nunito_700Bold" : "Nunito_600SemiBold", color: colors.ink, fontSize: 15 }}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Intake() {
  const navigation = useNavigation<RootNav>();
  const { data, setIntakeField, toast } = useAppState();
  const [index, setIndex] = useState(0);
  const step = intakeSteps[index];
  const intake = data.intake;

  const heightNum = parseFloat(intake.heightCm);
  const weightNum = parseFloat(intake.weightKg);
  const bmi = useMemo(() => {
    if (!heightNum || !weightNum) return null;
    return computeBmi(heightNum, weightNum);
  }, [heightNum, weightNum]);

  const goNext = () => {
    if (index === intakeSteps.length - 1) {
      toast.show("Intake sent to Dr. Kanika");
      navigation.navigate("Gender");
    } else {
      setIndex(index + 1);
    }
  };

  const goBack = () => {
    if (index === 0) navigation.goBack();
    else setIndex(index - 1);
  };

  const setMeal = (rowIdx: number, key: "time" | "item", val: string) => {
    const meals = [...intake.meals];
    meals[rowIdx] = { ...meals[rowIdx], [key]: val };
    setIntakeField("meals", meals);
  };

  const toggleLimit = (opt: string) => {
    const has = intake.limits.includes(opt);
    setIntakeField("limits", has ? intake.limits.filter((l) => l !== opt) : [...intake.limits, opt]);
  };

  return (
    <ScreenScaffold
      header={
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <BackButton onPress={goBack} />
            <TextButton label="Save & exit" onPress={() => navigation.navigate("Mood")} />
          </View>
          <ProgressBar progress={(index + 1) / intakeSteps.length} />
        </View>
      }
      footer={
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PillButton label="Skip" variant="secondary" glow={false} onPress={goNext} />
          </View>
          <View style={{ flex: 1.4 }}>
            <PillButton
              label={index === intakeSteps.length - 1 ? "Finish intake" : "Continue"}
              onPress={goNext}
            />
          </View>
        </View>
      }
    >
      <Text style={{ fontFamily: "Nunito_800ExtraBold", color: colors.orange, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
        {step.section}
      </Text>
      <Heading size={22}>{step.heading}</Heading>
      {!!step.help && <Body style={{ marginTop: 8, marginBottom: 18 }}>{step.help}</Body>}
      {!step.help && <View style={{ height: 18 }} />}

      {step.type === "text" && (
        <FieldInput
          value={(intake as any)[step.field!]}
          onChangeText={(t) => setIntakeField(step.field as any, t as any)}
          placeholder={step.placeholder ?? ""}
          keyboardType={step.field === "age" ? "numeric" : "default"}
        />
      )}

      {step.type === "textarea" && (
        <TextInput
          value={(intake as any)[step.field!]}
          onChangeText={(t) => setIntakeField(step.field as any, t as any)}
          placeholder={step.placeholder ?? ""}
          placeholderTextColor={colors.faint}
          multiline
          numberOfLines={5}
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: colors.hairline,
            paddingVertical: 16,
            paddingHorizontal: 16,
            fontFamily: "Nunito_600SemiBold",
            fontSize: 15,
            color: colors.ink,
            minHeight: 120,
            textAlignVertical: "top",
          }}
        />
      )}

      {step.type === "chips" && (
        <ChipsField
          opts={step.opts ?? []}
          value={step.multi ? intake.limits : intake[step.field as "life"] ? [intake[step.field as "life"]] : []}
          onToggle={(opt) => {
            if (step.multi) toggleLimit(opt);
            else setIntakeField(step.field as any, opt as any);
          }}
        />
      )}

      {step.type === "heightWeight" && (
        <View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Card style={{ flex: 1 }}>
              <Body size={12} color={colors.muted} style={{ marginBottom: 8 }}>Height (cm)</Body>
              <TextInput
                value={intake.heightCm}
                onChangeText={(t) => setIntakeField("heightCm", t)}
                placeholder="162"
                keyboardType="numeric"
                placeholderTextColor={colors.faint}
                style={{ fontFamily: "Outfit_700Bold", fontSize: 28, color: colors.ink }}
              />
            </Card>
            <Card style={{ flex: 1 }}>
              <Body size={12} color={colors.muted} style={{ marginBottom: 8 }}>Weight (kg)</Body>
              <TextInput
                value={intake.weightKg}
                onChangeText={(t) => setIntakeField("weightKg", t)}
                placeholder="68"
                keyboardType="numeric"
                placeholderTextColor={colors.faint}
                style={{ fontFamily: "Outfit_700Bold", fontSize: 28, color: colors.ink }}
              />
            </Card>
          </View>
          <View
            style={{
              marginTop: 14,
              backgroundColor: colors.orangeTint,
              borderRadius: 16,
              padding: 16,
            }}
          >
            {bmi ? (
              <>
                <Text style={{ fontFamily: "Outfit_700Bold", fontSize: 24, color: colors.orangeDark }}>
                  BMI {bmi.toFixed(1)}
                </Text>
                <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: colors.orangeDark, marginTop: 4 }}>
                  {bmiLabel(bmi)}
                </Text>
              </>
            ) : (
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.orangeDark }}>
                BMI appears once both are filled
              </Text>
            )}
          </View>
        </View>
      )}

      {step.type === "mealTable" && (
        <View style={{ gap: 12 }}>
          {step.rows!.map((row, i) => (
            <Card key={row}>
              <Body size={13} color={colors.ink} style={{ fontFamily: "Nunito_800ExtraBold", marginBottom: 10 } as any}>
                {row}
              </Body>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  value={intake.meals[i]?.time ?? ""}
                  onChangeText={(t) => setMeal(i, "time", t)}
                  placeholder="Time"
                  placeholderTextColor={colors.faint}
                  style={{
                    flex: 0.4,
                    backgroundColor: colors.cream,
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    fontFamily: "Nunito_600SemiBold",
                    color: colors.ink,
                  }}
                />
                <TextInput
                  value={intake.meals[i]?.item ?? ""}
                  onChangeText={(t) => setMeal(i, "item", t)}
                  placeholder="What you usually eat"
                  placeholderTextColor={colors.faint}
                  style={{
                    flex: 1,
                    backgroundColor: colors.cream,
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    fontFamily: "Nunito_600SemiBold",
                    color: colors.ink,
                  }}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      {step.type === "yesNoRows" && (
        <View style={{ gap: 10 }}>
          {step.rows!.map((row) => {
            const val = intake.family[row];
            return (
              <View
                key={row}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <Body color={colors.ink} size={15}>{row}</Body>
                <View style={{ flexDirection: "row", backgroundColor: colors.cream, borderRadius: 999, padding: 3 }}>
                  {["Yes", "No"].map((label) => {
                    const active = label === "Yes" ? val === true : val === false;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => setIntakeField("family", { ...intake.family, [row]: label === "Yes" })}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 999,
                          backgroundColor: active ? colors.orange : "transparent",
                        }}
                      >
                        <Text style={{ color: active ? "#fff" : colors.secondary, fontFamily: "Nunito_700Bold", fontSize: 12 }}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {step.type === "twoField" && (
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Card style={{ flex: 1 }}>
            <Body size={12} color={colors.muted} style={{ marginBottom: 8 }}>Sleep time</Body>
            <TextInput
              value={intake.sleepTime}
              onChangeText={(t) => setIntakeField("sleepTime", t)}
              placeholder={step.placeholders?.[0]}
              placeholderTextColor={colors.faint}
              style={{ fontFamily: "Outfit_700Bold", fontSize: 18, color: colors.ink }}
            />
          </Card>
          <Card style={{ flex: 1 }}>
            <Body size={12} color={colors.muted} style={{ marginBottom: 8 }}>Wake time</Body>
            <TextInput
              value={intake.wakeTime}
              onChangeText={(t) => setIntakeField("wakeTime", t)}
              placeholder={step.placeholders?.[1]}
              placeholderTextColor={colors.faint}
              style={{ fontFamily: "Outfit_700Bold", fontSize: 18, color: colors.ink }}
            />
          </Card>
        </View>
      )}
    </ScreenScaffold>
  );
}
