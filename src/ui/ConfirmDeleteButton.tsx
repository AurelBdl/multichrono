import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

export default function ConfirmDeleteButton({
  onDelete,
  rounded = false,
  confirmLabel = "All",
}: {
  onDelete: () => void,
  rounded?: boolean,
  confirmLabel?: string,
}) {
  const [state, setState] = useState("idle");
  const ref = useRef<HTMLButtonElement>(null);
  const confirmWidth = `${Math.max(4.5, confirmLabel.length * 0.55 + 2.6)}rem`;

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
      className={`${rounded ? 'rounded-full h-14' : 'rounded-lg h-10'} flex shrink-0 items-center p-2 overflow-hidden text-white justify-center transition-all duration-300 ease-in-out bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600`}
      style={{
        width: state === "idle" ? (rounded ? "" : "2.5rem") : confirmWidth,
      }}
    >
      <Trash2 className="w-6 h-6" />
      <span
        className={`whitespace-nowrap text-sm leading-none overflow-hidden transition-all duration-300 ease-in-out ${state === "idle" ? "w-[0px] scale-0" : "ml-2 w-auto scale-100"
          }`}
      >
        {confirmLabel}
      </span>
    </button>
  );
}
