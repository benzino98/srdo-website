/**
 * This is a simple test script to verify image URLs
 */

// Function to test image URLs
function getImageUrl(imageUrl) {
  if (!imageUrl) {
    return "/images/news/placeholder.jpg";
  }

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // Extract base URL
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
  const baseUrl = apiUrl.replace(/\/api.*$/, "");

  // Process path
  let path = imageUrl;
  path = path.replace(/^\/+/, "");

  if (!path.includes("storage/")) {
    path = `storage/${path}`;
  }

  // Final URL
  return `${baseUrl}/${path}`;
}

// Test cases
const testUrls = [
  "/storage/news/test-2025-03-24-192422.jpg",
  "storage/news/test2-2025-03-24-192712.jpg",
  "/news/test3-2025-03-24-193445.jpg",
  "test-image.jpg",
];

// Run tests
testUrls.forEach((url) => {
  // Test with localhost fetch (Node.js only)
  if (typeof fetch === "function") {
    fetch(getImageUrl(url), { method: "HEAD" });
  }
});

// Test direct access to storage
const directUrl =
  "http://localhost:8000/storage/news/test-2025-03-24-192422.jpg";
