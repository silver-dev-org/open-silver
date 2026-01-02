"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { cn } from "@/lib/utils";

interface UseAnimatedDialogReturn {
  isOpen: boolean;
  open: (element: HTMLElement | null) => void;
  close: () => void;
  updateOrigin: (element: HTMLElement | null) => void;
  originRect: DOMRect | null;
  dialogProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
}

export function useAnimatedDialog(): UseAnimatedDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  function open(element: HTMLElement | null) {
    if (element) {
      setOriginRect(element.getBoundingClientRect());
    }
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setTimeout(() => {
      setOriginRect(null);
    }, 300); // Matches duration-300
  }

  function updateOrigin(element: HTMLElement | null) {
    if (element) {
      setOriginRect(element.getBoundingClientRect());
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      close();
    }
  }

  return {
    isOpen,
    open,
    close,
    updateOrigin,
    originRect,
    dialogProps: {
      open: isOpen,
      onOpenChange: handleOpenChange,
    },
  };
}

interface AnimatedDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  originRect?: DOMRect | null;
}

function AnimatedDialogContent({
  originRect,
  children,
  className,
  ...props
}: AnimatedDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        "[&]:data-[state=closed]:zoom-out-10 [&]:data-[state=open]:zoom-in-10 [&]:duration-300",
        className,
      )}
      style={
        originRect
          ? ({
              "--slide-from-x": `${originRect.x + originRect.width / 2 - window.innerWidth / 2}px`,
              "--slide-from-y": `${originRect.y + originRect.height / 2 - window.innerHeight / 2}px`,
              transformOrigin: `calc(50% + var(--slide-from-x)) calc(50% + var(--slide-from-y))`,
            } as React.CSSProperties)
          : undefined
      }
      {...props}
    >
      {children}
    </DialogContent>
  );
}

export {
  AnimatedDialogContent,

  // Re-exporting dialog components for convenience
  Dialog,
  DialogPortal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogContent,
};
