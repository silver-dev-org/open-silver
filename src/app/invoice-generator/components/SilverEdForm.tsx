"use client";

import { useState } from "react";
import { Control, useWatch } from "react-hook-form";
import { Upload, File, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const courses = [
  "CodeCrafters",
  "Epic Web",
  "Total Typescript",
  "Educative.io",
  "CSS for JS Devs",
  "Three.js Journey",
  "Epic React",
  "The Joy of React de Josh Comeau",
  "Interview Ready",
];

interface SilverEdFormProps {
  control: Control<any>;
}

export function SilverEdForm({ control }: SilverEdFormProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const selectedFile = useWatch({ control, name: "silveredInvoiceFile" });

  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>SilverEd Course Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <FormField
            control={control}
            name="silveredCourse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="silveredInvoiceFile"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Course Invoice (PDF)</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-all"
                    >
                      <input
                        {...field}
                        id="file-upload"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFileName(file.name);
                            onChange(file);
                          }
                        }}
                      />
                      <Upload className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {fileName ||
                          selectedFile?.name ||
                          "Click to upload PDF"}
                      </span>
                    </label>

                    {(fileName || selectedFile) && (
                      <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {fileName || selectedFile?.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFileName(null);
                            onChange(undefined);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="silveredDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Add any additional notes or description..."
                    className="min-h-[100px]"
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
