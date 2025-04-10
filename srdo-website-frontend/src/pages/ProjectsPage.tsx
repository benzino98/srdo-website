import React from "react";
import ProjectList from "../components/projects/ProjectList";
import { motion } from "framer-motion";

const ProjectsPage: React.FC = () => {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Our Projects</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our ongoing and completed projects that are making a
            difference in communities around the world.
          </p>
        </motion.div>

        <ProjectList />
      </div>
    </div>
  );
};

export default ProjectsPage;
