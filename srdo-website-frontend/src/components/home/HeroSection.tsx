import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  return (
    <div
      className="relative text-white py-16 px-4 md:py-24 md:px-6 lg:py-32 lg:px-8 rounded-xl overflow-hidden"
      style={{
        backgroundImage: "url('/images/backgrounds/heroBackground.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "550px",
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black to-transparent opacity-70"></div>

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white drop-shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Welcome to The Executive Governor's Strategy and Results Delivery
            Office (SRDO)
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl mb-10 text-white text-opacity-90 drop-shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            "We shall work round the clock to provide the quality of leadership
            and governance our beautiful citizens deserve."
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link
                to="/projects"
                className="bg-green-700 text-white font-semibold px-8 py-4 rounded-lg shadow-md hover:bg-green-600 transition-colors inline-block"
              >
                Our Projects
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link
                to="/contact"
                className="border-2 border-white text-white font-semibold px-8 py-4 rounded-lg shadow-md bg-transparent hover:bg-green-600 hover:border-green-600 transition-colors inline-block"
              >
                Get Involved
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      {/* <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 1.5,
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          repeatDelay: 0.2,
        }}
      >
        <div className="w-8 h-12 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
        <p className="text-white text-xs mt-2 text-center font-medium">
          Scroll Down
        </p>
      </motion.div> */}
    </div>
  );
};

export default HeroSection;
