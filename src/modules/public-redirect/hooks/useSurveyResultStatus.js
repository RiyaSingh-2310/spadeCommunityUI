import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast, toastApiError } from "../../../services/toast";
import {
  clearSurveyResultStatusCache,
  resolveSurveyResultStatusKind,
  updateSurveyResultStatus,
} from "../services/surveyResultStatusApi";
import {
  getMissingResultStatusParamLabel,
  readResultStatusParams,
} from "../utils/readResultStatusParams";

export const RESULT_STATUS_PHASE = {
  MISSING: "missing",
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
};

export const RESULT_REDIRECT_DELAY_MS = 5000;
export const RESULT_REDIRECT_SECONDS = RESULT_REDIRECT_DELAY_MS / 1000;

const MISSING_PARAMS_MESSAGE =
  "This result link is missing a required survey identifier. Please use the original survey result URL.";
const MISSING_REDIRECT_MESSAGE =
  "Your survey status was updated, but no redirect destination was provided.";
const UPDATE_FAILED_MESSAGE =
  "Unable to update your survey status. Please try again.";

function buildMissingParamsMessage(pid, uid) {
  const label = getMissingResultStatusParamLabel({ pid, uid });
  if (!label) return MISSING_PARAMS_MESSAGE;
  return `This result link is missing a required ${label}. Please use the original survey result URL.`;
}

/**
 * Call the matching result status API once, then countdown to the API redirect_url.
 */
export function useSurveyResultStatus({ outcome, pathUid = "" } = {}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const kind = resolveSurveyResultStatusKind(outcome);

  const { pid, uid } = useMemo(
    () =>
      readResultStatusParams({
        search: searchParams.toString() || location.search,
        pathUid,
      }),
    [searchParams, location.search, pathUid]
  );

  const canRequest = Boolean(kind && pid && uid);

  const [phase, setPhase] = useState(() =>
    canRequest ? RESULT_STATUS_PHASE.LOADING : RESULT_STATUS_PHASE.MISSING
  );
  const [error, setError] = useState(() =>
    canRequest ? "" : buildMissingParamsMessage(pid, uid)
  );
  const [redirectUrl, setRedirectUrl] = useState("");
  const [countdown, setCountdown] = useState(RESULT_REDIRECT_SECONDS);
  const [retryKey, setRetryKey] = useState(0);
  const [allowRetry, setAllowRetry] = useState(false);

  useEffect(() => {
    if (!canRequest) {
      setPhase(RESULT_STATUS_PHASE.MISSING);
      setError(buildMissingParamsMessage(pid, uid));
      setRedirectUrl("");
      setAllowRetry(false);
      return undefined;
    }

    let cancelled = false;
    setPhase(RESULT_STATUS_PHASE.LOADING);
    setError("");
    setRedirectUrl("");
    setCountdown(RESULT_REDIRECT_SECONDS);
    setAllowRetry(false);

    updateSurveyResultStatus({ kind, pid, uid })
      .then((result) => {
        if (cancelled) return;
        const nextRedirectUrl = String(result?.redirectUrl ?? "").trim();
        if (!nextRedirectUrl) {
          setError(MISSING_REDIRECT_MESSAGE);
          setPhase(RESULT_STATUS_PHASE.ERROR);
          setAllowRetry(false);
          toast.error(MISSING_REDIRECT_MESSAGE, { force: true });
          return;
        }
        setRedirectUrl(nextRedirectUrl);
        setCountdown(RESULT_REDIRECT_SECONDS);
        setPhase(RESULT_STATUS_PHASE.READY);
      })
      .catch((requestError) => {
        if (cancelled) return;
        const message =
          String(requestError?.message ?? "").trim() || UPDATE_FAILED_MESSAGE;
        setError(message);
        setPhase(RESULT_STATUS_PHASE.ERROR);
        setAllowRetry(true);
        toastApiError(requestError, UPDATE_FAILED_MESSAGE, { force: true });
      });

    return () => {
      cancelled = true;
    };
  }, [canRequest, kind, pid, uid, retryKey]);

  useEffect(() => {
    if (phase !== RESULT_STATUS_PHASE.READY || !redirectUrl) return undefined;

    const timeoutId = window.setTimeout(() => {
      window.location.assign(redirectUrl);
    }, RESULT_REDIRECT_DELAY_MS);

    const intervalId = window.setInterval(() => {
      setCountdown((seconds) => (seconds > 1 ? seconds - 1 : 0));
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [phase, redirectUrl]);

  const retry = useCallback(() => {
    clearSurveyResultStatusCache({ kind, pid, uid });
    setRetryKey((key) => key + 1);
  }, [kind, pid, uid]);

  return {
    kind,
    pid,
    uid,
    phase,
    error,
    redirectUrl,
    countdown,
    canRetry:
      phase === RESULT_STATUS_PHASE.ERROR && allowRetry && canRequest,
    retry,
  };
}
