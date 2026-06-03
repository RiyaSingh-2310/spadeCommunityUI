import { useEffect, useRef } from "react";
import { Upload, X } from "lucide-react";

function ProfileImageUpload({
  isDarkMode,
  preview,
  onPreviewChange,
  existingImage = "",
  label = "Profile Image",
  showCurrentLabel = false,
}) {
  const inputRef = useRef(null);
  const blobUrlRef = useRef("");
  const displayImage = preview || existingImage;

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
      <label className="admin-text mb-2 block text-sm font-semibold">{label}</label>
      {showCurrentLabel && displayImage && (
        <p className="admin-text-muted mb-2 text-xs">Current Profile Image</p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`h-[100px] w-[100px] shrink-0 overflow-hidden rounded-full border ${borderClass}`}
        >
          {displayImage ? (
            <img src={displayImage} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <div className="admin-avatar-fallback flex h-full w-full items-center justify-center text-sm font-semibold">
              —
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-[#10a950] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f9b49]">
            <Upload size={16} />
            {displayImage ? "Replace Image" : "Upload Image"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </label>
          {preview && (
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

export default ProfileImageUpload;
