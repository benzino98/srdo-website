import React, { useState } from "react";
import { motion } from "framer-motion";

// Define the share/download functionality
const sharableLocation =
  "https://goo.gl/maps/srdo-headquarters-plateau-state-nigeria";

const Map: React.FC = () => {
  const [showDirections, setShowDirections] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "directions" | "transport" | "landmarks"
  >("directions");
  const [shareTooltip, setShareTooltip] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "SRDO Headquarters Location",
          text: "Visit us at SRDO Headquarters, Jos, Plateau State, Nigeria",
          url: sharableLocation,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback for browsers that don't support the Share API
        navigator.clipboard.writeText(sharableLocation);
        setShareTooltip(true);
        setTimeout(() => setShareTooltip(false), 3000);
      }
    } catch (error) {
      console.error("Error sharing location:", error);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-3xl font-bold text-gray-800">Find Our Office</h2>
        <div className="relative">
          <button
            onClick={handleShare}
            className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-2 rounded text-sm font-medium text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>Share Location</span>
          </button>
          {shareTooltip && (
            <div className="absolute right-0 mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
              Location copied to clipboard!
            </div>
          )}
          {shareSuccess && (
            <div className="absolute right-0 mt-2 bg-green-700 text-white text-xs px-2 py-1 rounded">
              Location shared successfully!
            </div>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-96 bg-gray-200 rounded-lg overflow-hidden shadow-lg relative"
      >
        <iframe
          title="SRDO Headquarters Location"
          className="w-full h-full"
          style={{ border: 0 }}
          src={`https://www.google.com/maps/embed/v1/place?key=${
            process.env.REACT_APP_GOOGLE_MAPS_API_KEY
          }&q=SRDO+Headquarters,Jos,Plateau+State,Nigeria${
            showDirections ? "&mode=driving" : ""
          }`}
          allowFullScreen
        ></iframe>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-white p-4 shadow-md absolute bottom-0 left-0 m-3 rounded-lg max-w-xs"
        >
          <div className="flex items-start">
            <div className="mr-3 mt-1 flex-shrink-0">
              <div className="bg-green-700 h-6 w-6 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                SRDO Headquarters
              </h3>
              <p className="text-gray-600 mt-1">
                Jos, Plateau State
                <br />
                Nigeria
              </p>
            </div>
          </div>

          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => setShowDirections(!showDirections)}
              className="text-sm px-3 py-1 bg-green-700 text-white rounded hover:bg-green-600 transition-colors flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              {showDirections ? "Hide Directions" : "Get Directions"}
            </button>
            <a
              href="tel:+234XXXXXXXXXX"
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Call Us
            </a>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=SRDO+Headquarters,Jos,Plateau+State,Nigeria`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 hover:text-green-800 text-sm flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Get directions in Google Maps
            </a>
          </div>
        </motion.div>
      </motion.div>

      <div className="mt-6 bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          Contact Information
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-700">Office Hours</h3>
            <p className="text-gray-600 mt-1">
              Monday - Friday: 8:00 AM - 5:00 PM
              <br />
              Saturday - Sunday: Closed
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Contact Details</h3>
            <p className="text-gray-600 mt-1">
              Phone: +234-701-944-2172
              <br />
              Email: info@srdo.org
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-5 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Find Us</h2>

        <div className="border-b border-gray-200 mb-4">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("directions")}
              className={`mr-8 py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === "directions"
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Directions
            </button>
            <button
              onClick={() => setActiveTab("transport")}
              className={`mr-8 py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === "transport"
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Public Transport
            </button>
            <button
              onClick={() => setActiveTab("landmarks")}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === "landmarks"
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Nearby Landmarks
            </button>
          </nav>
        </div>

        <div className="mt-4">
          {activeTab === "directions" && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                How to Reach Us
              </h3>
              <div className="space-y-3 text-gray-600">
                <p>
                  <span className="font-medium">From the Airport:</span> The
                  SRDO Headquarters is approximately 25 minutes by car from the
                  Heipang Airport. You can take a taxi or schedule an airport
                  shuttle.
                </p>
                <p>
                  <span className="font-medium">By Car:</span> We're located in
                  Rayfield, Old Government House, Unit 16.
                </p>
                <p>
                  <span className="font-medium">GPS Coordinates:</span> 12.3456°
                  N, 78.9012° E
                </p>
              </div>
            </div>
          )}

          {activeTab === "transport" && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Public Transportation Options
              </h3>
              <div className="space-y-3 text-gray-600">
                <p>
                  <span className="font-medium">Metro:</span> The nearest
                  station is "Bukuru", which is a 10-minute drive from the
                  airport.
                </p>
                <p>
                  <span className="font-medium">Taxi/Ride-sharing:</span> Taxis
                  and ride-sharing services are readily available throughout the
                  city and can drop you directly at our office.
                </p>
              </div>
            </div>
          )}

          {activeTab === "landmarks" && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Nearby Landmarks
              </h3>
              <div className="space-y-3 text-gray-600">
                <p>
                  <span className="font-medium">
                    Old Government House Rayfield:
                  </span>{" "}
                  Located directly after faveih Junction.
                </p>
                <p>
                  <span className="font-medium">NTA College:</span> By the right
                  coming from the Old Government House Junction.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;
