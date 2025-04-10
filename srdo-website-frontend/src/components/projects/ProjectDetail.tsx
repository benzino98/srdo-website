import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApi } from "../../hooks/useApi";
import { Project, Partner, Impact } from "../../types/project";
import PlaceholderImage from "../common/PlaceholderImage";
import { projectApi } from "../../services/api";
import ImageWithFallback from "../common/ImageWithFallback";

// Helper for getting proper image URL
const getImageUrl = (
  imageUrl: string | null | undefined,
  projectTitle?: string
): string => {
  if (!imageUrl) {
    // Use keyword matching for fallback images if title exists
    if (projectTitle) {
      const titleLower = projectTitle.toLowerCase();
      if (titleLower.includes("farm") || titleLower.includes("agriculture")) {
        return "/images/projects/farming.jpg";
      } else if (
        titleLower.includes("water") ||
        titleLower.includes("sanitation")
      ) {
        return "/images/projects/clean-water.jpg";
      } else if (
        titleLower.includes("education") ||
        titleLower.includes("school")
      ) {
        return "/images/projects/education.jpg";
      }
    }
    // Default fallback if no title or no matches
    return "/images/projects/farming.jpg";
  }

  // If it's already a full URL, return it
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // Get base URL from environment or default
  const apiUrl =
    process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";
  const baseUrl = apiUrl.split("/api")[0];

  // Clean up the image URL
  const cleanImageUrl = imageUrl.replace(/([^:])\/+/g, "$1/");

  // If it's a local images path
  if (cleanImageUrl.startsWith("/images")) {
    return cleanImageUrl;
  }

  // Handle storage URLs
  if (
    cleanImageUrl.includes("storage/projects/") ||
    cleanImageUrl.includes("/storage/projects/")
  ) {
    const normalizedPath = cleanImageUrl.replace(/^\/+/, "");
    return `${baseUrl}/${normalizedPath}`;
  }

  // Default case: assume it's a storage URL
  return `${baseUrl}/storage/${cleanImageUrl}`;
};

// Format currency helper
const formatCurrency = (amount: number | null): string => {
  if (amount === null || amount === undefined) return "N/A";

  try {
    // Format with Intl.NumberFormat but with customized display for the Naira symbol
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);

    // Ensure the Naira symbol (₦) is displayed properly
    // Some browsers or font configurations might show NGN instead of ₦
    // This ensures consistent display of the Naira symbol
    return formattedAmount.replace("NGN", "₦").replace("₦ ", "₦");
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `₦${amount.toLocaleString()}`;
  }
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [imageError, setImageError] = useState(false);

  // Check if we're in development environment
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);

      try {
        if (id) {
          console.log(`Attempting to fetch project with ID: ${id}`);

          // Use the enhanced projectApi.getProjectDetail method
          const response = await projectApi.getProjectDetail(id);
          console.log("Project API response:", response);

          // Check the full response structure
          console.log("Full response object:", response);

          // Check if the data is nested differently
          let projectData;
          if (response.data && response.data.data) {
            // Handle case where data is nested one level deeper
            projectData = response.data.data;
            console.log(
              "Found project data in response.data.data:",
              projectData
            );
          } else if (response.data) {
            // Handle standard structure
            projectData = response.data;
            console.log("Found project data in response.data:", projectData);
          } else {
            console.error("No project data in response", response);
            throw new Error("No project data received from API");
          }

          // Log the content specifically to check if it exists
          console.log("Project content:", projectData.content);
          console.log("Project description:", projectData.description);

          setProject(projectData);
        } else {
          console.error("No project ID provided");
          throw new Error("Missing project ID");
        }
      } catch (err) {
        console.error("Failed to load project:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  // Improved loading state with simulated progress
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center max-w-md px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg mb-2">
            Loading project details...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-blue-600 h-2.5 rounded-full animate-pulse"
              style={{ width: "70%" }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            Fetching project information for ID: {id}
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-lg">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {error ? "Error Loading Project" : "Project Not Found"}
          </h1>
          <p className="text-gray-600 mb-2">
            {error
              ? "We couldn't load the project details. Please try again later."
              : "The project you're looking for doesn't exist or has been removed."}
          </p>
          {isDevelopment && (
            <div className="bg-gray-100 p-4 rounded my-4 text-left">
              <p className="text-sm font-bold text-red-600">
                Debug Information:
              </p>
              <p className="text-xs text-gray-700">Project ID: {id}</p>
              <p className="text-xs text-gray-700">
                Error: {error?.message || "Unknown error"}
              </p>
            </div>
          )}
          <Link
            to="/projects"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Browse Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Hero Section with Image */}
      <div className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={getImageUrl(project.image_url, project.title)}
            fallbackSrc="/images/projects/farming.jpg"
            alt={project.title || "Project Image"}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80"></div>
        </div>

        <div className="container mx-auto px-4 h-full flex items-end pb-16 relative z-10">
          <div className="max-w-4xl">
            <Link
              to="/projects"
              className="inline-flex items-center text-white/90 mb-6 hover:text-white transition-colors group"
            >
              <svg
                className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
              Back to Projects
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
            >
              {project.title || "Untitled Project"}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              {/* Date Badge - Now First */}
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white backdrop-blur-sm">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
                {project.start_date
                  ? new Date(project.start_date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                    })
                  : "Date unavailable"}
              </span>

              {/* Location Badge - Now Second */}
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white backdrop-blur-sm">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                {project.location || "Unknown Location"}
              </span>

              {/* Budget Badge - Now Third */}
              {project.budget !== null && project.budget !== undefined ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white backdrop-blur-sm">
                  <span>
                    <span className="text-black-400 font-medium">₦</span>
                    {formatCurrency(project.budget).replace("₦", "")}
                  </span>
                </span>
              ) : null}

              {/* Status Badge - Now Last */}
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white backdrop-blur-sm">
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    String(project.status).toLowerCase() === "ongoing"
                      ? "bg-blue-400"
                      : "bg-green-400"
                  }`}
                ></span>
                {project.status
                  ? typeof project.status === "string"
                    ? project.status.charAt(0).toUpperCase() +
                      project.status.slice(1)
                    : String(project.status)
                  : "Unknown"}
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              {/* Project Info */}
              <div className="flex flex-wrap justify-between items-center mb-8 border-b border-gray-100 pb-8">
                {project.manager ? (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xl mr-4">
                      {project.manager.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {project.manager}
                      </p>
                      <p className="text-sm text-gray-500">Project Manager</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xl mr-4">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Not Assigned</p>
                      <p className="text-sm text-gray-500">Project Manager</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-start mt-4 sm:mt-0">
                  <p className="text-sm text-gray-500">Timeline</p>
                  <p className="font-medium text-gray-700 mt-1">
                    {project.start_date && project.end_date
                      ? `${new Date(project.start_date).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )} to ${new Date(project.end_date).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}`
                      : project.start_date
                      ? `Started ${new Date(
                          project.start_date
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}`
                      : "Timeline not specified"}
                  </p>
                </div>
              </div>

              {/* Project Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  About This Project
                </h2>
                <div className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-blue-600">
                  {/* Always display the description as a lead paragraph if available */}
                  {project?.description ? (
                    <p className="font-medium text-lg mb-4">
                      {project.description}
                    </p>
                  ) : (
                    <p className="font-medium text-lg mb-4">
                      No description available.
                    </p>
                  )}

                  {/* Display the content only if it exists and is different from the description */}
                  {project?.content &&
                  project.content !== project.description ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: project.content }}
                    />
                  ) : (
                    /* Only show "no information" if there's no description either */
                    !project?.description && (
                      <p>No detailed information available for this project.</p>
                    )
                  )}
                </div>
              </motion.div>

              {/* Beneficiaries Section */}
              {project.beneficiaries ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="mb-12 p-6 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Project Beneficiaries
                      </h3>
                      <p className="text-xl font-bold text-blue-700">
                        {project.beneficiaries.toLocaleString()} people
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {/* Impact Section */}
              {project.impacts && project.impacts.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mb-12 pt-8 border-t border-gray-100"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Project Impact
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.impacts.map((impact, index) => (
                      <motion.div
                        key={impact.id || `impact-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="text-3xl font-bold text-green-600 mb-3">
                          {impact.value || 0}{" "}
                          <span className="text-green-500 text-xl font-medium">
                            {impact.unit || ""}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {impact.title || "Impact"}
                        </h3>
                        <p className="text-gray-600">
                          {impact.description || ""}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {/* Partners Section */}
              {project.partners && project.partners.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="mb-12 pt-8 border-t border-gray-100"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Project Partners
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {project.partners.map((partner, index) => (
                      <motion.div
                        key={partner.id || `partner-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="flex flex-col items-center text-center group"
                      >
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:shadow-md transition-shadow border border-gray-200">
                          {partner.logo_url ? (
                            <img
                              src={partner.logo_url}
                              alt={partner.name || "Partner"}
                              className="max-w-[80%] max-h-[80%] object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                                const parent = (e.target as HTMLImageElement)
                                  .parentElement;
                                if (parent) {
                                  const placeholder =
                                    document.createElement("div");
                                  placeholder.className =
                                    "text-2xl font-bold text-gray-400";
                                  placeholder.textContent =
                                    typeof partner.name === "string" &&
                                    partner.name.length > 0
                                      ? partner.name.charAt(0)
                                      : "P";
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-2xl font-bold text-gray-400">
                              {typeof partner.name === "string" &&
                              partner.name.length > 0
                                ? partner.name.charAt(0)
                                : "P"}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                          {partner.name || "Partner"}
                        </h3>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link
              to="/projects"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent rounded-full text-base font-medium text-white bg-green-600 hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              Explore More Projects
              <svg
                className="ml-2 -mr-1 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                ></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
