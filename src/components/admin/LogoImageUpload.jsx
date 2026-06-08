import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { getValidImageUrl } from "../../modules/shared/utils/userAvatar";

const ACCEPT = "image/png,image/jpeg,image/jpg,image/svg+xml";

function LogoImageUpload({ isDarkMode, preview, onPreviewChange, existingImage = "", disabled = false }) {
  const inputRef = useRef(null);
  const blobUrlRef = useRef("");
  const displayImage = preview || existingImage;
  const hasImage = Boolean(getValidImageUrl(displayImage));

  const revokeBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = "";
    }
  };

  useEffect(() => () => revokeBlobUrl(), []);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    revokeBlobUrl();
    const nextUrl = URL.createObjectURL(file);
    blobUrlRef.current = nextUrl;
    onPreviewChange(nextUrl);
    event.target.value = "";
  };

  const handleRemove = () => {
    revokeBlobUrl();
    onPreviewChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const borderClass = isDarkMode ? "border-[#344662]" : "border-[#d8e3ef]";

  return (
    <div>
      <label className="admin-text mb-2 block text-sm font-semibold">Logo Image</label>
      <div className="flex flex-wrap items-start gap-4">
        {hasImage && (
          <div
            className={`flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-2 ${borderClass}`}
          >
            <img
              src={displayImage}
              alt="Invoice logo preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          {!disabled && (
          <label className="inline-flex w-fit cursor-pointer items-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 border-[var(--admin-header-search-border)] admin-text">
            Choose File
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleFile}
            />
          </label>
          )}
          {preview && !disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className={`inline-flex w-fit items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                isDarkMode
                  ? "border-[#344662] text-[var(--admin-foreground)] hover:bg-[#1f3047]"
                  : "border-[#d8e3ef] text-[var(--admin-foreground)] hover:bg-[#eef4fb]"
              }`}
            >
              <X size={14} />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LogoImageUpload;
