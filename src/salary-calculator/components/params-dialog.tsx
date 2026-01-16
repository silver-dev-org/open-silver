import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/animated-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DEFAULT_PARAMS } from "../constants";
import type { Params } from "../types";

export function ParamsDialog({
  params,
  setParams,
}: {
  params: Params;
  setParams: (params: Params) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, control } = useForm<Params>({
    defaultValues: params,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    if (isOpen) {
      reset(params);
    }
  }, [isOpen, params, reset]);

  function onSubmit(data: Params) {
    setParams(data);
    setIsOpen(false);
  }

  function handleCancel() {
    reset(params);
    setIsOpen(false);
  }

  function handleReset() {
    reset(DEFAULT_PARAMS);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 />
          Edit additional parameters
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit additional parameters</DialogTitle>
            <DialogDescription>Money amounts are in USD.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-6 py-6">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="monthlyPrivateHealth"
                className="font-semibold flex flex-col items-start gap-0"
              >
                <span className="md:text-base">Health Contribution</span>
                <span className="text-xs text-muted-foreground">E.g. OSDE</span>
              </Label>
              <div className="flex items-center gap-1">
                <span>$</span>
                <Input
                  id="monthlyPrivateHealth"
                  type="number"
                  className="w-min"
                  min={0}
                  max={999999}
                  required
                  {...register("monthlyPrivateHealth", {
                    valueAsNumber: true,
                  })}
                />
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <fieldset className="space-y-4">
              <Label className="font-semibold md:text-base">
                <abbr title="Restricted Stock Units">RSUs</abbr> Compensation
              </Label>

              <div className="space-y-4 pl-4 border-l-2">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold">Vesting Period</Label>
                  <Controller
                    name="rsuVestingPeriod"
                    control={control}
                    render={({ field }) => (
                      <div className="flex border rounded-md">
                        <label
                          className={cn(
                            "px-3 py-1.5 text-sm cursor-pointer rounded-l transition-colors",
                            field.value === 1
                              ? "bg-accent"
                              : "hover:bg-accent/50",
                          )}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            checked={field.value === 1}
                            onChange={() => field.onChange(1)}
                          />
                          1 year
                        </label>
                        <label
                          className={cn(
                            "px-3 py-1.5 text-sm cursor-pointer rounded-r transition-colors",
                            field.value === 4
                              ? "bg-accent"
                              : "hover:bg-accent/50",
                          )}
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            checked={field.value === 4}
                            onChange={() => field.onChange(4)}
                          />
                          4 years
                        </label>
                      </div>
                    )}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <Label htmlFor="rsuTotalGrant" className="font-semibold">
                    Total Grant Amount
                  </Label>
                  <div className="flex items-center gap-1">
                    <span>$</span>
                    <Input
                      id="rsuTotalGrant"
                      type="number"
                      className="w-min max-w-32"
                      min={0}
                      step="0.01"
                      {...register("rsuTotalGrant", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          <DialogFooter className="flex-col md:flex-row gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleReset}
              className="md:mr-auto order-last md:order-first"
            >
              Reset to defaults
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
