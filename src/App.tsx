import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminLayout } from './components/admin/AdminLayout'
import { Layout } from './components/layout/Layout'
import { PageTransition } from './components/layout/PageTransition'
import { CustomCursor } from './components/ui/CustomCursor'
import { LoadingScreen } from './components/ui/LoadingScreen'

const CartPage = lazy(() =>
  import('./pages/CartPage').then((module) => ({ default: module.CartPage })),
)
const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
)
const ComplaintsBookPage = lazy(() =>
  import('./pages/ComplaintsBookPage').then((module) => ({
    default: module.ComplaintsBookPage,
  })),
)
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((module) => ({
    default: module.PrivacyPage,
  })),
)
const ProductPage = lazy(() =>
  import('./pages/ProductPage').then((module) => ({
    default: module.ProductPage,
  })),
)
const ShopPage = lazy(() =>
  import('./pages/ShopPage').then((module) => ({ default: module.ShopPage })),
)
const AdminContentPage = lazy(() =>
  import('./pages/admin/AdminContentPage').then((module) => ({
    default: module.AdminContentPage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((module) => ({
    default: module.AdminDashboardPage,
  })),
)
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((module) => ({
    default: module.AdminLoginPage,
  })),
)
const AdminOrdersPage = lazy(() =>
  import('./pages/admin/AdminOrdersPage').then((module) => ({
    default: module.AdminOrdersPage,
  })),
)
const AdminProductsPage = lazy(() =>
  import('./pages/admin/AdminProductsPage').then((module) => ({
    default: module.AdminProductsPage,
  })),
)

function RouteFallback() {
  return <div aria-hidden="true" className="min-h-screen bg-cream-light" />
}

function App() {
  const location = useLocation()

  if (location.pathname.startsWith('/admin')) {
    return (
      <>
        <LoadingScreen />
        <PageTransition />
        <CustomCursor />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="productos" element={<AdminProductsPage />} />
              <Route path="pedidos" element={<AdminOrdersPage />} />
              <Route path="contenido" element={<AdminContentPage />} />
              <Route path="acceso" element={<AdminLoginPage />} />
              <Route path="login" element={<AdminLoginPage />} />
            </Route>
            <Route path="/admin/*" element={<Navigate replace to="/admin" />} />
          </Routes>
        </Suspense>
      </>
    )
  }

  return (
    <>
      <LoadingScreen />
      <PageTransition />
      <CustomCursor />
      <Layout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route
              path="/libro-de-reclamaciones"
              element={<ComplaintsBookPage />}
            />
            <Route path="/privacidad" element={<PrivacyPage />} />
            <Route path="/producto/:slug" element={<ProductPage />} />
            <Route path="/tienda" element={<ShopPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  )
}

export default App
