import React from "react";
import { Link } from "react-router-dom";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  actionButton,
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-2">
        <Link
          to="/admin"
          className="mr-4 inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="ml-1 text-sm font-medium">Back to Dashboard</span>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-gray-600 mt-2">{description}</p>}
        </div>

        {actionButton && <div>{actionButton}</div>}
      </div>
    </div>
  );
};

export default AdminPageHeader;
