"use client";

import Button from "@/components/UI/Button";
import { IoAdd, IoRemove } from "react-icons/io5";

interface PrintCopiesModalProps {
  isOpen: boolean;
  copies: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PrintCopiesModal({
  isOpen,
  copies,
  onIncrement,
  onDecrement,
  onConfirm,
  onCancel,
}: PrintCopiesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 bg-opacity-10 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-4xl font-medium text-center mb-8">
          <span className="bg-gradient-to-r from-primary-purple-500 via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent">
            Select Number of Copies
          </span>
        </h2>

        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={onDecrement}
            disabled={copies <= 1}
            className="w-16 h-16 rounded-full bg-gradient-blue text-white flex items-center justify-center text-3xl font-bold hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Decrease copies"
          >
            <IoRemove />
          </button>

          <div className="text-6xl font-bold text-center min-w-[100px] bg-gradient-to-r from-primary-purple-500 via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent">
            {copies}
          </div>

          <button
            onClick={onIncrement}
            disabled={copies >= 10}
            className="w-16 h-16 rounded-full bg-gradient-blue text-white flex items-center justify-center text-3xl font-bold hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Increase copies"
          >
            <IoAdd />
          </button>
        </div>

        <p className="text-center text-gray-600 mb-8 text-lg">
          {copies === 1 ? "1 copy" : `${copies} copies`} will be printed
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={onCancel} variant="tertiary" size="medium">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="primary" size="medium">
            Confirm Print
          </Button>
        </div>
      </div>
    </div>
  );
}
