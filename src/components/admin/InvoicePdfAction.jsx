import { FileText } from "lucide-react";

function InvoicePdfAction({ isDarkMode, onDownload }) {
  if (!onDownload) return null;

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={onDownload}
        title="Download Invoice"
        aria-label="Download Invoice"
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          isDarkMode
            ? "text-[#9fb0c8] hover:bg-[#1e2e45] hover:text-[#f8fafc]"
            : "text-[#5e718a] hover:bg-[#eef4fb] hover:text-[#203148]"
        }`}
      >
        <FileText size={13} />
      </button>
    </div>
  );
}

export default InvoicePdfAction;
