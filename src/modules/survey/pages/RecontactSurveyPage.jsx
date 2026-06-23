import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { getAdminInputClass } from "../../shared/utils/formStyles";
import { SEARCH_DEBOUNCE_MS } from "../../shared/utils/debounce";
import { normalizeSearchQuery } from "../../shared/utils/searchQuery";
import AddRecontactSurveyForm from "../components/AddRecontactSurveyForm";
import RecontactSupplierDetailsModal from "../components/RecontactSupplierDetailsModal";
import {
  getRecontactParentSurvey,
  mapSurveyToRecontactFormDefaults,
  searchRecontactProjects,
} from "../services/recontactSurveyApi";
import { toastApiError } from "../../../services/toast/apiToast";

function RecontactSearchCard({ isDarkMode, children }) {
  return (
    <section
      className={`rounded-3xl border p-4 transition-all duration-300 sm:p-5 ${
        isDarkMode
          ? "border-[#283b58] bg-[#131f31] shadow-[0_16px_35px_rgba(2,6,23,0.3)]"
          : "border-[#dce7f3] bg-white shadow-[0_10px_26px_rgba(17,36,65,0.08)]"
      }`}
    >
      <div className="overflow-visible">{children}</div>
    </section>
  );
}

function RecontactSurveyPage({ isDarkMode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [formSeed, setFormSeed] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const searchContainerRef = useRef(null);

  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const inputClass = getAdminInputClass();
  const showActionButtons = searchQuery.trim().length > 0;

  const selectedSurveyId = useMemo(() => {
    if (!selectedProject?.recordId) return "";
    return String(selectedProject.recordId);
  }, [selectedProject]);

  useEffect(() => {
    const query = normalizeSearchQuery(debouncedSearch);
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    let cancelled = false;
    setIsSearching(true);

    searchRecontactProjects(query)
      .then((items) => {
        if (!cancelled) {
          setSearchResults(items);
          setShowResults(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          toastApiError(error);
          setSearchResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadProjectDetails = useCallback(async (projectRow) => {
    const recordId = projectRow?.recordId;
    if (!recordId) return null;

    try {
      const record = await getRecontactParentSurvey(recordId);
      return mapSurveyToRecontactFormDefaults(record);
    } catch (error) {
      toastApiError(error);
      return {
        parentSurveyId: String(recordId),
        client: projectRow?.clientName ?? "",
        projectCountry: "",
      };
    }
  }, []);

  const handleSelectProject = async (project) => {
    if (!project?.recordId) return;

    setSelectedProject(project);
    setSearchQuery(project.projectName || "");
    setShowResults(false);
    setShowAddForm(false);
    setFormSeed(null);

    setIsLoadingProject(true);
    try {
      const seed = await loadProjectDetails(project);
      setFormSeed(seed);
    } finally {
      setIsLoadingProject(false);
    }
  };

  const handleAddClick = async () => {
    if (!selectedProject?.recordId) return;

    setIsLoadingProject(true);
    try {
      const seed = formSeed ?? (await loadProjectDetails(selectedProject));
      if (!seed) return;
      setFormSeed(seed);
      setShowAddForm(true);
    } finally {
      setIsLoadingProject(false);
    }
  };

  const handleSupplierDetailsClick = () => {
    if (!selectedSurveyId) return;
    setShowSupplierModal(true);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setFormSeed(null);
    setSearchQuery("");
    setSelectedProject(null);
    setSearchResults([]);
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Recontact Survey" isDarkMode={isDarkMode} />

      <RecontactSearchCard isDarkMode={isDarkMode}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div ref={searchContainerRef} className="relative min-w-0 flex-1">
            <label className="admin-text mb-2 block text-sm font-semibold">Search Project</label>
            <div className="relative">
              <input
                type="search"
                className={inputClass}
                placeholder="Search Project"
                value={searchQuery}
                onChange={(e) => {
                  const next = e.target.value;
                  setSearchQuery(next);
                  setSelectedProject(null);
                  setFormSeed(null);
                  setShowAddForm(false);
                  if (next.trim()) {
                    setShowResults(true);
                  } else {
                    setShowResults(false);
                    setSearchResults([]);
                  }
                }}
                onFocus={() => {
                  if (searchResults.length > 0 && searchQuery.trim()) {
                    setShowResults(true);
                  }
                }}
                aria-label="Search Project"
              />
              {isSearching && (
                <Loader2
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--admin-success-text)]"
                />
              )}
            </div>

            {showResults && searchQuery.trim() ? (
              <div
                className="admin-header-surface absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border shadow-lg"
                style={{ borderColor: "var(--admin-header-surface-border)" }}
              >
                {searchResults.length === 0 && !isSearching ? (
                  <p className="admin-text-muted px-4 py-3 text-sm">No survey projects found.</p>
                ) : (
                  searchResults.map((project) => {
                    const key = String(project.recordId);
                    const isSelected =
                      selectedProject?.recordId != null &&
                      String(selectedProject.recordId) === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`admin-text flex w-full flex-col px-4 py-3 text-left text-sm transition hover:bg-[var(--admin-input-bg)] ${
                          isSelected ? "bg-[var(--admin-input-bg)]" : ""
                        }`}
                        onClick={() => handleSelectProject(project)}
                      >
                        <span className="font-medium">{project.projectName || "—"}</span>
                        {project.clientName ? (
                          <span className="admin-text-muted mt-0.5 text-xs">
                            {project.clientName}
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>

          {showActionButtons ? (
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAddClick}
                disabled={!selectedProject?.recordId || isLoadingProject}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingProject ? <Loader2 size={16} className="animate-spin" /> : null}
                Add
              </button>
              <button
                type="button"
                onClick={handleSupplierDetailsClick}
                disabled={!selectedSurveyId || isLoadingProject}
                className="admin-btn-cancel flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Supplier Details
              </button>
            </div>
          ) : null}
        </div>
      </RecontactSearchCard>

      {showAddForm && formSeed ? (
        <AddRecontactSurveyForm
          key={selectedSurveyId}
          isDarkMode={isDarkMode}
          parentSurveyId={selectedSurveyId}
          initialValues={formSeed}
          lockParentFields
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
        />
      ) : null}

      <RecontactSupplierDetailsModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        surveyId={selectedSurveyId}
      />
    </div>
  );
}

export default RecontactSurveyPage;
