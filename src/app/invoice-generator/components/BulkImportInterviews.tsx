"use client";

import { Control, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  isBonified: boolean;
  bonifiedReason?: string;
}

interface BulkImportInterviewsProps {
  control: Control<any>;
  parseInterviewsAction: () => void;
  addParsedInterviewsAction: () => void;
  clearParsedInterviewsAction: () => void;
  parsedInterviews: InvoiceItem[];
}

export function BulkImportInterviews({
  control,
  parseInterviewsAction,
  addParsedInterviewsAction,
  clearParsedInterviewsAction,
  parsedInterviews,
}: BulkImportInterviewsProps) {
  const bulkText = useWatch({ control, name: "bulkText" });
  const bulkPrice = useWatch({ control, name: "bulkPrice" });

  return (
    <>
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
            <Button
              type="button"
              onClick={parseInterviewsAction}
              disabled={!bulkText?.trim()}
            >
              Parse Interviews
            </Button>
          </div>
        </CardContent>
      </Card>

      {parsedInterviews.length > 0 && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>
              Parsed Interviews Preview ({parsedInterviews.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                <Button
                  onClick={addParsedInterviewsAction}
                  disabled={!bulkPrice}
                  type="button"
                >
                  Add All to Invoice
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearParsedInterviewsAction}
                >
                  Clear
                </Button>
              </div>

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
    </>
  );
}
