"use client";

import posthog from "posthog-js";
import {
  AnalyticsEvent,
  AnalyticsProperties,
  AnalyticsProperty,
  UTM_PARAMS,
} from "./events";

/**
 * Campaign context for the current URL.
 *
 * silver.dev forwards `src` and the UTM keys across the domain boundary when it
 * redirects `/fees` here, so a buyer arriving from the quote receipt email
 * carries `?src=quote_receipt`. Reading them here is what keeps that
 * attribution attached to the events this app sends.
 */
export function landingProperties(): AnalyticsProperties {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const properties: AnalyticsProperties = {};

  const source = params.get("src");
  if (source) properties[AnalyticsProperty.SOURCE] = source;

  for (const [param, property] of UTM_PARAMS) {
    const value = params.get(param);
    if (value) properties[property] = value;
  }

  if (document.referrer) {
    properties[AnalyticsProperty.REFERRER] = document.referrer;
  }

  return properties;
}

function withoutEmpty(properties: AnalyticsProperties): AnalyticsProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  ) as AnalyticsProperties;
}

/**
 * Send an event, and never let analytics break the page.
 *
 * These calls sit in effects and change handlers on the calculator, so every
 * failure mode — PostHog not loaded, a key missing in a preview build, an ad
 * blocker killing the request — has to be invisible to the user. The network
 * leg is already fire-and-forget inside posthog-js; the try/catch covers the
 * synchronous half.
 */
export function captureEvent(
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {},
): void {
  const payload = withoutEmpty({
    [AnalyticsProperty.PAGE_PATH]:
      typeof window === "undefined" ? undefined : window.location.pathname,
    ...landingProperties(),
    ...properties,
  });

  if (process.env.NODE_ENV === "development") {
    // posthog-js goes quiet when the project key is missing or rejected, which
    // is the normal state of a local checkout. Logging here shows what would
    // have been sent, so the funnel can be walked without a live project.
    console.info(`[analytics] ${event}`, payload);
  }

  try {
    posthog.capture(event, payload);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[analytics] failed to capture ${event}`, error);
    }
  }
}
