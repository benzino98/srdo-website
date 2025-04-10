import React from "react";

interface ResourceCardProps {
  title: string;
  description: string;
  category: string;
  fileType: string;
  fileSize: number | string;
  icon: React.ReactNode;
  downloadCount: number;
  onDownload: () => void;
  isDownloading?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  title,
  description,
  category,
  fileType,
  fileSize,
  icon,
  downloadCount,
  onDownload,
  isDownloading = false,
}) => {
  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Format file size to human readable format
  const formatFileSize = (bytes: number | string): string => {
    if (typeof bytes === "string") {
      return bytes; // If it's already a formatted string, return as is
    }

    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${size} ${sizes[i]}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start">
          <div className="text-3xl mr-4">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 text-sm mb-4">{description}</p>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className={`inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-full text-sm font-medium text-white ${
                isDownloading
                  ? "bg-green-500 cursor-wait"
                  : "bg-green-600 hover:bg-green-700"
              } transition-all shadow-md hover:shadow-lg`}
            >
              {isDownloading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    ></path>
                  </svg>
                  Download ({formatFileSize(fileSize)})
                </>
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
          <span>{category}</span>
          <div className="flex items-center space-x-2">
            <span>•</span>
            <span className="ml-2">
              {formatNumber(downloadCount || 0)} downloads
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
