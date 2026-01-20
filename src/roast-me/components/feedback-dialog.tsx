"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { FeedbackRequest, SetupAnalysis } from "../types";

const formSchema = z.object({
  description: z.string().min(10, "Please provide more details."),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must consent to share data." }),
  }),
});

type FeedbackDialogProps = {
  snapshot: string;
  analysis: SetupAnalysis;
  isUnhinged: boolean;
};

export function FeedbackDialog({
  snapshot,
  analysis,
  isUnhinged,
}: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: "", consent: false as unknown as true },
  });

  const { mutate: send, isPending } = useMutation({
    mutationFn: async ({ description }: z.infer<typeof formSchema>) => {
      const res = await fetch("/roast-me/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot,
          analysis,
          isUnhinged,
          description,
        } satisfies FeedbackRequest),
      });

      if (!res.ok) {
        throw new Error("Failed to send feedback.");
      }
    },
    onSuccess: () => {
      form.reset();
      setOpen(false);
      toast.success("Thanks for your feedback!");
    },
    onError: () => {
      toast.error("Failed to send feedback. Please try again.");
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    send(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <MessageSquare />
          Send Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Let us know what you think about the roast.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I consent to share the snapshot and generated feedback.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => form.reset()}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
