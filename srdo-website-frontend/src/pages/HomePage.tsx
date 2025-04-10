import React from "react";
import HeroSection from "../components/home/HeroSection";
import FeatureCards from "../components/home/FeatureCards";
import Testimonials from "../components/home/Testimonials";
import ImageCarousel from "../components/home/ImageCarousel";
import RecentProjects from "../components/home/RecentProjects";
import CallToAction from "../components/home/CallToAction";

const HomePage: React.FC = () => {
  // All carousel images from the public/images/carousel directory
  const carouselImages = [
    {
      url: "/images/carousel/image1.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image2.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image3.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image4.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image5.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image6.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image7.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image8.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image9.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image10.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image11.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image12.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image13.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image14.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image15.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image16.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
    {
      url: "/images/carousel/image17.jpeg",
      caption: "The unveiling of the Digital Performance Scorecard System",
      altText: "The SRDO Team with partners",
    },
  ];

  // Wrap components in error boundaries to prevent the entire page from crashing
  const renderSafely = (
    Component: React.ReactNode,
    fallback: React.ReactNode = null
  ) => {
    try {
      return Component;
    } catch (error) {
      console.error("Error rendering component:", error);
      return fallback;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section Container with refined light ash/off-white background */}
      {renderSafely(
        <div
          style={{
            backgroundColor: "#f5f5f5",
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23e6e6e6" fill-opacity="0.4" fill-rule="evenodd"%3E%3Ccircle cx="3" cy="3" r="1"%3E%3C/circle%3E%3Ccircle cx="13" cy="13" r="1"%3E%3C/circle%3E%3C/g%3E%3C/svg%3E\')',
          }}
        >
          <div className="container mx-auto px-6 pt-12 pb-6">
            <HeroSection />
          </div>
        </div>
      )}

      {/* Feature Cards Section */}
      {renderSafely(<FeatureCards />)}

      {/* Image Carousel Section */}
      {renderSafely(
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">The Lunch</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                The unveiling of the Digitial Peroformance Scorecard System by
                His Excellency the Governor of Plateau State, Barr. Caleb
                Manasseh Mutfwang at the SRDO's office in Jos, Plateau State,
                Nigeria.
              </p>
            </div>
            <div className="max-w-5xl mx-auto">
              <ImageCarousel images={carouselImages} autoPlayInterval={6000} />
            </div>
          </div>
        </div>
      )}

      {/* Recent Projects Section */}
      {renderSafely(<RecentProjects />)}

      {/* Impact Statistics Section - Enhanced with animations */}
      {renderSafely(
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Impact</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Since inception, we’ve driven innovation, transparency, and
                results across Plateau State through strategic coordination and
                project delivery.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center max-w-5xl mx-auto">
              <div className="p-6 bg-blue-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-5xl font-bold text-blue-600 mb-3">
                  150+
                </div>
                <div className="text-lg text-gray-700">
                  Policies & Projects Monitored
                </div>
              </div>
              <div className="p-6 bg-green-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-5xl font-bold text-green-600 mb-3">
                  96+
                </div>
                <div className="text-lg text-gray-700">MDAs Engaged</div>
              </div>
              <div className="p-6 bg-yellow-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-5xl font-bold text-yellow-600 mb-3">
                  80+
                </div>
                <div className="text-lg text-gray-700">
                  Performance Reviews Conducted
                </div>
              </div>
              <div className="p-6 bg-purple-50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-5xl font-bold text-purple-600 mb-3">
                  50+
                </div>
                <div className="text-lg text-gray-700">
                  Service Delivery Improved
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Testimonials Section */}
      {renderSafely(<Testimonials />)}

      {/* Call to Action Section */}
      {renderSafely(<CallToAction />)}
    </div>
  );
};

export default HomePage;
