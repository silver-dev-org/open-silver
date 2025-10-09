"use client";

import { FieldErrors } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";

interface ValidationErrorsProps {
  errors: FieldErrors<any>;
}

const errorLabels: Record<string, string> = {
  invoiceName: "Your name",
  invoiceSubtitle: "Your business/service",
  billingName: "Client name or company name",
  billingAddress: "Complete billing address",
  bankName: "Bank name",
  accountNumber: "Account number",
  routingNumber: "Routing number",
};

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  const errorFields = Object.keys(errors).filter(
    (key) => key in errorLabels && errors[key],
  );

  if (errorFields.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50 print:hidden">
      <CardContent className="pt-4">
        <div className="flex items-start gap-2">
          <div className="text-red-600 text-sm">
            <strong>Please complete the following required fields:</strong>
            <ul className="mt-2 space-y-1">
              {errorFields.map((field) => (
                <li key={field}>• {errorLabels[field]}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
