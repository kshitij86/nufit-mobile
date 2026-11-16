import { API_HOST } from "../../config";
import { fetchTodayPlan } from "../diet";
import { fetchProgrammeStatus } from "../journey";
import { logIn, logOut } from "../session";
import { getSession, listWeekSessions } from "../workouts";
import { FetchMock, jsonResponse, mockFetch, requestOf, tokens } from "../../test/fetchMock";

jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
  };
});

const ME = `${API_HOST}/api/v1/users/me`;
let fetchMock: FetchMock;

beforeEach(async () => {
  await logOut();
  fetchMock = mockFetch();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, tokens("1")));
  await logIn("vikram@example.com", "secret");
  fetchMock.mockReset();
});

describe("fetchProgrammeStatus", () => {
  test("maps an active programme", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        status: "active",
        programme: { id: "reset360", name: "Reset 360" },
        start_date: "2026-10-12",
        day: 3,
        total_days: 84,
        next_review_on: "2026-10-30",
        coach: { name: "Dr. Kanika" },
      })
    );

    const status = await fetchProgrammeStatus(new Date(2026, 9, 14));

    expect(requestOf(fetchMock, 0)).toMatchObject({ url: `${ME}/programme`, method: "GET", authorization: "Bearer access-1" });
    expect(status).toEqual({
      status: "active",
      programmeName: "Reset 360",
      startDate: "2026-10-12",
      day: 3,
      totalDays: 84,
      weekday: "Wednesday",
      nextReview: "30 Oct",
      coach: "Dr. Kanika",
    });
  });

  test("maps a member who is still waiting for a plan", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        status: "awaiting_plan",
        programme: { id: "reset360", name: "Reset 360" },
        start_date: null,
        day: 0,
        total_days: 84,
        next_review_on: null,
        coach: null,
      })
    );

    const status = await fetchProgrammeStatus();

    expect(status).toMatchObject({ status: "awaiting_plan", day: 0, nextReview: null, coach: null });
  });

  test("rejects an unknown status", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { status: "paused" }));
    await expect(fetchProgrammeStatus()).rejects.toThrow("Couldn't load your programme");
  });
});

describe("fetchTodayPlan", () => {
  test("maps meals and the linked workout session", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        date: "2026-10-14",
        reason: null,
        items: [
          { id: "s1", band: "Morning", time: "6:00 am", title: "Early morning", subtitle: "Warm lemon water (150 ml)", note: "", kind: "meal", session_id: null },
          { id: "s2", band: "Morning", time: "6:15 am", title: "Upper & lower body", subtitle: "28 min · Band", note: "", kind: "session", session_id: "2026-10-14" },
          { id: "s3", band: "Night", time: "8:00 pm", title: "Dinner", subtitle: "Moong chilla (2)", note: "Before 8:30 pm", kind: "meal", session_id: null },
          { id: "bad", band: "Brunch", time: "", title: "", subtitle: "", kind: "meal" },
        ],
        note: null,
        guidance: { notes: ["Walk after dinner"], water_litres: 2.5, avoid: ["Sugar"], supplements: [{ name: "", dose: "", when: "" }] },
      })
    );

    const plan = await fetchTodayPlan();

    expect(requestOf(fetchMock, 0).url).toBe(`${ME}/plan/today`);
    expect(plan.items.map((i) => i.id)).toEqual(["s1", "s2", "s3"]);
    expect(plan.items[1]).toMatchObject({ isSession: true, sessionId: "2026-10-14" });
    expect(plan.items[0]).toMatchObject({ isSession: false, sessionId: undefined, note: undefined });
    expect(plan.items[2].note).toBe("Before 8:30 pm");
    expect(plan.reason).toBeNull();
    expect(plan.guidance).toEqual({ notes: ["Walk after dinner"], waterLitres: 2.5, avoid: ["Sugar"], supplements: [] });
  });

  test("passes on why the day is empty", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { date: "2026-10-14", reason: "awaiting_plan", items: [], note: null, guidance: null })
    );

    const plan = await fetchTodayPlan();

    expect(plan).toMatchObject({ items: [], reason: "awaiting_plan", guidance: null });
  });
});

describe("workouts", () => {
  const summary = (id: string, state: string) => ({
    id,
    name: "Upper & lower body",
    kind: "Movement",
    minutes: 28,
    kit: "Band",
    scheduled_on: id,
    state,
  });

  test("lists this week's sessions with a label for each", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { sessions: [summary("2026-10-13", "past"), summary("2026-10-14", "today"), summary("2026-10-15", "upcoming")] })
    );

    const week = await listWeekSessions();

    expect(requestOf(fetchMock, 0).url).toBe(`${ME}/workouts/week`);
    expect(week.map((s) => s.state)).toEqual(["Tue", "Today", "Thu"]);
    expect(week[1]).toMatchObject({ id: "2026-10-14", name: "Upper & lower body", minutes: 28, kit: "Band", steps: [] });
  });

  test("loads one session's timed steps", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        ...summary("2026-10-14", "today"),
        steps: [
          { name: "Squat", cue: "Round 1 of 3 · 20 reps", seconds: 60, exercise_code: "LB-12", video: null },
          { name: "Rest", cue: "Breathe.", seconds: 25, exercise_code: null, video: null },
        ],
      })
    );

    const session = await getSession("2026-10-14");

    expect(requestOf(fetchMock, 0).url).toBe(`${ME}/workouts/sessions/2026-10-14`);
    expect(session.steps).toEqual([
      { name: "Squat", cue: "Round 1 of 3 · 20 reps", seconds: 60 },
      { name: "Rest", cue: "Breathe.", seconds: 25 },
    ]);
  });

  test("shows the server's message when a session doesn't exist", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { detail: "There's no workout in your plan for that day." }));
    await expect(getSession("2026-10-18")).rejects.toThrow("There's no workout in your plan for that day.");
  });
});
