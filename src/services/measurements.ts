import { USERS_BASE_URL } from "../config";
import { MeasureSiteId } from "../types";
import { ApiError } from "./http";
import { invalidate, Resource, useResource } from "./resource";
import { authGet, authPost } from "./session";

const MEASUREMENTS_URL = `${USERS_BASE_URL}/me/measurements`;
const RESOURCE_KEY = "measurements";

export type SiteValues = Record<MeasureSiteId, number>;

export interface Measurement {
  id: string;
  /** ISO timestamp set by the server. */
  createdOn: string;
  /** Circumferences in inches. */
  sites: SiteValues;
  weightKg: number | null;
}

// App site id → API field.
const apiField: Record<MeasureSiteId, string> = {
  arm: "arm",
  waist: "waist",
  tummy: "tummy",
  belowNavel: "below_navel",
  hip: "hip",
  thigh: "thigh",
};
const siteIds = Object.keys(apiField) as MeasureSiteId[];

// Mirrors the API's bounds: each circumference is in inches, strictly between 0 and 120.
export const SITE_MIN_INCHES = 0;
export const SITE_MAX_INCHES = 120;

/** Why a typed value can't be saved, or null if it can. */
export function siteValueError(text: string): string | null {
  const value = Number(text.trim().replace(",", "."));
  if (!text.trim() || Number.isNaN(value)) return "Enter a number, like 31.5";
  if (value <= SITE_MIN_INCHES || value >= SITE_MAX_INCHES) {
    return `Enter a measurement between ${SITE_MIN_INCHES} and ${SITE_MAX_INCHES} inches`;
  }
  return null;
}

export function parseSiteValue(text: string): number {
  return Number(text.trim().replace(",", "."));
}

/** The server's 422 messages, keyed by the app's site ids. */
export function siteErrorsOf(e: unknown): Partial<Record<MeasureSiteId, string>> {
  if (!(e instanceof ApiError)) return {};
  const errors: Partial<Record<MeasureSiteId, string>> = {};
  for (const id of siteIds) {
    const message = e.fieldErrors[apiField[id]];
    if (message) errors[id] = message;
  }
  return errors;
}

type MeasurementResponse = Record<string, unknown> | null;

function toMeasurement(raw: MeasurementResponse): Measurement | null {
  if (!raw || typeof raw.id !== "string" || typeof raw.created_on !== "string") return null;
  const sites = {} as SiteValues;
  for (const id of siteIds) {
    const value = raw[apiField[id]];
    if (typeof value !== "number") return null;
    sites[id] = value;
  }
  const weightKg = typeof raw.weight_kg === "number" ? raw.weight_kg : null;
  return { id: raw.id, createdOn: raw.created_on, sites, weightKg };
}

/** The member's measurements, newest first. */
export async function listMeasurements(): Promise<Measurement[]> {
  const raw = await authGet<MeasurementResponse[] | null>(MEASUREMENTS_URL, {
    fallbackError: "Couldn't load your measurements. Please try again.",
  });
  if (!Array.isArray(raw)) throw new ApiError("Couldn't load your measurements. Please try again.", 200);
  return raw
    .map(toMeasurement)
    .filter((m): m is Measurement => m !== null)
    .sort((a, b) => Date.parse(b.createdOn) - Date.parse(a.createdOn));
}

/** Saves a new entry. Rejects with an ApiError whose fieldErrors siteErrorsOf can map on a 422. */
export async function saveMeasurement(sites: SiteValues, weightKg?: number): Promise<Measurement> {
  const body: Record<string, number> = {};
  for (const id of siteIds) body[apiField[id]] = sites[id];
  if (weightKg !== undefined) body.weight_kg = weightKg;

  const raw = await authPost<MeasurementResponse>(MEASUREMENTS_URL, body, {
    fallbackError: "Couldn't save your measurements. Please try again.",
  });
  const saved = toMeasurement(raw);
  if (!saved) throw new ApiError("Couldn't save your measurements. Please try again.", 200);
  invalidate(RESOURCE_KEY);
  return saved;
}

export function useMeasurements(): Resource<Measurement[]> {
  return useResource(RESOURCE_KEY, listMeasurements);
}
