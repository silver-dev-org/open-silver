// Network-free coverage of the /api/grade SSRF guard: address classification
// and every URL shape that must be refused before a socket is opened.

import { describe, expect, it } from "vitest";
import {
  fetchRemoteResume,
  isPublicAddress,
} from "@/resume-checker/fetch-resume";

const PRIVATE_ADDRESSES = [
  "0.0.0.0",
  "10.1.2.3",
  "100.64.0.1",
  "127.0.0.1",
  "169.254.169.254", // cloud metadata
  "172.16.0.1",
  "172.31.255.255",
  "192.0.0.1",
  "192.168.1.1",
  "198.18.0.1",
  "224.0.0.1",
  "255.255.255.255",
  "::",
  "::1",
  "fe80::1",
  "fc00::1",
  "fd00::abcd",
  "ff02::1",
  "::ffff:127.0.0.1", // IPv4-mapped
  "::ffff:169.254.169.254",
  "64:ff9b::127.0.0.1", // NAT64
  "2002:7f00:1::", // 6to4
  "2001:db8::1",
];

const PUBLIC_ADDRESSES = [
  "1.1.1.1",
  "8.8.8.8",
  "172.15.0.1", // just outside 172.16/12
  "172.32.0.1",
  "192.169.0.1",
  "2606:4700:4700::1111",
  "::ffff:8.8.8.8",
  "2002:0808:0808::",
];

describe("isPublicAddress", () => {
  it.each(PRIVATE_ADDRESSES)("blocks %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each(PUBLIC_ADDRESSES)("allows %s", (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });

  it("rejects anything that is not an address", () => {
    expect(isPublicAddress("not-an-ip")).toBe(false);
    expect(isPublicAddress("")).toBe(false);
  });
});

const REFUSED: ReadonlyArray<readonly [string, string]> = [
  ["not a url", "InvalidResumeURL"],
  ["http://example.com/cv.pdf", "InvalidResumeURL"],
  ["file:///etc/passwd", "InvalidResumeURL"],
  ["gopher://example.com/", "InvalidResumeURL"],
  ["https://user:pw@example.com/cv.pdf", "InvalidResumeURL"],
  ["https://example.com:8443/cv.pdf", "BlockedResumeURL"],
  ["https://example.com:22/cv.pdf", "BlockedResumeURL"],
  ["https://127.0.0.1/cv.pdf", "BlockedResumeURL"],
  ["https://[::1]/cv.pdf", "BlockedResumeURL"],
  ["https://[::ffff:127.0.0.1]/cv.pdf", "BlockedResumeURL"],
  ["https://169.254.169.254/latest/meta-data/", "BlockedResumeURL"],
  ["https://2130706433/cv.pdf", "BlockedResumeURL"], // decimal loopback
  ["https://0x7f000001/cv.pdf", "BlockedResumeURL"], // hex loopback
];

describe("fetchRemoteResume", () => {
  it.each(REFUSED)("refuses %s with %s", async (url, code) => {
    await expect(fetchRemoteResume(url)).rejects.toMatchObject({ code });
  });
});
