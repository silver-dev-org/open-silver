import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";

interface ConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const ConsentDialog: React.FC<ConsentDialogProps> = ({
  open,
  onAccept,
  onDecline,
}) => {
  return (
    <Dialog open={open}>
      <DialogContent className="bg-white dark:bg-gray-900 max-w-md border border-gray-200 dark:border-gray-700">
        <DialogHeader className="mb-4 text-center">
          <DialogTitle className="mb-2">¿Nos ayudas a mejorar?</DialogTitle>
          <DialogDescription className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
            Para mejorar nuestro modelo de IA, nos gustaría guardar tu respuesta
            de manera anónima. No almacenaremos ninguna información personal.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-8 flex gap-3 sm:flex-row flex-col">
          <Button
            variant="outline"
            onClick={onDecline}
            className="flex-1 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 py-3"
          >
            No, gracias
          </Button>
          <Button
            onClick={onAccept}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3"
          >
            Acepto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ConsentDialog };
