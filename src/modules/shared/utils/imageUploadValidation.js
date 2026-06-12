/** Maximum image upload size: 5 MB */
export const IMAGE_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** File input accept attribute for allowed image types */
export const IMAGE_UPLOAD_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

export const IMAGE_UPLOAD_TYPE_ERROR =
  "Only JPG, JPEG, and PNG image files are allowed.";

export const IMAGE_UPLOAD_SIZE_ERROR = "Image size must not exceed 5 MB.";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

function getFileExtension(name) {
  const parts = String(name ?? "").trim().split(".");
  if (parts.length < 2) return "";
  return parts.pop().toLowerCase();
}

/**
 * Validates a single image file. Returns an error message or empty string if valid.
 * @param {File | null | undefined} file
 * @returns {string}
 */
export function validateImageFile(file) {
  if (!file) return "";

  const extension = getFileExtension(file.name);
  const mimeType = String(file.type ?? "").toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return IMAGE_UPLOAD_TYPE_ERROR;
  }

  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
    return IMAGE_UPLOAD_TYPE_ERROR;
  }

  if (file.size > IMAGE_UPLOAD_MAX_SIZE_BYTES) {
    return IMAGE_UPLOAD_SIZE_ERROR;
  }

  return "";
}

/**
 * Validates multiple image files. Invalid files are excluded; valid files are returned.
 * @param {FileList | File[] | null | undefined} files
 * @returns {{ validFiles: File[], errors: string[] }}
 */
export function filterValidImageFiles(files) {
  const list = Array.from(files ?? []);
  const validFiles = [];
  const errorSet = new Set();

  list.forEach((file) => {
    const error = validateImageFile(file);
    if (error) {
      errorSet.add(error);
    } else {
      validFiles.push(file);
    }
  });

  return { validFiles, errors: [...errorSet] };
}
