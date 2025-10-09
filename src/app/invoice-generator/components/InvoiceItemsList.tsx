"use client";

import { Trash2, Gift, Edit3 } from "lucide-react";
import { FieldArrayWithId } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  isBonified: boolean;
  bonifiedReason?: string;
}

interface InvoiceItemsListProps {
  fields: FieldArrayWithId<any, "items", "id">[];
  removeItemAction: (index: number) => void;
  toggleBonifiedAction: (index: number) => void;
  openBonifyDialogAction: (index: number) => void;
}

export function InvoiceItemsList({
  fields,
  removeItemAction,
  toggleBonifiedAction,
  openBonifyDialogAction,
}: InvoiceItemsListProps) {
  if (fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No items added yet. Add your first item above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground border-b pb-2">
            <div className="col-span-6">Item</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center print:hidden">Actions</div>
          </div>

          {fields.map((item, index) => {
            const invoiceItem = item as unknown as InvoiceItem;
            return (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 items-center py-2 border-b"
              >
                <div className="col-span-6">
                  <span
                    className={
                      invoiceItem.isBonified
                        ? "line-through text-muted-foreground"
                        : ""
                    }
                  >
                    {invoiceItem.name}
                  </span>
                  {invoiceItem.isBonified && invoiceItem.bonifiedReason && (
                    <div className="text-xs text-green-600 mt-1">
                      Reason: {invoiceItem.bonifiedReason}
                    </div>
                  )}
                </div>
                <div className="col-span-2 text-right">
                  <span
                    className={
                      invoiceItem.isBonified
                        ? "line-through text-muted-foreground"
                        : ""
                    }
                  >
                    ${invoiceItem.price.toFixed(2)}
                  </span>
                  {invoiceItem.isBonified && (
                    <div className="text-green-600 font-semibold">FREE</div>
                  )}
                </div>
                <div className="col-span-2 text-center">
                  {invoiceItem.isBonified ? (
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
                    variant={invoiceItem.isBonified ? "default" : "outline"}
                    onClick={() => toggleBonifiedAction(index)}
                  >
                    <Gift className="w-3 h-3" />
                  </Button>
                  {invoiceItem.isBonified && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openBonifyDialogAction(index)}
                      title="Edit bonification reason"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeItemAction(index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
