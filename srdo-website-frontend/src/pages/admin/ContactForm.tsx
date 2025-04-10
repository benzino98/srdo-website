import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { Contact } from "../../services/contactService";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

const ContactForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { get, put } = useApi<any>();

  const [formData, setFormData] = useState<Partial<Contact>>({
    name: "",
    email: "",
    subject: "",
    message: "",
    read: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch contact data when component mounts
  useEffect(() => {
    if (id) {
      fetchContact();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchContact = async () => {
    if (!id) {
      setError("Contact ID is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Use the correct API endpoint
      const response = await get(`/contacts/${id}`);

      if (response && response.data) {
        // Handle different response formats
        if (typeof response.data === "object" && response.data.id) {
          // Direct object response

          setFormData(response.data);
        } else if (
          response.data.data &&
          typeof response.data.data === "object"
        ) {
          // Nested data property (Laravel API format)

          setFormData(response.data.data);
        } else {
          console.warn("Unrecognized data format:", response.data);
          setError("Invalid contact data format");
        }
      } else {
        console.warn("No data in response:", response);
        setError("Contact not found");
      }
    } catch (err) {
      console.error("Failed to fetch contact:", err);
      setError("Failed to load contact message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Handle checkbox inputs
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Update via API
      await put(`/contacts/${id}`, formData);
      setSuccess("Contact message updated successfully");

      // Navigate back to contact list after a short delay
      setTimeout(() => {
        navigate("/admin/contacts");
      }, 1500);
    } catch (err: any) {
      console.error("Error updating contact:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update contact message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <AdminPageHeader
          title="Edit Contact Message"
          description="View and update contact message details"
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="id"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message ID
                  </label>
                  <input
                    type="text"
                    id="id"
                    value={formData.id || ""}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="created_at"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Received Date
                  </label>
                  <input
                    type="text"
                    id="created_at"
                    value={formatDate(formData.created_at)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message || ""}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>

              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="read"
                    name="read"
                    checked={formData.read || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="read"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Mark as read
                  </label>
                </div>
                {formData.read && formData.read_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Read on: {formatDate(formData.read_at)}
                  </p>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded-md text-white font-medium ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/contacts")}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactForm;
