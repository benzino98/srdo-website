import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Testimonial {
  id: number;
  quote: string;
  priority: string;
  role: string;
  image: string;
}

const Testimonials: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      quote:
        "We are dedicated to fostering sustainable economic growth, boosting internally generated revenue, and ensuring long-term financial stability in Plateau State. Through strategic planning, prudent resource management, and forward-thinking development initiatives, we are building a prosperous and inclusive future for every citizen.",
      priority: "Economic Rebirth",
      role: "Community Leader",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      quote:
        "We are committed to building sustainable and resilient infrastructure that will stand the test of time. Our holistic approach covers road networks, water systems, urban development, and environmental sustainability — all aimed at creating a modern, functional, and livable Plateau State for present and future generations.",
      priority: "Physical Infrastructure Development",
      role: "School Principal",
      image: "https://via.placeholder.com/150",
    },
    {
      id: 3,
      quote:
        "We are dedicated to fostering peace, strengthening security, and advancing good governance across Plateau State. Through a coordinated approach involving law enforcement, the judiciary, local governance, and social services, we aim to build a safe, just, and thriving society for all.",
      priority: "Peace, Security and Good Governance",
      role: "Partner Organization Director",
      image: "https://via.placeholder.com/150",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalId = useRef<number | null>(null);
  const TRANSITION_INTERVAL = 5000; // 5 seconds between auto transitions

  const nextTestimonial = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevTestimonial = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length
    );
  };

  // Set up auto-transition timer
  useEffect(() => {
    // Clear any existing interval when component mounts or dependencies change
    if (intervalId.current) {
      window.clearInterval(intervalId.current);
    }

    // Only set up the interval if not paused
    if (!isPaused) {
      intervalId.current = window.setInterval(() => {
        nextTestimonial();
      }, TRANSITION_INTERVAL);
    }

    // Clean up interval on component unmount
    return () => {
      if (intervalId.current) {
        window.clearInterval(intervalId.current);
      }
    };
  }, [isPaused, nextTestimonial]);

  // Pause auto-transition when user hovers over testimonial
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  // Resume auto-transition when user leaves testimonial
  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div className="bg-blue-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Key Strategic Priorities of the Governor
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            The Plateau State Strategic Development Framework (PSPDF 2023 -
            2027) is a comprehensive plan that outlines the Governor's vision
            for the state's development.
          </p>
        </div>

        <div
          className="max-w-4xl mx-auto relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-8 text-center"
            >
              {/* <div className="mb-6">
                <img
                  src={testimonials[currentIndex].image}
                  alt={testimonials[currentIndex].author}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-blue-100"
                />
              </div> */}
              <blockquote className="text-xl italic text-gray-700 mb-6">
                {testimonials[currentIndex].quote}
              </blockquote>
              <div>
                <p className="font-bold text-lg">
                  {testimonials[currentIndex].priority}
                </p>
                {/* <p className="text-blue-600">
                  {testimonials[currentIndex].role}
                </p> */}
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={() => {
              prevTestimonial();
              setIsPaused(true);
              setTimeout(() => setIsPaused(false), 10000); // Resume auto-transition after 10 seconds
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
          >
            ←
          </button>
          <button
            onClick={() => {
              nextTestimonial();
              setIsPaused(true);
              setTimeout(() => setIsPaused(false), 10000); // Resume auto-transition after 10 seconds
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
          >
            →
          </button>
        </div>

        <div className="flex justify-center mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsPaused(true);
                setTimeout(() => setIsPaused(false), 10000); // Resume auto-transition after 10 seconds
              }}
              className={`w-3 h-3 mx-1 rounded-full ${
                index === currentIndex ? "bg-blue-600" : "bg-blue-200"
              }`}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
