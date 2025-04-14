// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Navbar from "./components/common/Navbar";
// import Footer from "./components/common/Footer";
// import HomePage from "./pages/HomePage";
// import NewsPage from "./pages/NewsPage";
// import NewsDetail from "./components/news/NewsDetail";
// import ProjectsPage from "./pages/ProjectsPage";
// import ProjectDetail from "./components/projects/ProjectDetail";
// import ResourcesPage from "./pages/ResourcesPage";
// import ContactPage from "./pages/ContactPage";
// import GovernorPriorities from "./pages/GovernorPriorities";
// import EconomicRebirthPage from "./pages/EconomicRebirthPage";
// import PhysicalInfrastructurePage from "./pages/PhysicalInfrastructurePage";
// import PeaceSecurityPage from "./pages/PeaceSecurityPage";
// import AdminLoginPage from "./pages/admin/LoginPage";
// import AdminDashboard from "./pages/admin/Dashboard";
// import NewsEditor from "./pages/admin/NewsEditor";
// import NewsList from "./pages/admin/NewsList";
// import ProjectEditor from "./pages/admin/ProjectEditor";
// import ProjectsList from "./pages/admin/ProjectsList";
// import ResourceForm from "./pages/admin/ResourceForm";
// import ResourcesList from "./pages/admin/ResourcesList";
// import ContactManager from "./pages/admin/ContactManager";
// import CommentManagement from "./pages/admin/CommentManagement";
// import ProtectedRoute from "./components/auth/ProtectedRoute";
// import { AuthProvider } from "./contexts/AuthContext";
// import AdminLayout from "./layouts/AdminLayout";

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <div className="flex flex-col min-h-screen">
//           <Navbar />
//           <main className="flex-grow">
//             <Routes>
//               <Route path="/" element={<HomePage />} />
//               <Route path="/projects" element={<ProjectsPage />} />
//               <Route path="/project/:id" element={<ProjectDetail />} />
//               <Route path="/news" element={<NewsPage />} />
//               <Route path="/news/:slug" element={<NewsDetail />} />
//               <Route path="/resources" element={<ResourcesPage />} />
//               <Route path="/contact" element={<ContactPage />} />
//               <Route path="/priorities" element={<GovernorPriorities />} />
//               <Route
//                 path="/priorities/economic-rebirth"
//                 element={<EconomicRebirthPage />}
//               />
//               <Route
//                 path="/priorities/physical-infrastructure"
//                 element={<PhysicalInfrastructurePage />}
//               />
//               <Route
//                 path="/priorities/peace-security"
//                 element={<PeaceSecurityPage />}
//               />
//               <Route path="/admin/login" element={<AdminLoginPage />} />

//               {/* Admin Routes with AdminLayout */}
//               <Route
//                 path="/admin"
//                 element={
//                   <ProtectedRoute requiredRole="admin">
//                     <AdminLayout />
//                   </ProtectedRoute>
//                 }
//               >
//                 <Route index element={<AdminDashboard />} />
//                 <Route path="news" element={<NewsList />} />
//                 <Route path="news/new" element={<NewsEditor />} />
//                 <Route path="news/:id" element={<NewsEditor />} />
//                 <Route path="projects" element={<ProjectsList />} />
//                 <Route path="projects/new" element={<ProjectEditor />} />
//                 <Route path="projects/:id" element={<ProjectEditor />} />
//                 <Route path="resources" element={<ResourcesList />} />
//                 <Route path="resources/new" element={<ResourceForm />} />
//                 <Route path="resources/:id" element={<ResourceForm />} />
//                 <Route path="contacts" element={<ContactManager />} />
//                 <Route path="comments" element={<CommentManagement />} />
//               </Route>
//             </Routes>
//           </main>
//           <Footer />
//         </div>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

import { Routes, Route } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import HomePage from "./pages/HomePage";
import NewsPage from "./pages/NewsPage";
import NewsDetail from "./components/news/NewsDetail";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetail from "./components/projects/ProjectDetail";
import ResourcesPage from "./pages/ResourcesPage";
import ContactPage from "./pages/ContactPage";
import GovernorPriorities from "./pages/GovernorPriorities";
import EconomicRebirthPage from "./pages/EconomicRebirthPage";
import PhysicalInfrastructurePage from "./pages/PhysicalInfrastructurePage";
import PeaceSecurityPage from "./pages/PeaceSecurityPage";
import AdminLoginPage from "./pages/admin/LoginPage";
import AdminDashboard from "./pages/admin/Dashboard";
import NewsEditor from "./pages/admin/NewsEditor";
import NewsList from "./pages/admin/NewsList";
import ProjectEditor from "./pages/admin/ProjectEditor";
import ProjectsList from "./pages/admin/ProjectsList";
import ResourceForm from "./pages/admin/ResourceForm";
import ResourcesList from "./pages/admin/ResourcesList";
import ContactManager from "./pages/admin/ContactManager";
import CommentManagement from "./pages/admin/CommentManagement";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import AdminLayout from "./layouts/AdminLayout";

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/priorities" element={<GovernorPriorities />} />
            <Route
              path="/priorities/economic-rebirth"
              element={<EconomicRebirthPage />}
            />
            <Route
              path="/priorities/physical-infrastructure"
              element={<PhysicalInfrastructurePage />}
            />
            <Route
              path="/priorities/peace-security"
              element={<PeaceSecurityPage />}
            />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Routes with AdminLayout */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="news" element={<NewsList />} />
              <Route path="news/new" element={<NewsEditor />} />
              <Route path="news/:id" element={<NewsEditor />} />
              <Route path="projects" element={<ProjectsList />} />
              <Route path="projects/new" element={<ProjectEditor />} />
              <Route path="projects/:id" element={<ProjectEditor />} />
              <Route path="resources" element={<ResourcesList />} />
              <Route path="resources/new" element={<ResourceForm />} />
              <Route path="resources/:id" element={<ResourceForm />} />
              <Route path="contacts" element={<ContactManager />} />
              <Route path="comments" element={<CommentManagement />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
