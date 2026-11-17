import { API_HOST } from "../../config";
import { emptyAnswers, fetchQuestionnaire, saveQuestionnaire } from "../questionnaire";
import { logIn, logOut } from "../session";
import { FetchMock, jsonResponse, mockFetch, requestOf, tokens } from "../../test/fetchMock";

jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
  };
});

const URL = `${API_HOST}/api/v1/users/me/questionnaire`;
let fetchMock: FetchMock;

beforeEach(async () => {
  await logOut();
  fetchMock = mockFetch();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, tokens("1")));
  await logIn("priya@example.com", "secret");
  fetchMock.mockReset();
});

test("loads answers in camelCase, filling gaps and every meal slot", async () => {
  fetchMock.mockResolvedValueOnce(
    jsonResponse(200, {
      answers: { height_cm: 162, family_history: { high_bp: true }, meals: [{ slot: "lunch", items: "Dal rice" }] },
      submitted_at: null,
      photos: [{ id: "p1", view: "front", url: "https://x/p1", uploaded_at: "2026-11-17T10:00:00Z" }],
    })
  );
  const state = await fetchQuestionnaire();
  expect(state.answers.heightCm).toBe(162);
  expect(state.answers.familyHistory).toEqual({ highBp: true });
  expect(state.answers.limitations).toEqual([]);
  expect(state.answers.meals).toHaveLength(8);
  expect(state.answers.meals.find((m) => m.slot === "lunch")?.items).toBe("Dal rice");
  expect(state.photos[0].uploadedAt).toBe("2026-11-17T10:00:00Z");
  expect(state.submittedAt).toBeNull();
});

test("saves with PUT in snake_case", async () => {
  fetchMock.mockResolvedValueOnce(jsonResponse(200, { answers: {}, submitted_at: null, photos: [] }));
  await saveQuestionnaire({ ...emptyAnswers(), weightKg: 72.4, familyHistory: { heartDisease: false }, programNeed: "weight_loss" });
  const req = requestOf(fetchMock, 0);
  expect(req).toMatchObject({ url: URL, method: "PUT" });
  const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string).answers;
  expect(sent.weight_kg).toBe(72.4);
  expect(sent.family_history).toEqual({ heart_disease: false });
  expect(sent.program_need).toBe("weight_loss");
});
