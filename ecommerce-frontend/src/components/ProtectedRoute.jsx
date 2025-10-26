import { Navigate } from "react-router-dom";
import { accountService } from "../services/accountService";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const isAuthenticated = accountService.isAuthenticated();
  const user = accountService.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user?.role !== "Admin") {
    return <Navigate to="/home" />;
  }

  return children;
};

export default ProtectedRoute;
