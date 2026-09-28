import SearchableSelect from "../../../components/admin/SearchableSelect";
import { getAdminInputClass } from "../../shared/utils/formStyles";

export const PROJECT_LIST_STATUS_FILTERS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const FILTER_LABEL_CLASS = "admin-text shrink-0 text-sm font-semibold leading-5";

function ProjectListStatusFilter({ value, onChange }) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
      <label htmlFor="project-list-status-filter" className={FILTER_LABEL_CLASS}>
        Status:
      </label>
      <div className="min-w-0 w-full sm:w-[8.75rem]">
        <SearchableSelect
          id="project-list-status-filter"
          inputClass={`${getAdminInputClass()} !h-10 appearance-none !pr-4`}
          value={value}
          onChange={onChange}
          options={PROJECT_LIST_STATUS_FILTERS}
          placeholder="Status"
          searchable={false}
          aria-label="Filter projects by status"
        />
      </div>
    </div>
  );
}

export default ProjectListStatusFilter;
