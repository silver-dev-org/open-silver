// The buyer-funnel event contract, shared with silver.dev.
//
// silver.dev measures a buyer from a commercial page through to contact, but
// the fees calculator lives here — so the middle of that funnel can only be
// emitted by this app. The names below must match
// `src/lib/analytics/events.ts` in silver-dev-org/website exactly: PostHog
// funnels key off the strings, so a near-miss produces a silently broken
// funnel rather than an error.
//
// Renaming a member breaks reporting. Add new ones instead.

export enum AnalyticsEvent {
  FEES_CALCULATOR_OPENED = "fees_calculator_opened",
  FEES_CALCULATOR_COMPLETED = "fees_calculator_completed",
  MEETING_BOOKING_STARTED = "meeting_booking_started",
}

export enum AnalyticsProperty {
  PAGE_PATH = "page_path",
  PAGE_TYPE = "page_type",
  PAGE_TOPIC = "page_topic",
  SOURCE = "source",
  REFERRER = "referrer",
  BOOKING_SURFACE = "booking_surface",
  UTM_SOURCE = "utm_source",
  UTM_MEDIUM = "utm_medium",
  UTM_CAMPAIGN = "utm_campaign",
  UTM_CONTENT = "utm_content",
  UTM_TERM = "utm_term",
}

// Matches the vocabulary silver.dev uses for its own pages, extended with the
// one value that only exists on this side.
export enum PageType {
  CALCULATOR = "calculator",
}

export enum BookingSurface {
  LINK = "link",
}

// Query-string keys read off the landing URL, paired with the property they map
// to. Anything not on this list is dropped — a URL can carry arbitrary params
// and none of them should reach PostHog unreviewed.
export const UTM_PARAMS: ReadonlyArray<
  readonly [param: string, property: AnalyticsProperty]
> = [
  ["utm_source", AnalyticsProperty.UTM_SOURCE],
  ["utm_medium", AnalyticsProperty.UTM_MEDIUM],
  ["utm_campaign", AnalyticsProperty.UTM_CAMPAIGN],
  ["utm_content", AnalyticsProperty.UTM_CONTENT],
  ["utm_term", AnalyticsProperty.UTM_TERM],
] as const;

export type AnalyticsProperties = Partial<
  Record<AnalyticsProperty, string | number | boolean>
>;
