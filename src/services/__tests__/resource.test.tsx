import React from "react";
import { Text } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { invalidate, publish, useResource } from "../resource";

function Reader({ testID, load }: { testID: string; load: () => Promise<string> }) {
  const r = useResource("thing", load);
  return <Text testID={testID}>{r.data ?? "…"}{r.error ? ` (${r.error})` : ""}</Text>;
}

test("publish hands every reader the same value, even one whose reload would fail", async () => {
  let failSecond = false;
  const ok = jest.fn(async () => "old");
  const flaky = jest.fn(async () => {
    if (failSecond) throw new Error("offline");
    return "old";
  });
  await render(
    <>
      <Reader testID="a" load={ok} />
      <Reader testID="b" load={flaky} />
    </>
  );
  await act(async () => {});
  expect(screen.getByTestId("a")).toHaveTextContent("old");
  expect(screen.getByTestId("b")).toHaveTextContent("old");

  // A reload where one reader fails leaves the readers disagreeing...
  ok.mockResolvedValue("new");
  failSecond = true;
  await act(async () => invalidate("thing"));
  expect(screen.getByTestId("a")).toHaveTextContent("new");
  expect(screen.getByTestId("b")).toHaveTextContent("old", { exact: false });

  // ...publishing the server's answer makes them agree without another request.
  const calls = flaky.mock.calls.length;
  await act(async () => publish("thing", "sent"));
  expect(screen.getByTestId("a")).toHaveTextContent("sent");
  expect(screen.getByTestId("b")).toHaveTextContent("sent");
  expect(flaky.mock.calls.length).toBe(calls);
});
