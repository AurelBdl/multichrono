import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

export default function ConfirmDeleteButton({ onDelete }: { onDelete: () => void }) {
  const [state, setState] = useState("idle");
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    document.addEventListener("click", onOutsideClick);
    return () => {
      document.removeEventListener("click", onOutsideClick);
    };
  }, []);

  const handleClick = () => {
    if (state === "idle") {
      setState("confirm"); // Expand to show "Delete"
    } else if (state === "confirm") {
      onDelete(); // Execute delete
      setState("idle"); // Reset to initial state
    }
  };

  const onOutsideClick = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setState("idle");
    }
  };

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={`flex items-center py-2 overflow-hidden rounded-lg text-white justify-center transition-all duration-300 ease-in-out bg-red-600 hover:bg-red-700`}
      style={{
        width: state === "idle" ? "3.5rem" : "5.5rem",
      }}
    >
      <Trash2 className="w-6 h-6" />
      <span
        className={`ml-2 ${
          state === "idle" ? "hidden" : "visible"
        }`}
      >
        All
      </span>
    </button>
  );
}