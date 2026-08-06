import { useCallback, useState } from "react";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

/**
 * Shared loading + toast wrapper for CSV export downloads.
 * @param {() => Promise<{ message?: string }>} exportFn
 */
export function useCsvExport(exportFn) {
  const [isExporting, setIsExporting] = useState(false);

  const downloadCsv = useCallback(async () => {
    if (isExporting || typeof exportFn !== "function") return;

    setIsExporting(true);
    try {
      const data = await exportFn();
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsExporting(false);
    }
  }, [exportFn, isExporting]);

  return { isExporting, downloadCsv };
}
