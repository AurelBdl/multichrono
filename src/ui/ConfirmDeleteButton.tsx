import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

export default function ConfirmDeleteButton({ onDelete, rounded = false }: { onDelete: () => void, rounded?: boolean }) {
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
      setState("confirm");
    } else if (state === "confirm") {
      onDelete();
      setState("idle");
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
      id={state === "idle" ? "confirm-delete" : "delete"}
      onClick={handleClick}
      className={`${rounded ? 'rounded-full w-14 h-14' : 'rounded-lg'} flex items-center p-2 overflow-hidden text-white justify-center transition-all duration-300 ease-in-out bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600`}
      style={{
        width: state === "idle" ? (rounded ? "" : "2.5rem") : "4.5rem",
      }}
    >
      <Trash2 className="w-6 h-6" />
      <span
        className={`overflow-hidden transition-all duration-300 ease-in-out ${state === "idle" ? "w-[0px] scale-0" : "ml-2 w-auto scale-100"
          }`}
      >
        All
      </span>
    </button>
  );
}