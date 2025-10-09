"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { CheckedState } from "@radix-ui/react-checkbox";

import { InvoiceHeader } from "./components/InvoiceHeader";
import { BillingInformation } from "./components/BillingInformation";
import { BankInformation } from "./components/BankInformation";
import { AddItemForm } from "./components/AddItemForm";
import { BulkImportInterviews } from "./components/BulkImportInterviews";
import { InvoiceItemsList } from "./components/InvoiceItemsList";
import { InvoiceSummary } from "./components/InvoiceSummary";
import { ValidationErrors } from "./components/ValidationErrors";

const invoiceItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required"),
  price: z.number().min(0, "Price must be positive"),
  isBonified: z.boolean(),
  bonifiedReason: z.string().optional(),
});

const formSchema = z.object({
  invoiceName: z.string().min(1, "Name is required"),
  invoiceSubtitle: z.string().min(1, "Service is required"),
  bankName: z.string().min(1, "Bank name is required"),
  bankAddress: z.string().optional(),
  accountNumber: z.string().min(1, "Account number is required"),
  routingNumber: z.string().min(1, "Routing number is required"),
  billingName: z.string().min(1, "Name or Company Name is required"),
  billingAddress: z.string().min(1, "Billing address is required"),
  items: z.array(invoiceItemSchema),
  dueDate: z.date(),
  itemName: z.string().optional(),
  itemPrice: z.string().optional(),
  bulkText: z.string().optional(),
  bulkPrice: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type InvoiceItem = z.infer<typeof invoiceItemSchema>;

function getDefaultDueDate() {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 30);
  return futureDate;
}

function parseTime(timeStr: string) {
  const [time, period] = timeStr.split(/([ap]m)/);
  const [hours, minutes] = time.split(":").map(Number);
  const adjustedHours =
    period === "pm" && hours !== 12
      ? hours + 12
      : period === "am" && hours === 12
        ? 0
        : hours;
  return adjustedHours * 60 + minutes;
}

function calculateDuration(startTime: string, endTime: string) {
  const startMinutes = parseTime(startTime);
  const endMinutes = parseTime(endTime);
  return endMinutes - startMinutes;
}

function parseInterviewText(text: string) {
  const lines = text
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "");
  const interviews = [];

  for (let i = 0; i < lines.length; i += 4) {
    if (i + 3 < lines.length) {
      const dateTimeLine = lines[i].trim();
      const typeLine = lines[i + 1].trim();
      const interviewerLine = lines[i + 2].trim();
      const companyLine = lines[i + 3].trim();

      const timeMatch = dateTimeLine.match(
        /(\d{1,2}:\d{2}[ap]m)\s*-\s*(\d{1,2}:\d{2}[ap]m)/,
      );
      let duration = 45;

      if (timeMatch) {
        const startTime = timeMatch[1];
        const endTime = timeMatch[2];
        duration = calculateDuration(startTime, endTime);
      }

      const dateMatch = dateTimeLine.match(/^([^,]+,\s*[^,]+,\s*\d{4})/);
      const date = dateMatch ? dateMatch[1] : "Unknown Date";

      const interview = {
        id: `${Date.now()}-${i}`,
        name: `${typeLine} - ${interviewerLine} (${companyLine}) - ${date}`,
        price: duration * 2,
        isBonified: false,
      };

      interviews.push(interview);
    }
  }

  return interviews;
}

export default function Component() {
  const [invoiceNumber, setInvoiceNumber] = useState("750000");
  const [bonifyDialogOpen, setBonifyDialogOpen] = useState(false);
  const [currentBonifyIndex, setCurrentBonifyIndex] = useState<number | null>(
    null,
  );
  const [bonifyReason, setBonifyReason] = useState("");
  const [parsedInterviews, setParsedInterviews] = useState<InvoiceItem[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    reValidateMode: "onChange",
    defaultValues: {
      invoiceName: "",
      invoiceSubtitle: "",
      bankName: "",
      bankAddress: "",
      accountNumber: "",
      routingNumber: "",
      billingName: "",
      billingAddress: "",
      items: [],
      dueDate: getDefaultDueDate(),
      itemName: "",
      itemPrice: "",
      bulkText: "",
      bulkPrice: "",
    },
  });

  const { control, watch, setValue, formState } = form;
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");

  useEffect(() => {
    const savedData = localStorage.getItem("invoiceData");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        form.reset(data);
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    }
  }, [form]);

  function saveToLocalStorage(saveData: CheckedState) {
    if (saveData) {
      const dataToSave = form.getValues();
      localStorage.setItem("invoiceData", JSON.stringify(dataToSave));
    } else {
      localStorage.removeItem("invoiceData");
    }
  }

  useEffect(() => {
    function generateInvoiceNumber() {
      const currentCounter = Number.parseInt(
        localStorage.getItem("invoiceCounter") || "750000",
      );
      const newCounter = currentCounter + 1;
      localStorage.setItem("invoiceCounter", newCounter.toString());
      return newCounter.toString().padStart(6, "0");
    }

    setInvoiceNumber(generateInvoiceNumber());
  }, []);

  function handlePrint() {
    const currentDate = new Date();
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `${dateString}_invoice.pdf`;

    const originalTitle = document.title;
    document.title = filename.replace(".pdf", "");

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }

  function addItem() {
    const itemName = form.getValues("itemName") || "";
    const itemPrice = form.getValues("itemPrice") || "";

    if (itemName.trim() && itemPrice.trim()) {
      append({
        id: Date.now().toString(),
        name: itemName.trim(),
        price: Number.parseFloat(itemPrice),
        isBonified: false,
      });
      setValue("itemName", "");
      setValue("itemPrice", "");
    }
  }

  function removeItem(index: number) {
    remove(index);
  }

  function openBonifyDialog(index: number) {
    const item = fields[index];
    if (item) {
      setCurrentBonifyIndex(index);
      setBonifyReason(item.bonifiedReason || "");
      setBonifyDialogOpen(true);
    }
  }

  function handleBonifySubmit() {
    if (currentBonifyIndex !== null) {
      const item = fields[currentBonifyIndex];
      update(currentBonifyIndex, {
        ...item,
        isBonified: true,
        bonifiedReason: bonifyReason.trim() || "No reason provided",
      });
    }
    setBonifyDialogOpen(false);
    setCurrentBonifyIndex(null);
    setBonifyReason("");
  }

  function toggleBonified(index: number) {
    const item = fields[index];
    if (!item) return;

    if (item.isBonified) {
      update(index, {
        ...item,
        isBonified: false,
        bonifiedReason: undefined,
      });
    } else {
      openBonifyDialog(index);
    }
  }

  function parseInterviews() {
    const bulkText = form.getValues("bulkText") || "";
    if (bulkText.trim()) {
      const parsed = parseInterviewText(bulkText);
      setParsedInterviews(parsed);
    }
  }

  function addParsedInterviews() {
    if (parsedInterviews.length > 0) {
      const bulkPrice = form.getValues("bulkPrice");
      const price = bulkPrice ? Number.parseFloat(bulkPrice) : 0;
      const itemsWithBulkPrice = parsedInterviews.map((item, idx) => ({
        ...item,
        price: price,
        id: `${Date.now()}-${idx}`,
      }));
      append(itemsWithBulkPrice);
      setParsedInterviews([]);
      setValue("bulkText", "");
      setValue("bulkPrice", "");
    }
  }

  function clearParsedInterviews() {
    setParsedInterviews([]);
    setValue("bulkText", "");
    setValue("bulkPrice", "");
  }

  console.log(form.watch(), formState.isValid, formState.errors);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <Dialog open={bonifyDialogOpen} onOpenChange={setBonifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Item as Bonified (Free)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bonify-reason">Reason for bonification</Label>
              <Textarea
                id="bonify-reason"
                value={bonifyReason}
                onChange={(e) => setBonifyReason(e.target.value)}
                placeholder="Enter reason for making this item free (e.g., 'Promotional offer', 'Client loyalty discount', 'Technical issues during session')"
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBonifyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleBonifySubmit}>Mark as Free</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <InvoiceHeader control={control} invoiceNumber={invoiceNumber} />

        <BillingInformation control={control} />

        <BankInformation control={control} />

        <AddItemForm control={control} addItemAction={addItem} />

        <BulkImportInterviews
          control={control}
          parseInterviewsAction={parseInterviews}
          addParsedInterviewsAction={addParsedInterviews}
          clearParsedInterviewsAction={clearParsedInterviews}
          parsedInterviews={parsedInterviews}
        />

        <BillingInformation control={control} printOnly />

        <InvoiceItemsList
          fields={fields}
          removeItemAction={removeItem}
          toggleBonifiedAction={toggleBonified}
          openBonifyDialogAction={openBonifyDialog}
        />

        <InvoiceSummary control={control} />

        <BankInformation control={control} printOnly />

        {items.length > 0 && (
          <div className="print:hidden">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox id="save-data" onCheckedChange={saveToLocalStorage} />
              <Label htmlFor="save-data" className="text-sm">
                Store all data in local storage for future use, this is not
                stored in any database
              </Label>
            </div>
          </div>
        )}

        <ValidationErrors errors={formState.errors} />

        {items.length > 0 && (
          <div className="flex justify-end print:hidden">
            <Button onClick={handlePrint} size="lg">
              Print Invoice
            </Button>
          </div>
        )}
      </Form>
    </div>
  );
}
