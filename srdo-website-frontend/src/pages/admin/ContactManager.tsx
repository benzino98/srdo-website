import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { Contact } from "../../services/contactService";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

const ContactManager: React.FC = () => {
  const { get, put } = useApi<any>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Pagination state - always use exactly 5 items per page
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 5;

  // Reference to track the latest page requested
  const latestPageRef = useRef(1);
  // Store all contacts to handle pagination locally
  const [allContactsCache, setAllContactsCache] = useState<Contact[]>([]);

  // Fetch contacts when component mounts or filter changes
  useEffect(() => {
    fetchContacts();
    // Reset to page 1 when filter changes
    setCurrentPage(1);
    latestPageRef.current = 1;
  }, [filter]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    // Force loading state to provide feedback to the user
    setLoading(true);
    // Update our ref immediately to track the latest request
    latestPageRef.current = page;
    // Update the page state
    setCurrentPage(page);

    // Apply pagination with current filter
    const filtered = getFilteredContacts(allContactsCache);
    handleClientPagination(filtered, page);

    // Short timeout to simulate loading for better UX
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);

      // Update endpoint to match the backend API routes
      // The API service baseURL already includes /api/v1, so we don't need to prefix with /api
      const response = await get("/contacts", {
        params: {
          status: filter === "all" ? undefined : filter,
          per_page: 100, // Get more contacts at once to reduce API calls
        },
      });

      let allContacts: Contact[] = [];

      // Check if the response itself is the contacts array
      if (Array.isArray(response)) {
        allContacts = response;
      } else if (response && response.data) {
        // Handle different response structures
        if (Array.isArray(response.data)) {
          allContacts = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // This handles the pagination format returned by Laravel
          allContacts = response.data.data;
        } else if (
          typeof response.data === "object" &&
          !Array.isArray(response.data)
        ) {
          // Extract values if it's an object but not in the expected format
          allContacts = Object.values(response.data);
        }
      }

      if (allContacts.length > 0) {
        // Store all contacts in our cache
        setAllContactsCache(allContacts);

        // Get contacts filtered by the current filter
        const filteredContacts = getFilteredContacts(allContacts);

        // Calculate total pages
        const totalFilteredCount = filteredContacts.length;
        const calculatedTotalPages = Math.ceil(totalFilteredCount / perPage);

        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
        setTotalItems(totalFilteredCount);

        // Apply pagination on client side
        handleClientPagination(filteredContacts, currentPage);
        setError(null);
      } else {
        console.warn("No contacts found in response data");
        setContacts([]);
        setAllContactsCache([]);
        setTotalPages(1);
        setTotalItems(0);
        setError("No contacts found");
      }
    } catch (err: any) {
      console.error("Failed to fetch contacts:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load contacts. Please try again later."
      );
      setContacts([]);
      setAllContactsCache([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle client-side pagination
  const handleClientPagination = (
    filteredContacts: Contact[],
    pageNumber: number
  ) => {
    // Calculate correct slicing based on current page
    const startIndex = (pageNumber - 1) * perPage;
    const totalItems = filteredContacts.length;

    // Make sure we don't go past the end of the array
    if (startIndex < filteredContacts.length) {
      const paginatedContacts = filteredContacts.slice(
        startIndex,
        Math.min(startIndex + perPage, filteredContacts.length)
      );

      setContacts(paginatedContacts);
    } else if (filteredContacts.length > 0) {
      // If somehow the start index is beyond the array length, go to last page
      const lastPageNumber = Math.ceil(filteredContacts.length / perPage);

      const lastPageStartIndex = (lastPageNumber - 1) * perPage;
      setCurrentPage(lastPageNumber);
      latestPageRef.current = lastPageNumber;

      const lastPageContacts = filteredContacts.slice(
        lastPageStartIndex,
        filteredContacts.length
      );
      setContacts(lastPageContacts);
    } else {
      // No contacts at all

      setContacts([]);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      // Use the correct API endpoint without v1 prefix
      const response = await put(`/contacts/${id}/read`);

      // Update both the displayed contacts and the cached contacts
      const updateContact = (contact: Contact) =>
        contact.id === id
          ? { ...contact, read: true, read_at: new Date().toISOString() }
          : contact;

      // Update displayed contacts
      setContacts((prev) => prev.map(updateContact));

      // Update cache
      setAllContactsCache((prev) => prev.map(updateContact));

      setError(null);
    } catch (err: any) {
      console.error("Failed to mark contact as read:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to mark message as read. Please try again."
      );
    }
  };

  // Format date in a readable way
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

  // Get filtered contacts for display
  const getFilteredContacts = (contactsToFilter = allContactsCache) => {
    if (!contactsToFilter || contactsToFilter.length === 0) return [];

    switch (filter) {
      case "read":
        return contactsToFilter.filter((contact) => contact.read);
      case "unread":
        return contactsToFilter.filter((contact) => !contact.read);
      default:
        return contactsToFilter;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <AdminPageHeader
          title="Contact Messages"
          description="View and manage messages from website visitors"
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                All Messages
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === "unread"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter("read")}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === "read"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                Read
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filter === "all"
                ? "No messages found."
                : filter === "unread"
                ? "No unread messages."
                : "No read messages."}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <li
                    key={contact.id}
                    className={`hover:bg-gray-50 transition duration-150 ${
                      !contact.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="px-6 py-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h3 className="text-base font-medium text-blue-600 truncate">
                              {contact.name || "Unknown Sender"}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {formatDate(contact.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600 truncate">
                            {contact.email || "No email provided"}
                          </p>
                          {contact.subject && (
                            <p className="mt-2 text-sm font-medium">
                              Subject: {contact.subject}
                            </p>
                          )}
                          <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">
                            {contact.message || "No message content"}
                          </div>
                        </div>

                        <div className="ml-6 flex-shrink-0">
                          <div className="flex flex-col space-y-2">
                            {!contact.read && (
                              <button
                                onClick={() => handleMarkAsRead(contact.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                Mark as Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center text-xs text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full ${
                            contact.read
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {contact.read ? "Read" : "Unread"}
                        </span>
                        {contact.read_at && (
                          <span className="ml-2">
                            Read at: {formatDate(contact.read_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page{" "}
                        <span className="font-medium">{currentPage}</span> of{" "}
                        <span className="font-medium">{totalPages}</span> pages
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log(
                            "Previous button clicked. Current page:",
                            currentPage
                          );
                          const prevPage = Math.max(1, currentPage - 1);
                          console.log("Going to previous page:", prevPage);
                          handlePageChange(prevPage);
                        }}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 border rounded-md text-sm font-medium ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => {
                          console.log(
                            "Next button clicked. Current page:",
                            currentPage,
                            "Total pages:",
                            totalPages
                          );
                          const nextPage = Math.min(
                            totalPages,
                            currentPage + 1
                          );
                          console.log("Going to next page:", nextPage);
                          handlePageChange(nextPage);
                        }}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 border rounded-md text-sm font-medium ${
                          currentPage === totalPages
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactManager;
