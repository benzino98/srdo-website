import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageCarouselProps {
  images: Array<{
    url: string;
    caption?: string;
    altText: string;
  }>;
  autoPlayInterval?: number; // in milliseconds
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  autoPlayInterval = 5000, // Default to 5 seconds
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, autoPlayInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoPlaying, autoPlayInterval, images.length]);

  // Pause autoplay when user interacts with the carousel
  const handleManualNavigation = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);

    // Resume autoplay after 10 seconds of inactivity
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  const nextImage = () => {
    handleManualNavigation((currentIndex + 1) % images.length);
  };

  const prevImage = () => {
    handleManualNavigation((currentIndex - 1 + images.length) % images.length);
  };

  // If no images are provided, don't render anything
  if (!images.length) return null;

  return (
    <div className="relative overflow-hidden rounded-xl shadow-xl bg-gray-900">
      {/* Main carousel with images */}
      <div className="relative h-[500px] md:h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <img
              src={images[currentIndex].url}
              alt={images[currentIndex].altText}
              className="w-full h-full object-cover"
            />

            {/* Optional caption */}
            {images[currentIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-4">
                <p className="text-lg font-medium">
                  {images[currentIndex].caption}
                </p>
              </div>
            )}

            {/* Dark gradient overlay to ensure navigation controls are visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevImage}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/80 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors z-10 text-2xl"
        aria-label="Previous image"
      >
        ←
      </button>
      <button
        onClick={nextImage}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/80 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors z-10 text-2xl"
        aria-label="Next image"
      >
        →
      </button>

      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => handleManualNavigation(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? "bg-white scale-110"
                : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
