import * as z from "zod";

export const invoiceItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required"),
  price: z.number().min(0, "Price must be positive"),
  isBonified: z.boolean(),
  bonifiedReason: z.string().optional(),
});

export const formSchema = z
  .object({
    invoiceType: z.enum(["interviewers", "silvered"]),
    invoiceName: z.string().min(1, "Name is required"),
    invoiceSubtitle: z.string().min(1, "Service is required"),
    bankName: z.string().min(1, "Bank name is required"),
    bankAddress: z.string().optional(),
    accountNumber: z.string().min(1, "Account number is required"),
    routingNumber: z.string().min(1, "Routing number is required"),
    billingName: z.string().min(1, "Name or Company Name is required"),
    billingAddress: z.string().min(1, "Billing address is required"),
    items: z.array(invoiceItemSchema).optional(),
    dueDate: z.date(),
    itemName: z.string().optional(),
    itemPrice: z.string().optional(),
    bulkText: z.string().optional(),
    bulkPrice: z.string().optional(),
    silveredCourse: z.string().optional(),
    silveredInvoiceFile: z.instanceof(File).optional().or(z.undefined()),
    silveredAmount: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.invoiceType === "silvered") {
      if (!data.silveredCourse || data.silveredCourse.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Course is required for SilverEd invoices",
          path: ["silveredCourse"],
        });
      }
      if (!data.silveredInvoiceFile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Course invoice PDF is required",
          path: ["silveredInvoiceFile"],
        });
      }
      if (!data.silveredAmount || data.silveredAmount.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Amount paid is required for SilverEd invoices",
          path: ["silveredAmount"],
        });
      }
    }
  });

export type FormData = z.infer<typeof formSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
