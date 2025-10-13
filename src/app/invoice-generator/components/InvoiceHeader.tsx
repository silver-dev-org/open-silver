"use client";

import { useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { Control, useWatch } from "react-hook-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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

interface InvoiceHeaderProps {
  control: Control<any>;
  invoiceNumber: string;
}

export function InvoiceHeader({ control, invoiceNumber }: InvoiceHeaderProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dueDate = useWatch({ control, name: "dueDate" });

  const formattedDueDate = useMemo(
    () => format(dueDate, getDateFormat(), { locale: getLocale() }),
    [dueDate],
  );

  const currentDate = useMemo(
    () => format(new Date(), getDateFormat(), { locale: getLocale() }),
    [],
  );

  return (
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
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 print:hidden"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <FormField
                    control={control}
                    name="dueDate"
                    render={({ field }) => (
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    )}
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
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
