import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { isAuthenticated } from "../../../services/auth/authStorage";
import { toastApiError } from "../../../services/toast/apiToast";
import { getRecords } from "../../../services/sales/salesManagersApi";

const LIST_COLUMNS = ["S.No", "Name", "Email Address", "Status", "Action"];

function SalesManagerPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [salesManagers, setSalesManagers] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalesManagers = useCallback(async () => {
    if (!isAuthenticated()) {
      setSalesManagers([]);
      setTotalRecords(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getRecords();
      setSalesManagers(data.items);
      setTotalRecords(data.total ?? data.count ?? data.items.length);
    } catch (error) {
      toastApiError(error);
      setSalesManagers([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesManagers();
  }, [fetchSalesManagers]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchSalesManagers();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchSalesManagers]);

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Sales Manager"
      searchPlaceholder="Search sales managers..."
      actionLabel="Add Sales Manager"
      onActionClick={() => navigate("/sales/sales-manager/add")}
      columns={LIST_COLUMNS}
      rows={salesManagers}
      rowIdKey="id"
      editPath="/sales/sales-manager"
      permissionModule="sales_manager"
      searchFields={["name", "emailAddress", "code"]}
      isLoading={isLoading}
      loadingMessage="Loading sales managers..."
      emptyMessage="No sales managers found"
      statusAsText
      totalRecords={totalRecords}
      pageSize={DEFAULT_PAGE_SIZE}
      showPagination
      nowrapAllCells
    />
  );
}

export default SalesManagerPage;
