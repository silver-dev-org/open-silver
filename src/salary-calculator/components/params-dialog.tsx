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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Settings2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { DEFAULT_PARAMS } from "../constants";
import type { Params, RSUGrant } from "../types";

function getNewRow(mode: RSUGrant["mode"] = "units"): RSUGrant {
  if (mode === "units") return { mode: "units" };
  else return { mode: "dollars" };
}

export function ParamsDialog({
  params,
  setParams,
}: {
  params: Params;
  setParams: (params: Params) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rsuEnabled, setRsuEnabled] = useState(
    !!(params.shareFMV || params.growthRate || params.grantedRSUs),
  );
  const rsuRowsRef = useRef<HTMLDivElement>(null);
  const [rsuRows, setRsuRows] = useState<RSUGrant[]>(
    params.grantedRSUs || [getNewRow()],
  );
  const { register, handleSubmit, reset } = useForm<Params>({
    defaultValues: params,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    if (isOpen) {
      reset(params);
      setRsuEnabled(
        !!(params.shareFMV || params.growthRate || params.grantedRSUs),
      );
      setRsuRows(params.grantedRSUs || [getNewRow()]);
    }
  }, [isOpen, params, reset]);

  useEffect(() => {
    if (rsuRowsRef.current) {
      rsuRowsRef.current.scrollTop = rsuRowsRef.current.scrollHeight;
    }
  }, [rsuRows.length]);

  function onSubmit(data: Params) {
    const updatedData = { ...data };
    if (rsuEnabled) {
      updatedData.grantedRSUs = rsuRows.filter((row) => {
        if (row.mode === "units") {
          return row.amount !== undefined && row.vestingPeriod !== undefined;
        } else {
          return (
            row.dollarValue !== undefined && row.vestingPeriod !== undefined
          );
        }
      });
    } else {
      delete updatedData.shareFMV;
      delete updatedData.growthRate;
      delete updatedData.grantedRSUs;
    }
    setParams(updatedData);
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
                className="font-semibold flex flex-col"
              >
                <span className="md:text-base">
                  Monthly Private Health Contribution
                </span>
                <span className="text-xs text-muted-foreground">
                  Don&apos;t include the public health contribution here
                </span>
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
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Label
                htmlFor="contractorTaxRate"
                className="font-semibold flex flex-col"
              >
                <span className="md:text-base">Contractor Tax Rate</span>
                <span className="text-xs text-muted-foreground">
                  For the Simplified Tax Regime (Monotributo)
                </span>
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="contractorTaxRate"
                  type="number"
                  className="w-min"
                  min={0}
                  max={100}
                  step="0.01"
                  required
                  {...register("contractorTaxRate", {
                    valueAsNumber: true,
                  })}
                />
                <span>%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Label
                htmlFor="discretionaryBudget"
                className="font-semibold flex flex-col"
              >
                <span className="md:text-base">
                  Monthly Discretionary Budget
                </span>
                <span className="text-xs text-muted-foreground">
                  For gym membership, home office setups, etc.
                </span>
              </Label>
              <div className="flex items-center gap-1">
                <span>$</span>
                <Input
                  id="discretionaryBudget"
                  type="number"
                  className="w-min"
                  min={0}
                  max={999999}
                  step="0.01"
                  {...register("discretionaryBudget", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="rsuEnabled"
                  className="font-semibold md:text-base"
                >
                  <abbr title="Restricted Stock Units">RSUs</abbr> Compensation
                </Label>
                <Switch
                  id="rsuEnabled"
                  checked={rsuEnabled}
                  onCheckedChange={setRsuEnabled}
                />
              </div>

              {rsuEnabled && (
                <fieldset className="space-y-4 pl-4 border-l-2 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="shareFMV" className="font-semibold">
                      Current <abbr title="Fair Market Value">FMV</abbr> of Each
                      Share
                    </Label>
                    <div className="flex items-center gap-1">
                      <span>$</span>
                      <Input
                        id="shareFMV"
                        type="number"
                        className="w-min max-w-32"
                        min={0}
                        step="0.01"
                        required
                        {...register("shareFMV", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="growthRate"
                      className="font-semibold flex flex-col"
                    >
                      <span>Yearly Growth Rate</span>
                      <span className="text-xs text-muted-foreground">
                        Expected estimation of the company
                      </span>
                    </Label>
                    <div className="flex items-center gap-1">
                      <Input
                        id="growthRate"
                        type="number"
                        className="w-min max-w-32"
                        min={0}
                        required
                        step="0.01"
                        {...register("growthRate", {
                          valueAsNumber: true,
                        })}
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="font-semibold w-12 text-center">
                        Year
                      </Label>
                      <Label className="font-semibold flex-2">
                        Grant Amount
                      </Label>
                      <Label className="font-semibold flex-1 max-w-32">
                        Vesting period
                      </Label>
                      <div className="w-10 shrink-0" />
                    </div>
                    <div
                      className="flex flex-col gap-2 max-h-36 overflow-auto py-1.5"
                      ref={rsuRowsRef}
                    >
                      {rsuRows.map((row, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 duration-300 fade-in animate-in"
                        >
                          <div className="w-12 text-center font-medium">
                            {index}
                          </div>
                          <div className="flex items-center gap-1 flex-2">
                            <Input
                              type="number"
                              placeholder={
                                row.mode === "units" ? "Amount" : "Value"
                              }
                              min={row.mode === "units" ? 1 : 0}
                              step={row.mode === "units" ? 1 : 0.01}
                              value={
                                row.mode === "units"
                                  ? (row.amount ?? "")
                                  : (row.dollarValue ?? "")
                              }
                              onChange={(e) => {
                                const newRows = [...rsuRows];
                                const value = e.target.value
                                  ? Number(e.target.value)
                                  : undefined;
                                if (row.mode === "units") {
                                  newRows[index] = {
                                    ...row,
                                    amount: value as number,
                                  };
                                } else {
                                  newRows[index] = {
                                    ...row,
                                    dollarValue: value as number,
                                  };
                                }
                                setRsuRows(newRows);
                              }}
                              required
                            />
                            <Select
                              value={row.mode}
                              onValueChange={(value: "units" | "dollars") => {
                                const newRows = [...rsuRows];
                                if (value === "units") {
                                  newRows[index] = {
                                    mode: "units",
                                    vestingPeriod: row.vestingPeriod,
                                  };
                                } else {
                                  newRows[index] = {
                                    mode: "dollars",
                                    vestingPeriod: row.vestingPeriod,
                                  };
                                }
                                setRsuRows(newRows);
                              }}
                            >
                              <SelectTrigger className="w-fit">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="units">RSUs</SelectItem>
                                <SelectItem value="dollars">dollars</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-1 flex-1 max-w-32">
                            <Input
                              type="number"
                              min={0}
                              step="0.25"
                              value={row.vestingPeriod ?? ""}
                              onChange={(e) => {
                                const newRows = [...rsuRows];
                                newRows[index] = {
                                  ...row,
                                  vestingPeriod: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                };
                                setRsuRows(newRows);
                              }}
                              required
                            />
                            <span className="text-sm text-muted-foreground">
                              years
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={rsuRows.length === 1}
                            onClick={() => {
                              setRsuRows(rsuRows.filter((_, i) => i !== index));
                            }}
                            className="shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const lastRowMode =
                          rsuRows.length > 0
                            ? rsuRows[rsuRows.length - 1].mode
                            : "units";
                        setRsuRows([...rsuRows, getNewRow(lastRowMode)]);
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add RSU Grant
                    </Button>
                  </div>
                </fieldset>
              )}
            </div>
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
