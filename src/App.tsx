import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const Blog = lazy(() => import('./pages/Blog'));
const Post = lazy(() => import('./pages/Post'));
const Credentials = lazy(() => import('./pages/Credentials'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const PostsAdmin = lazy(() => import('./pages/admin/PostsAdmin'));
const PostEditor = lazy(() => import('./pages/admin/PostEditor'));
const ProjectsAdmin = lazy(() => import('./pages/admin/ProjectsAdmin'));
const ProjectEditor = lazy(() => import('./pages/admin/ProjectEditor'));
const CredentialsAdmin = lazy(() => import('./pages/admin/CredentialsAdmin'));
const CredentialEditor = lazy(() => import('./pages/admin/CredentialEditor'));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<Projects />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<Post />} />
        <Route path="credentials" element={<Credentials />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<PostsAdmin />} />
          <Route path="posts/:id" element={<PostEditor />} />
          <Route path="projects" element={<ProjectsAdmin />} />
          <Route path="projects/:id" element={<ProjectEditor />} />
          <Route path="credentials" element={<CredentialsAdmin />} />
          <Route path="credentials/:id" element={<CredentialEditor />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
