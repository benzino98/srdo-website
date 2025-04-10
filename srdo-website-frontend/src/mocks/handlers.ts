import { http, HttpResponse } from "msw";
import type { StrictRequest, ResponseResolver } from "msw";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

export const handlers = [
  // Auth handlers
  http.post(`${API_URL}/auth/login`, () => {
    return HttpResponse.json({
      user: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "admin",
      },
      token: "fake-jwt-token",
    });
  }),

  // Projects handlers
  http.get(`${API_URL}/projects`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          title: "Test Project",
          description: "A test project",
          status: "published",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ],
    });
  }),

  // Resources handlers
  http.get(`${API_URL}/resources`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          title: "Test Resource",
          description: "A test resource",
          file_url: "/test.pdf",
          file_type: "pdf",
          file_size: 1024,
          category: "Reports",
          downloads_count: 0,
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ],
      meta: { current_page: 1, last_page: 1, total: 1 },
    });
  }),

  // News handlers
  http.get(`${API_URL}/news`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          title: "Test News",
          content: "Test news content",
          status: "published",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
      ],
    });
  }),

  // Contacts handlers
  http.get(`${API_URL}/contacts`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          name: "Test Contact",
          email: "contact@example.com",
          subject: "Test Subject",
          message: "Test message",
          read: false,
          created_at: "2024-01-01T00:00:00.000Z",
        },
      ],
    });
  }),
];
