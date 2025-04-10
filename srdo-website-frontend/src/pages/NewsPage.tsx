import React, { useEffect } from "react";
import NewsList from "../components/news/NewsList";
import { motion } from "framer-motion";

const NewsPage: React.FC = () => {
  useEffect(() => {}, []);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 relative inline-block">
            Latest News
            <div className="absolute bottom-0 left-1/2 w-16 h-1 bg-green-600 transform -translate-x-1/2 mt-2"></div>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Stay updated with the latest news, projects, and events from SRDO
            and our partners around the world. Discover how we're making a
            difference in communities globally.
          </p>
        </motion.div>

        <NewsList />
      </div>
    </div>
  );
};

export default NewsPage;
