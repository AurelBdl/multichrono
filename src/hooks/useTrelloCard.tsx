import { useState, useEffect } from "react";

const useTrelloDrag = () => {
  const [hoveredCard, setHoveredCard] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseOver = (event: MouseEvent) => {
      const card = (event.target as HTMLElement).closest(".KWQlnMvysRK4fI"); // Ajuste cette classe si besoin
      if (card) setHoveredCard(card);
    };

    document.addEventListener("mouseover", handleMouseOver);
    return () => document.removeEventListener("mouseover", handleMouseOver);
  }, []);

  return hoveredCard;
};

export default useTrelloDrag;