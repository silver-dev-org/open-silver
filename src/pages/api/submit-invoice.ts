import formidable from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "node:fs";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/app/invoice-generator/utils/generate-invoice-pdf";

const resend = new Resend(process.env.RESEND_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== "POST") {
      res.status(404).send({ message: "Not Found" });
      return;
    }

    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const invoiceType = fields.invoiceType?.[0] || "interviewers";
    const invoiceData = fields.invoiceData?.[0]
      ? JSON.parse(fields.invoiceData[0])
      : {};

    let attachments: Array<{
      content?: string;
      path?: string;
      filename: string;
    }> = [];

    if (invoiceType === "interviewers") {
      const pdfBuffer = await renderToBuffer(
        InvoicePDF({
          data: {
            invoiceNumber: invoiceData.invoiceNumber,
            invoiceName: invoiceData.invoiceName,
            invoiceSubtitle: invoiceData.invoiceSubtitle,
            billingName: invoiceData.billingName,
            billingAddress: invoiceData.billingAddress,
            bankName: invoiceData.bankName,
            bankAddress: invoiceData.bankAddress,
            accountNumber: invoiceData.accountNumber,
            routingNumber: invoiceData.routingNumber,
            items: invoiceData.items,
            dueDate: new Date(invoiceData.dueDate),
          },
        }),
      );

      attachments.push({
        content: pdfBuffer.toString("base64"),
        filename: `invoice_${invoiceData.invoiceNumber}.pdf`,
      });
    } else if (invoiceType === "silvered") {
      const silveredFile = files.silveredInvoiceFile?.[0];
      if (silveredFile) {
        attachments.push({
          content: fs.readFileSync(silveredFile.filepath).toString("base64"),
          filename: silveredFile.originalFilename || "course_invoice.pdf",
        });
      }
    }

    const emailSubject =
      invoiceType === "interviewers"
        ? `Invoice #${invoiceData.invoiceNumber} - ${invoiceData.billingName}`
        : `SilverEd Course Invoice - ${invoiceData.silveredCourse}`;

    const emailText =
      invoiceType === "interviewers"
        ? `New invoice generated:

Invoice #: ${invoiceData.invoiceNumber}
From: ${invoiceData.invoiceName}
To: ${invoiceData.billingName}
Total: $${invoiceData.items.reduce((sum: number, item: any) => sum + (item.isBonified ? 0 : item.price), 0).toFixed(2)}

Items:
${invoiceData.items.map((item: any) => `- ${item.name}: $${item.price.toFixed(2)}${item.isBonified ? " (Bonified)" : ""}`).join("\n")}
`
        : `New SilverEd course invoice:

Course: ${invoiceData.silveredCourse}
From: ${invoiceData.invoiceName}
To: ${invoiceData.billingName}
${invoiceData.silveredDescription ? `\nDescription: ${invoiceData.silveredDescription}` : ""}
`;

    const { error } = await resend.emails.send({
      from: "Invoice Generator <invoices@silver.dev>",
      to: [
        "jen.calvineo@gmail.com",
        "gabriel@silver.dev",
        "nicolas@silver.dev",
      ],
      subject: emailSubject,
      text: emailText,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Error sending invoice email. Please try again.",
    });
  }
}

export const config = {
  maxDuration: 30,
  api: {
    bodyParser: false,
  },
};
