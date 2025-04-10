import React from "react";
import ResourceList from "../components/resources/ResourceList";
import { motion } from "framer-motion";

const ResourcesPage: React.FC = () => {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Resources</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Access our collection of free resources, publications, tools, and
            materials to support sustainable development work.
          </p>
        </motion.div>

        <ResourceList />
      </div>
    </div>
  );
};

export default ResourcesPage;
