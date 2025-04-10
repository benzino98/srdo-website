import React from "react";

interface PlaceholderImageProps {
  width?: number;
  height?: number;
  text?: string;
  className?: string;
}

/**
 * A component that renders a placeholder image with customizable dimensions and text
 * Uses a locally generated element instead of an external service
 */
const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  width = 100,
  height = 100,
  text = "No Image",
  className = "",
}) => {
  // Generate random background color for visual variety, but keep it consistent for same text
  const getColorFromText = (text: string) => {
    // Simple hash function to get consistent colors for the same text
    const hash = text
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 80%)`;
  };

  const bgColor = getColorFromText(text);

  return (
    <div
      className={`flex items-center justify-center text-gray-600 font-medium ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: bgColor,
        overflow: "hidden",
        borderRadius: "4px",
      }}
    >
      <span className="text-center p-1">{text}</span>
    </div>
  );
};

export default PlaceholderImage;
