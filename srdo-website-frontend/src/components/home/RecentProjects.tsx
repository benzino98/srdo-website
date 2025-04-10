import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useApi } from "../../hooks/useApi";

interface Project {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  status: string;
  location: string;
}

// Function to ensure proper image URL format
const getImageUrl = (
  imageUrl: string | null | undefined,
  projectTitle: string
): string => {
  if (!imageUrl) {
    // Use keyword matching to determine the appropriate image
    const titleLower = projectTitle.toLowerCase();
    if (
      titleLower.includes("farm") ||
      titleLower.includes("agriculture") ||
      titleLower.includes("sustainable")
    ) {
      return "/images/projects/clean-water.jpg";
    } else if (titleLower.includes("water") || titleLower.includes("clean")) {
      return "/images/projects/farming.jpg";
    } else if (
      titleLower.includes("education") ||
      titleLower.includes("school") ||
      titleLower.includes("learning") ||
      titleLower.includes("technology")
    ) {
      return "/images/projects/education.jpg";
    }

    // Default fallback
    return "/images/projects/farming.jpg";
  }

  // If it's already a full URL, return it as is
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // For storage URLs, ensure we're using the correct base URL
  const baseUrl =
    process.env.REACT_APP_API_URL?.replace("/api/v1", "") ||
    "http://localhost:8000";

  // If the URL starts with /storage, it's an uploaded file
  if (imageUrl.startsWith("/storage/")) {
    return `${baseUrl}${imageUrl}`;
  }

  // If it starts with storage/ without leading slash
  if (imageUrl.startsWith("storage/")) {
    return `${baseUrl}/${imageUrl}`;
  }

  // If it's a relative URL starting with /
  if (imageUrl.startsWith("/")) {
    return `${baseUrl}${imageUrl}`;
  }

  // If it's just a filename, assume it's in the storage folder
  return `${baseUrl}/storage/${imageUrl}`;
};

const RecentProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get, error: apiError } = useApi<any>();

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use useApi hook for better error handling and consistency
        const response = await get("/projects", {
          params: {
            per_page: 3, // Use per_page instead of limit to match backend pagination
            sort: "start_date", // Match the backend which sorts by start_date
            order: "desc",
          },
        });

        // Handle different response formats
        let projectData = [];
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            projectData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            projectData = response.data.data;
          } else if (typeof response.data === "object") {
            // Extract projects from object with numeric keys or data property
            projectData = Object.keys(response.data)
              .filter((key) => !isNaN(Number(key)) || key === "data")
              .map((key) => response.data[key])
              .flat()
              .filter((item) => item && typeof item === "object");
          }
        }

        if (projectData.length > 0) {
          setProjects(projectData);
        } else {
          throw new Error("No projects found");
        }
      } catch (err) {
        setError("Failed to load recent projects");
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [get]);

  if (isLoading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || projects.length === 0) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Recent Projects</h2>
            <p className="text-gray-600 mb-8">
              {error || "No recent projects available at the moment."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure projects is always an array before rendering
  const projectsToRender = Array.isArray(projects) ? projects : [];

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2
            className="text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Our Recent Projects
          </motion.h2>
          <motion.p
            className="text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Making a positive impact through sustainable development initiatives
            across the region.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projectsToRender.map((project, index) => (
            <motion.div
              key={project.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={getImageUrl(project.image_url, project.title)}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  onError={(e) => {
                    console.log(
                      `Image failed to load for project "${project.title}", using local image`
                    );
                    const target = e.target as HTMLImageElement;
                    target.src = getImageUrl(null, project.title);
                    // Prevent infinite error loop
                    target.onerror = null;
                  }}
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold">{project.title}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      project.status === "ongoing"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {project.status.charAt(0).toUpperCase() +
                      project.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {project.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {project.location}
                  </span>
                  <Link
                    to={`/project/${project.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link
              to="/projects"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              View All Projects
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RecentProjects;
