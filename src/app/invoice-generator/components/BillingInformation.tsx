"use client";

import { Control, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface BillingInformationProps {
  control: Control<any>;
  printOnly?: boolean;
}

export function BillingInformation({
  control,
  printOnly = false,
}: BillingInformationProps) {
  const billingName = useWatch({ control, name: "billingName" });
  const billingAddress = useWatch({ control, name: "billingAddress" });

  if (printOnly) {
    if (!billingName) return null;

    return (
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
    );
  }

  return (
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
  );
}
