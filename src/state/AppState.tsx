import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CircleMessage, IntakeAnswers, MeasureValues, MoodId } from "../types";
import { initialCircleMessages } from "../data/circle";
import { baseSchedule } from "../data/schedule";

export interface ConsentData {
  name: string;
  address: string;
  photoConsent: "agree" | "disagree";
  faceConsent: "without" | "show";
  signature: string;
}

const emptyIntake: IntakeAnswers = {
  name: "",
  age: "",
  heightCm: "",
  weightKg: "",
  life: "",
  diet: "",
  allergy: "",
  meals: [
    { time: "", item: "" },
    { time: "", item: "" },
    { time: "", item: "" },
    { time: "", item: "" },
  ],
  med: "",
  family: {},
  cycle: "",
  dur: "",
  limits: [],
  sleepTime: "",
  wakeTime: "",
  why: "",
};

interface AppData {
  quizAnswers: Record<string, string[]>;
  programmeId: string;
  consent: ConsentData;
  paymentMethod: string;
  intake: IntakeAnswers;
  gender: "female" | "male" | null;
  measurements: MeasureValues;
  mood: MoodId | null;
  moodTags: string[];
  water: number;
  dayTasksDone: Record<string, boolean>;
  streak: number;
  sleepChecklist: Record<string, boolean>;
  circleMessages: CircleMessage[];
  profileName: string;
}

const initialData: AppData = {
  quizAnswers: {},
  programmeId: "reset360",
  consent: { name: "", address: "", photoConsent: "agree", faceConsent: "without", signature: "" },
  paymentMethod: "UPI · GPay, PhonePe",
  intake: emptyIntake,
  gender: null,
  measurements: {},
  mood: null,
  moodTags: [],
  water: 0.5,
  dayTasksDone: { "wake-water": true },
  streak: 26,
  sleepChecklist: {},
  circleMessages: initialCircleMessages,
  profileName: "Priya Sharma",
};

interface ToastApi {
  message: string | null;
  show: (msg: string) => void;
}

interface AppContextValue {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
  setQuizAnswer: (qid: string, opts: string[]) => void;
  setIntakeField: <K extends keyof IntakeAnswers>(field: K, value: IntakeAnswers[K]) => void;
  toggleDayTask: (id: string) => void;
  addWater: () => void;
  toggleSleepStep: (id: string) => void;
  postCircleMessage: (text: string) => void;
  toast: ToastApi;
  quickLogOpen: boolean;
  setQuickLogOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((patch: Partial<AppData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const setQuizAnswer = useCallback((qid: string, opts: string[]) => {
    setData((prev) => ({ ...prev, quizAnswers: { ...prev.quizAnswers, [qid]: opts } }));
  }, []);

  const setIntakeField = useCallback(
    <K extends keyof IntakeAnswers>(field: K, value: IntakeAnswers[K]) => {
      setData((prev) => ({ ...prev, intake: { ...prev.intake, [field]: value } }));
    },
    []
  );

  const toggleDayTask = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      dayTasksDone: { ...prev.dayTasksDone, [id]: !prev.dayTasksDone[id] },
    }));
  }, []);

  const addWater = useCallback(() => {
    setData((prev) => ({ ...prev, water: Math.min(4, prev.water + 0.25) }));
  }, []);

  const toggleSleepStep = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      sleepChecklist: { ...prev.sleepChecklist, [id]: !prev.sleepChecklist[id] },
    }));
  }, []);

  const postCircleMessage = useCallback((text: string) => {
    setData((prev) => ({
      ...prev,
      circleMessages: [
        ...prev.circleMessages,
        {
          id: `you-${Date.now()}`,
          name: "You",
          initials: "PS",
          tint: "#FFEEDD",
          time: "Just now",
          text,
        },
      ],
    }));
  }, []);

  const show = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2600);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      update,
      setQuizAnswer,
      setIntakeField,
      toggleDayTask,
      addWater,
      toggleSleepStep,
      postCircleMessage,
      toast: { message: toastMessage, show },
      quickLogOpen,
      setQuickLogOpen,
    }),
    [
      data,
      update,
      setQuizAnswer,
      setIntakeField,
      toggleDayTask,
      addWater,
      toggleSleepStep,
      postCircleMessage,
      toastMessage,
      show,
      quickLogOpen,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

export { baseSchedule };
