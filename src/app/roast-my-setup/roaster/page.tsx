"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useRef } from "react";

export default function Roaster() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error al acceder a la cámara:", err);
      });
  }, []);

  return (
    <div className="flex justify-center gap-4">
      <div>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="min-w-[50%]"
        />
      </div>
      <Card className="min-w-[50%]">Say &quot;Roast my Setup&quot;</Card>
    </div>
  );
}
