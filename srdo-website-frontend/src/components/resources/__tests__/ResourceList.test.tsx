import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ResourceList from "../ResourceList";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";

const mockResources = {
  data: [
    {
      id: 1,
      title: "Annual Report 2023",
      description: "Our annual report for the year 2023",
      file_url: "/storage/resources/annual-report-2023.pdf",
      file_type: "pdf",
      file_size: 1024 * 1024, // 1MB
      category: "Reports",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      download_count: 112,
    },
    {
      id: 2,
      title: "Project Guidelines",
      description: "Guidelines for project implementation",
      file_url: "/storage/resources/guidelines.pdf",
      file_type: "pdf",
      file_size: 512 * 1024, // 512KB
      category: "Guides",
      created_at: "2024-01-02T00:00:00.000Z",
      updated_at: "2024-01-02T00:00:00.000Z",
      download_count: 5,
    },
  ],
  meta: {
    current_page: 1,
    last_page: 1,
    total: 2,
  },
};

describe("ResourceList", () => {
  beforeEach(() => {
    // Set up default mock response
    server.use(
      http.get("/api/v1/resources", () => {
        return HttpResponse.json(mockResources);
      })
    );
  });

  test("renders resource list with data", async () => {
    render(
      <BrowserRouter>
        <ResourceList />
      </BrowserRouter>
    );

    // Wait for resources to load
    await waitFor(() => {
      expect(screen.getByText("Annual Report 2023")).toBeInTheDocument();
      expect(screen.getByText("Project Guidelines")).toBeInTheDocument();
    });

    // Check if file sizes are formatted correctly
    expect(screen.getByText("1.0 MB")).toBeInTheDocument();
    expect(screen.getByText("512.0 KB")).toBeInTheDocument();
  });

  test("filters resources by category", async () => {
    server.use(
      http.get("/api/v1/resources", ({ request }) => {
        const url = new URL(request.url);
        const category = url.searchParams.get("category");

        if (category === "Reports") {
          return HttpResponse.json({
            data: [mockResources.data[0]],
            meta: { current_page: 1, last_page: 1, total: 1 },
          });
        }
        return HttpResponse.json(mockResources);
      })
    );

    render(
      <BrowserRouter>
        <ResourceList initialCategory="Reports" />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Annual Report 2023")).toBeInTheDocument();
      expect(screen.queryByText("Project Guidelines")).not.toBeInTheDocument();
    });
  });

  test("handles search functionality", async () => {
    server.use(
      http.get("/api/v1/resources", ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search");

        if (search === "guidelines") {
          return HttpResponse.json({
            data: [mockResources.data[1]],
            meta: { current_page: 1, last_page: 1, total: 1 },
          });
        }
        return HttpResponse.json(mockResources);
      })
    );

    render(
      <BrowserRouter>
        <ResourceList />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search resources/i);
    fireEvent.change(searchInput, { target: { value: "guidelines" } });
    fireEvent.submit(searchInput.closest("form")!);

    await waitFor(() => {
      expect(screen.queryByText("Annual Report 2023")).not.toBeInTheDocument();
      expect(screen.getByText("Project Guidelines")).toBeInTheDocument();
    });
  });

  test("handles download functionality", async () => {
    const mockDownloadUrl = "http://example.com/download/resource/1";
    server.use(
      http.get("/api/v1/resources/1/download", () => {
        return HttpResponse.json({ download_url: mockDownloadUrl });
      })
    );

    // Mock window.open
    const mockOpen = jest.fn();
    window.open = mockOpen;

    render(
      <BrowserRouter>
        <ResourceList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Annual Report 2023")).toBeInTheDocument();
    });

    const downloadButton = screen.getAllByText(/download/i)[0];
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith(mockDownloadUrl, "_blank");
    });
  });
});
