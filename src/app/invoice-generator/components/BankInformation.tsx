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

interface BankInformationProps {
  control: Control<any>;
  printOnly?: boolean;
}

export function BankInformation({
  control,
  printOnly = false,
}: BankInformationProps) {
  const bankName = useWatch({ control, name: "bankName" });
  const bankAddress = useWatch({ control, name: "bankAddress" });
  const accountNumber = useWatch({ control, name: "accountNumber" });
  const routingNumber = useWatch({ control, name: "routingNumber" });

  if (printOnly) {
    if (!bankName) return null;

    return (
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
    );
  }

  return (
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
  );
}
