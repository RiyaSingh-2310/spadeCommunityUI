import AdminPagination from "../../../components/admin/AdminPagination";
import TableCard from "../../../components/admin/TableCard";
import TableEllipsisText from "../../../components/admin/TableEllipsisText";
import TableLoadingSkeleton from "../../../components/admin/TableLoadingSkeleton";
import { ADMIN_TABLE_INNER_CLASS } from "../../shared/utils/tableHelpers";
import { formatAppDateValue } from "../../shared/utils/dateTime";
import { toUiSentenceCase } from "../../shared/utils/uiText";

const TABLE_HEAD =
  "admin-text-muted text-left text-xs font-semibold tracking-[0.02em] whitespace-nowrap";

const LOGIN_PAGE_SIZES = [10, 20, 50, 100];

const SIGNUP_DUPLICATE_KEYS = new Set([
  "id",
  "name",
  "email",
  "balance_point",
  "balancepoint",
  "panelist_id",
  "panelistid",
  "created_at",
  "createdat",
]);

const LOGIN_DUPLICATE_KEYS = new Set(["panelist_id", "panelistid"]);

function fieldLabel(key) {
  return toUiSentenceCase(String(key).replace(/_/g, " "));
}

function isDateKey(key) {
  return /(_at|At|date|time)$/i.test(String(key));
}

function formatFieldValue(key, value) {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return null;
  if (isDateKey(key)) return formatAppDateValue(value);
  return String(value);
}

function primitiveEntries(record, skipKeys = null) {
  if (!record || typeof record !== "object") return [];
  return Object.entries(record).flatMap(([key, value]) => {
    if (skipKeys?.has(String(key).toLowerCase())) return [];
    const display = formatFieldValue(key, value);
    if (display == null) return [];
    return [{ key, label: fieldLabel(key), value: display }];
  });
}

function SectionMessage({ children }) {
  return <p className="admin-text-muted px-1 py-3 text-center text-sm">{children}</p>;
}

function SignupDetailsSection({ record, isLoading, errorMessage }) {
  const fields = primitiveEntries(record, SIGNUP_DUPLICATE_KEYS);

  return (
    <TableCard title="Signup Details">
      {isLoading ? (
        <p className="admin-text-muted px-1 py-3 text-sm">Loading signup details...</p>
      ) : errorMessage ? (
        <SectionMessage>{errorMessage}</SectionMessage>
      ) : fields.length === 0 ? (
        <SectionMessage>No signup details found.</SectionMessage>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((field) => (
            <div key={field.key} className="min-w-0">
              <p className="admin-text-subtle text-xs font-semibold tracking-[0.02em]">
                {field.label}
              </p>
              <p className="admin-text mt-1 wrap-break-word text-sm">{field.value}</p>
            </div>
          ))}
        </div>
      )}
    </TableCard>
  );
}

function LoginDetailsSection({
  records,
  isLoading,
  errorMessage,
  isDarkMode,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  const columns = [];
  const seen = new Set();
  records.forEach((record) => {
    primitiveEntries(record, LOGIN_DUPLICATE_KEYS).forEach((field) => {
      if (seen.has(field.key)) return;
      seen.add(field.key);
      columns.push(field);
    });
  });

  const footer =
    !isLoading && !errorMessage && total > 0 ? (
      <AdminPagination
        isDarkMode={isDarkMode}
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        pageSizeOptions={LOGIN_PAGE_SIZES}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    ) : null;

  return (
    <TableCard title="Login Details" footer={footer}>
      {isLoading ? (
        <table className={ADMIN_TABLE_INNER_CLASS}>
          <tbody>
            <TableLoadingSkeleton columns={["Login details"]} />
          </tbody>
        </table>
      ) : errorMessage ? (
        <SectionMessage>{errorMessage}</SectionMessage>
      ) : records.length === 0 ? (
        <SectionMessage>No login details found.</SectionMessage>
      ) : (
        <table className={ADMIN_TABLE_INNER_CLASS}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={TABLE_HEAD}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={record.id ?? record.login_detail_id ?? index} className="align-middle">
                {columns.map((column) => {
                  const display = formatFieldValue(column.key, record[column.key]);
                  const isLong = column.key === "user_agent" || column.key === "userAgent";
                  return (
                    <td key={column.key} className="admin-text align-middle text-sm">
                      {isLong ? (
                        <TableEllipsisText>{display}</TableEllipsisText>
                      ) : (
                        display
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableCard>
  );
}

export { SignupDetailsSection, LoginDetailsSection };
