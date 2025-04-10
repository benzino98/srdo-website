import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...handlers);

// Ensure clean server shutdown
process.on("SIGTERM", () => {
  server.close();
});
