import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../contexts/AuthContext";
import LoginPage from "../LoginPage";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";

// Wrap component with necessary providers
const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe("LoginPage", () => {
  test("renders login form", () => {
    renderLoginPage();

    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  test("shows error message on invalid credentials", async () => {
    // Mock failed login attempt
    server.use(
      http.post("/api/v1/auth/login", () => {
        return new HttpResponse(null, {
          status: 401,
          statusText: "Unauthorized",
        });
      })
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test("successfully logs in with valid credentials", async () => {
    // Mock successful login attempt
    server.use(
      http.post("/api/v1/auth/login", () => {
        return HttpResponse.json({
          user: {
            id: 1,
            name: "Test User",
            email: "test@example.com",
            role: "admin",
          },
          token: "fake-jwt-token",
        });
      })
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      // Should be redirected to dashboard
      expect(window.location.pathname).toBe("/admin/dashboard");
    });
  });
});
