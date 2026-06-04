import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import {
  getSupplierMappingDetail,
  getSurveyProjectDetails,
} from "../data/surveyDetailsData";

function assertSuccess(data, fallback) {
  if (data?.success !== true) {
    throw new ApiError(data?.message || fallback, data);
  }
  return data;
}

/**
 * GET supplier mapping details (falls back to demo data when API unavailable).
 * @param {string} surveyId
 * @param {string} supplierCode
 */
export async function fetchSupplierMappingDetails(surveyId, supplierCode) {
  try {
    const data = await apiRequest(
      `/api/survey/${encodeURIComponent(surveyId)}/supplier-mapping/${encodeURIComponent(supplierCode)}`,
      { method: "GET" }
    );
    return data?.supplier ?? data?.data ?? data;
  } catch {
    await new Promise((r) => setTimeout(r, 200));
    const detail = getSupplierMappingDetail(supplierCode);
    if (!detail) {
      throw new ApiError("Supplier mapping not found.");
    }
    return detail;
  }
}

/**
 * PUT project status (demo fallback).
 * @param {string} surveyId
 * @param {string} status
 */
export async function updateSurveyProjectStatus(surveyId, status) {
  try {
    const data = await apiRequest(
      `/api/survey/${encodeURIComponent(surveyId)}/status`,
      {
        method: "PUT",
        body: { status },
      }
    );
    return assertSuccess(data, "Failed to update project status.");
  } catch (err) {
    if (err instanceof ApiError && err.status) {
      throw err;
    }
    await new Promise((r) => setTimeout(r, 350));
    const project = getSurveyProjectDetails(surveyId);
    if (!project) {
      throw new ApiError("Survey not found.");
    }
    return {
      success: true,
      message: `Project status updated to ${status}.`,
    };
  }
}

/**
 * PUT supplier mapping (demo fallback).
 * @param {string} surveyId
 * @param {object} payload
 */
/**
 * @param {object} payload
 */
function buildSurveyFormPayload(payload) {
  return {
    client: payload.client,
    projectName: payload.projectName?.trim(),
    projectManager: payload.projectManager,
    projectCountry: payload.projectCountry,
    salesManager: payload.salesManager || undefined,
    salesProject: payload.salesProject || undefined,
    description: payload.description,
    loi: Number(payload.loi),
    ir: Number(payload.ir),
    sampleSize: Number(payload.sampleSize),
    currency: payload.currency,
    cpi: Number(payload.cpi),
    startDate: payload.startDate,
    endDate: payload.endDate,
    projectLinkType: payload.projectLinkType,
    liveLink: payload.liveLink?.trim() || undefined,
    testLink: payload.testLink?.trim() || undefined,
    filters: payload.filters,
    language: payload.language || undefined,
    surveyGroup: payload.surveyGroup || undefined,
    userTerminationPoint: payload.userTerminationPoint?.trim(),
    userCompletionPoint: payload.userCompletionPoint?.trim(),
    notes: payload.notes?.trim() || undefined,
  };
}

/**
 * POST /api/survey (demo fallback).
 * @param {object} form
 */
export async function createSurvey(form) {
  try {
    const data = await apiRequest("/api/survey", {
      method: "POST",
      body: buildSurveyFormPayload(form),
    });
    return assertSuccess(data, "Failed to create survey.");
  } catch (err) {
    if (err instanceof ApiError && err.status) {
      throw err;
    }
    await new Promise((r) => setTimeout(r, 400));
    return {
      success: true,
      message: "Survey created successfully.",
    };
  }
}

/**
 * PUT /api/survey/:id (demo fallback).
 * @param {string} surveyId
 * @param {object} form
 */
export async function updateSurvey(surveyId, form) {
  try {
    const data = await apiRequest(`/api/survey/${encodeURIComponent(surveyId)}`, {
      method: "PUT",
      body: buildSurveyFormPayload(form),
    });
    return assertSuccess(data, "Failed to update survey.");
  } catch (err) {
    if (err instanceof ApiError && err.status) {
      throw err;
    }
    await new Promise((r) => setTimeout(r, 400));
    return {
      success: true,
      message: "Survey updated successfully.",
    };
  }
}

export async function updateSupplierMapping(surveyId, payload) {
  try {
    const data = await apiRequest(
      `/api/survey/${encodeURIComponent(surveyId)}/supplier-mapping`,
      {
        method: "PUT",
        body: payload,
      }
    );
    return assertSuccess(data, "Failed to update supplier mapping.");
  } catch (err) {
    if (err instanceof ApiError && err.status) {
      throw err;
    }
    await new Promise((r) => setTimeout(r, 350));
    return {
      success: true,
      message: "Supplier mapping updated successfully.",
    };
  }
}
