"use client";

import { forwardRef } from "react";
import Webcam, { type WebcamProps } from "react-webcam";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CameraPanelProps = Omit<
  Partial<WebcamProps>,
  "audio" | "className" | "mirrored" | "screenshotFormat" | "videoConstraints"
> & {
  title: string;
  description: string;
};

export const CameraPanel = forwardRef<Webcam, CameraPanelProps>(function CameraPanel(
  { title, description, ...props },
  ref,
) {
  return (
    <Card className="glass-panel overflow-hidden border-primary/20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-muted shadow-glow">
          <div className="absolute inset-x-8 top-0 z-10 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          <Webcam
            audio={false}
            className="aspect-video w-full object-cover"
            mirrored
            ref={ref}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            {...props}
          />
        </div>
      </CardContent>
    </Card>
  );
});
