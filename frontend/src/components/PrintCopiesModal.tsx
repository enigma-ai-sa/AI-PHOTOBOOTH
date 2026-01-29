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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 bg-opacity-10 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 max-w-sm sm:max-w-md w-full">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-center mb-4 sm:mb-6">
          <span className="bg-gradient-to-r from-primary-purple-500 via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent">
            Select Number of Copies
          </span>
        </h2>

        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
          <button
            onClick={onDecrement}
            disabled={copies <= 1}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-green text-white flex items-center justify-center text-xl sm:text-2xl font-bold hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Decrease copies"
          >
            <IoRemove />
          </button>

          <div className="text-4xl sm:text-5xl font-bold text-center min-w-[80px] bg-gradient-to-r from-primary-purple-500 via-primary-light-blue-500 to-accent-green-500 bg-clip-text text-transparent">
            {copies}
          </div>

          <button
            onClick={onIncrement}
            disabled={copies >= 10}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-green text-white flex items-center justify-center text-xl sm:text-2xl font-bold hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Increase copies"
          >
            <IoAdd />
          </button>
        </div>

        <p className="text-center text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
          {copies === 1 ? "1 copy" : `${copies} copies`} will be printed
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Button onClick={onCancel} variant="tertiary" size="medium">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="primary" size="medium">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
