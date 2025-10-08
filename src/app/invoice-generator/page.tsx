"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Gift, Edit3, Calendar } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CheckedState } from "@radix-ui/react-checkbox";

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
  itemName: z.string(),
  itemPrice: z.string(),
  bulkText: z.string(),
  bulkPrice: z.string(),
});

type FormData = z.infer<typeof formSchema>;
type InvoiceItem = z.infer<typeof invoiceItemSchema>;

function getDefaultDueDate() {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 30);
  return futureDate;
}

function getLocale() {
  const userLocale = navigator.language || "en-US";
  return userLocale.startsWith("es") || userLocale.startsWith("ar") ? es : enUS;
}

function getDateFormat() {
  const userLocale = navigator.language || "en-US";
  return userLocale.startsWith("es") || userLocale.startsWith("ar")
    ? "dd/MM/yy"
    : "MM/dd/yy";
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [parsedInterviews, setParsedInterviews] = useState<InvoiceItem[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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

  const items = watch("items");
  const dueDate = watch("dueDate");
  const itemName = watch("itemName");
  const itemPrice = watch("itemPrice");
  const bulkText = watch("bulkText");
  const bulkPrice = watch("bulkPrice");
  const invoiceName = watch("invoiceName");
  const invoiceSubtitle = watch("invoiceSubtitle");
  const billingName = watch("billingName");
  const billingAddress = watch("billingAddress");
  const bankName = watch("bankName");
  const bankAddress = watch("bankAddress");
  const accountNumber = watch("accountNumber");
  const routingNumber = watch("routingNumber");

  const isFormValid = formState.isValid;

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + (item.isBonified ? 0 : item.price), 0),
    [items],
  );

  const bonifiedTotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + (item.isBonified ? item.price : 0), 0),
    [items],
  );

  const formattedDueDate = useMemo(
    () => format(dueDate, getDateFormat(), { locale: getLocale() }),
    [dueDate],
  );

  const currentDate = useMemo(
    () => format(new Date(), getDateFormat(), { locale: getLocale() }),
    [],
  );

  function handlePrint() {
    if (!isFormValid) {
      alert("Please fill in all required fields before printing.");
      return;
    }

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
    if (bulkText.trim()) {
      const parsed = parseInterviewText(bulkText);
      setParsedInterviews(parsed);
    }
  }

  function addParsedInterviews() {
    if (parsedInterviews.length > 0) {
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Print Styles */}
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

      {/* Bonify Dialog */}
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
        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold">INVOICE</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Invoice #: {invoiceNumber}
                </p>
                <p className="text-muted-foreground">Date: {currentDate}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Due Date: {formattedDueDate}</span>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 print:hidden"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          if (date) {
                            setValue("dueDate", date);
                            setCalendarOpen(false);
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div>
                  <FormField
                    control={control}
                    name="invoiceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            className="text-xl font-semibold text-right border-none p-0 h-auto bg-transparent print:border-none print:shadow-none print:outline-none"
                            placeholder="Enter your name"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={control}
                    name="invoiceSubtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            className="text-muted-foreground text-right border-none p-0 h-auto bg-transparent print:border-none print:shadow-none print:outline-none"
                            placeholder="Enter your business/service"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Billing Information - Hidden when printing */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormField
                control={control}
                name="billingName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name or Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Silver.dev LLC" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="billingAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complete Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., 123 Main Street, New York NY 10001, United States"
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Item Form - Hidden when printing */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Bank Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormField
                  control={control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter bank name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <FormField
                  control={control}
                  name="bankAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Address (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 456 Bank Street, Chicago IL 60601, United States"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Account number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={control}
                  name="routingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routing Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Routing number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Item Form - Hidden when printing */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Add Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <FormField
                  control={control}
                  name="itemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter item name" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-32">
                <FormField
                  control={control}
                  name="itemPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <Button onClick={addItem} className="shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Import - Hidden when printing */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Bulk Import Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormField
                control={control}
                name="bulkText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paste Interview Schedule</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="w-full min-h-[200px] p-3 border border-input rounded-md resize-vertical"
                        placeholder="Paste your interview schedule here...

Example format:
Wed, Jun 25, 2025 4:30pm - 5:15pm
Live Coding Interview
Alex Johnson
TechCorp Inc - Front End Engineer (React)

Tue, Jun 24, 2025 5:00pm - 5:45pm
Live Coding Interview
Sarah Wilson
DevSolutions - Full Stack Engineer"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button onClick={parseInterviews} disabled={!bulkText.trim()}>
                Parse Interviews
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Parsed Interviews Preview - Hidden when printing */}
        {parsedInterviews.length > 0 && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>
                Parsed Interviews Preview ({parsedInterviews.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Bulk Price Setting */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <FormField
                      control={control}
                      name="bulkPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Set Price for All Items ($)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="Enter price for all interviews"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button onClick={addParsedInterviews} disabled={!bulkPrice}>
                    Add All to Invoice
                  </Button>
                  <Button variant="outline" onClick={clearParsedInterviews}>
                    Clear
                  </Button>
                </div>

                {/* Preview Table */}
                <div className="border rounded-md">
                  <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground border-b p-3">
                    <div className="col-span-10">Interview Details</div>
                    <div className="col-span-2 text-right">Price</div>
                  </div>
                  {parsedInterviews.map((interview, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-4 items-center p-3 border-b last:border-b-0"
                    >
                      <div className="col-span-10">
                        <span className="text-sm">{interview.name}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm">
                          $
                          {bulkPrice
                            ? Number.parseFloat(bulkPrice).toFixed(2)
                            : "0.00"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bill To Information - Shown on printed invoice */}
        {billingName && (
          <Card className="hidden print:block">
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-semibold">{billingName}</p>
                <p>{billingAddress}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No items added yet. Add your first item above.
              </p>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground border-b pb-2">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-2 text-center print:hidden">
                    Actions
                  </div>
                </div>

                {/* Items */}
                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 items-center py-2 border-b"
                  >
                    <div className="col-span-6">
                      <span
                        className={
                          item.isBonified
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        {item.name}
                      </span>
                      {item.isBonified && item.bonifiedReason && (
                        <div className="text-xs text-green-600 mt-1">
                          Reason: {item.bonifiedReason}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      <span
                        className={
                          item.isBonified
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        ${item.price.toFixed(2)}
                      </span>
                      {item.isBonified && (
                        <div className="text-green-600 font-semibold">FREE</div>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      {item.isBonified ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          <Gift className="w-3 h-3 mr-1" />
                          Bonified
                        </Badge>
                      ) : (
                        <Badge variant="outline">Regular</Badge>
                      )}
                    </div>
                    <div className="col-span-2 flex justify-center gap-2 print:hidden">
                      <Button
                        size="sm"
                        variant={item.isBonified ? "default" : "outline"}
                        onClick={() => toggleBonified(index)}
                      >
                        <Gift className="w-3 h-3" />
                      </Button>
                      {item.isBonified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openBonifyDialog(index)}
                          title="Edit bonification reason"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Summary */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {bonifiedTotal > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Bonified Items (Discount):</span>
                    <span>-${bonifiedTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {bonifiedTotal > 0 && (
                  <p className="text-sm text-muted-foreground text-right">
                    Original total: ${(subtotal + bonifiedTotal).toFixed(2)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Information - Shown on printed invoice */}
        {bankName && (
          <Card className="hidden print:block">
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Bank:</strong> {bankName}
                </p>
                {bankAddress && (
                  <p>
                    <strong>Bank Address:</strong> {bankAddress}
                  </p>
                )}
                <p>
                  <strong>Account Number:</strong> {accountNumber}
                </p>
                <p>
                  <strong>Routing Number:</strong> {routingNumber}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Storage - Hidden when printing */}
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

        {/* Form Validation Status - Hidden when printing */}
        {items.length > 0 && (
          <div className="print:hidden">
            {!isFormValid && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <div className="text-red-600 text-sm">
                      <strong>
                        Please complete the following required fields:
                      </strong>
                      <ul className="mt-2 space-y-1">
                        {!invoiceName && <li>• Your name</li>}
                        {!invoiceSubtitle && <li>• Your business/service</li>}
                        {!billingName && <li>• Client name or company name</li>}
                        {!billingAddress && <li>• Complete billing address</li>}
                        {!bankName && <li>• Bank name</li>}
                        {!accountNumber && <li>• Account number</li>}
                        {!routingNumber && <li>• Routing number</li>}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Print Button - Hidden when printing */}
        {items.length > 0 && (
          <div className="flex justify-end print:hidden">
            <Button
              onClick={handlePrint}
              size="lg"
              disabled={!isFormValid}
              className={!isFormValid ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isFormValid
                ? "Print Invoice"
                : "Complete Required Fields to Print"}
            </Button>
          </div>
        )}
      </Form>
    </div>
  );
}
