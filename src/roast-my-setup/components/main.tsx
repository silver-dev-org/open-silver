"use client";

import { Button } from "@/components/ui/button";
import { CameraPreview } from "./camera-preview";

export function RoastMySetup() {
  const handleRoastMe = () => {
    console.log("User clicked 'Roast me'!");
  };

  return (
    <div className="flex w-full flex-col gap-4 max-w-4xl mx-auto">
      <CameraPreview />
      <Button onClick={handleRoastMe} size="lg" className="self-center">
        Roast me
      </Button>
    </div>
  );
}
