"use client";

import { useMemo } from "react";
import { Control, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InvoiceItem {
  price: number;
  isBonified: boolean;
}

interface InvoiceSummaryProps {
  control: Control<any>;
}

export function InvoiceSummary({ control }: InvoiceSummaryProps) {
  const items = useWatch({ control, name: "items" }) as InvoiceItem[];

  const subtotal = useMemo(
    () =>
      items?.reduce(
        (sum, item) => sum + (item.isBonified ? 0 : item.price),
        0,
      ) || 0,
    [items],
  );

  const bonifiedTotal = useMemo(
    () =>
      items?.reduce(
        (sum, item) => sum + (item.isBonified ? item.price : 0),
        0,
      ) || 0,
    [items],
  );

  if (!items || items.length === 0) {
    return null;
  }

  return (
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
  );
}
