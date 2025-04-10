import React, { useState, useEffect, useCallback } from "react";

interface ImageWithFallbackProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  width?: string | number;
  height?: string | number;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  alt,
  className = "",
  width,
  height,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);

  // Reset when the source changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  // Use useCallback to memoize the error handler
  const handleError = useCallback(() => {
    if (imgSrc !== fallbackSrc && fallbackSrc) {
      // Try the fallback

      setImgSrc(fallbackSrc);
    } else {
      // If fallback also fails, show placeholder

      setHasError(true);
    }
  }, [imgSrc, fallbackSrc, src]);

  // If the image failed to load even with fallback, show a placeholder
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 ${className}`}
        style={{ minHeight: "150px" }}
      >
        <div className="text-gray-500 text-center p-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm">{alt || "Image not available"}</p>
        </div>
      </div>
    );
  }

  // Display the image (either original or fallback)
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
      style={{
        objectFit: "cover",
        width: "100%",
        height: "100%",
      }}
    />
  );
};

export default ImageWithFallback;
