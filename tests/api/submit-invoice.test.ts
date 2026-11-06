import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { renderToBuffer } from "@react-pdf/renderer";
import { getResend } from "@/lib/resend";
import handler from "@/pages/api/submit-invoice";

vi.mock("formidable", () => ({ default: vi.fn() }));
vi.mock("@react-pdf/renderer", () => ({ renderToBuffer: vi.fn() }));
vi.mock("@/app/invoice-generator/components/InvoicePDF", () => ({
  InvoicePDF: vi.fn(),
}));
vi.mock("@/app/invoice-generator/components/InvoiceEmail", () => ({
  InvoiceEmail: vi.fn(),
}));
vi.mock("@/lib/resend", () => ({ getResend: vi.fn() }));
vi.mock("@/lib/route-log", () => ({
  createRouteLog: () => ({
    info: vi.fn(),
    misconfigured: vi.fn(),
    unexpected: vi.fn(),
  }),
}));

const send = vi.fn();
const parse = vi.fn();

async function submit(submitterEmail?: string, invoiceType = "interviewers") {
  parse.mockResolvedValue([
    {
      invoiceType: [invoiceType],
      invoiceData: [
        JSON.stringify({ invoiceNumber: "123", dueDate: "2026-12-01" }),
      ],
      ...(submitterEmail === undefined
        ? {}
        : { submitterEmail: [submitterEmail] }),
    },
    {},
  ]);
  const res = { status: vi.fn().mockReturnThis(), send: vi.fn() };
  await handler(
    { method: "POST" } as NextApiRequest,
    res as unknown as NextApiResponse,
  );
  return res;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(formidable).mockReturnValue({ parse } as never);
  vi.mocked(getResend).mockReturnValue({ emails: { send } } as never);
  vi.mocked(renderToBuffer).mockResolvedValue(Buffer.from("invoice PDF"));
  send.mockResolvedValue({ error: null });
});

describe("invoice submitter CC", () => {
  it.each(["interviewers", "silvered"])(
    "copies the submitter on %s invoices",
    async (invoiceType) => {
      const res = await submit("  submitter@example.com  ", invoiceType);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ["silver-dev@ap.mercury.com"],
          cc: ["submitter@example.com"],
          attachments: [
            {
              content: Buffer.from("invoice PDF").toString("base64"),
              filename: "invoice_123.pdf",
            },
          ],
        }),
      );
    },
  );

  it.each([undefined, "", "   "])(
    "preserves submissions without a CC email (%s)",
    async (email) => {
      const res = await submit(email);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ cc: undefined }),
      );
    },
  );

  it.each(["invalid", "a@example.com,b@example.com"])(
    "rejects invalid or multiple addresses (%s)",
    async (email) => {
      const res = await submit(email);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(send).not.toHaveBeenCalled();
      expect(renderToBuffer).not.toHaveBeenCalled();
    },
  );
});
