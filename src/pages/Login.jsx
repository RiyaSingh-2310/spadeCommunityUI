import { useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import { AUTH_EMAIL_REGEX } from "../modules/shared/utils/validation";
import { loginAdmin, loginPanelist } from "../services/auth/authApi";
import { LOGIN_ROLES } from "../services/auth/loginRole";
import { toastApiError, toastApiSuccess } from "../services/toast/apiToast";
import { saveAuthSession } from "../services/auth/authStorage";

const LOGIN_ROLE_UI = {
  [LOGIN_ROLES.ADMIN]: {
    title: "Admin Login",
    emailLabel: "Admin's Email",
    switchOptions: [
      { role: LOGIN_ROLES.SALES, label: "Login as Sales" },
      { role: LOGIN_ROLES.MANAGER, label: "Login as Manager" },
      { role: LOGIN_ROLES.PANELIST, label: "Login as Panelist" },
    ],
  },
  [LOGIN_ROLES.SALES]: {
    title: "Sales Login",
    emailLabel: "Sale's Email",
    switchOptions: [
      { role: LOGIN_ROLES.ADMIN, label: "Login as Admin" },
      { role: LOGIN_ROLES.MANAGER, label: "Login as Manager" },
      { role: LOGIN_ROLES.PANELIST, label: "Login as Panelist" },
    ],
  },
  [LOGIN_ROLES.MANAGER]: {
    title: "Manager Login",
    emailLabel: "Manager's Email",
    switchOptions: [
      { role: LOGIN_ROLES.ADMIN, label: "Login as Admin" },
      { role: LOGIN_ROLES.SALES, label: "Login as Sales" },
      { role: LOGIN_ROLES.PANELIST, label: "Login as Panelist" },
    ],
  },
  [LOGIN_ROLES.PANELIST]: {
    title: "Panelist Login",
    emailLabel: "Panelist Email",
    switchOptions: [
      { role: LOGIN_ROLES.ADMIN, label: "Login as Admin" },
      { role: LOGIN_ROLES.SALES, label: "Login as Sales" },
      { role: LOGIN_ROLES.MANAGER, label: "Login as Manager" },
    ],
  },
};

function Login({ isDarkMode, onToggleTheme }) {
  const navigate = useNavigate();
  const [loginRole, setLoginRole] = useState(LOGIN_ROLES.ADMIN);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const roleUi = LOGIN_ROLE_UI[loginRole];

  const hasEmailFormat = useMemo(
    () => AUTH_EMAIL_REGEX.test(email.trim()),
    [email]
  );

  const showEmailError = touched.email && email.trim().length === 0;
  const showEmailFormatError =
    touched.email && email.trim().length > 0 && !hasEmailFormat;
  const showPasswordError = touched.password && password.trim().length === 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const hasEmail = email.trim().length > 0;
    const hasPassword = password.trim().length > 0;
    const isEmailValid = AUTH_EMAIL_REGEX.test(email.trim());

    setTouched({ email: true, password: true });
    if (!hasEmail || !hasPassword || !isEmailValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      const credentials = {
        email: email.trim(),
        password,
      };
      const response =
        loginRole === LOGIN_ROLES.PANELIST
          ? await loginPanelist(credentials)
          : await loginAdmin(credentials);

      saveAuthSession({
        token: response.token,
        refreshToken: response.refreshToken,
        admin: response.admin,
        loginRole,
      });

      toastApiSuccess(response);

      navigate("/", { replace: true });
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleSwitchButtonClass = `text-sm font-semibold text-[#18a354] transition-colors hover:text-[#138b46] disabled:cursor-not-allowed disabled:opacity-60`;

  return (
    <AuthLayout isDarkMode={isDarkMode} onToggleTheme={onToggleTheme}>
          <h1
            className={`text-center text-[34px] font-bold leading-tight tracking-[-0.02em] sm:text-[38px] ${
              isDarkMode ? "text-[#f8fafc]" : "text-[#1f2b3d]"
            }`}
          >
            Welcome Back
          </h1>
          <p
            className={`mt-2 text-center text-[15px] font-semibold sm:text-[16px] ${
              isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"
            }`}
          >
            {roleUi.title}
          </p>
          <p
            className={`mt-1.5 text-center text-[14px] sm:text-[15px] ${
              isDarkMode ? "text-[#9fb0c8]" : "text-[#6f7f96]"
            }`}
          >
            Sign in to your Spade Community account
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate autoComplete="off">
            <div>
              <label
                htmlFor="email"
                className={`mb-2 block text-sm font-semibold ${
                  isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"
                }`}
              >
                {roleUi.emailLabel}
              </label>
              <div
                className={`kh-input-shell flex h-[52px] items-center rounded-2xl border px-4 transition-all duration-200 ${
                  showEmailError
                    ? "border-[#de3d3d] focus-within:border-[#de3d3d] focus-within:ring-2 focus-within:ring-[#de3d3d]/20"
                    : isDarkMode
                      ? "border-[#344662] bg-[#101a2a] focus-within:border-[#24b86b] focus-within:ring-2 focus-within:ring-[#24b86b]/20"
                      : "border-[#d5deea] bg-[#f4f8fc] focus-within:border-[#18a957] focus-within:ring-2 focus-within:ring-[#18a957]/15"
                }`}
              >
                <Mail
                  size={16}
                  className={isDarkMode ? "text-[#8ea5c2]" : "text-[#8b98ab]"}
                />
                <input
                  id="email"
                  name="loginEmail"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  className={`kh-input h-full w-full bg-transparent pl-2.5 text-[15px] outline-none ${
                    isDarkMode
                      ? "text-[#f8fafc] placeholder:text-[#94a3b8]"
                      : "text-[#18202f] placeholder:text-[#8f97a7]"
                  }`}
                />
              </div>
              {showEmailError && (
                <p className="mt-1.5 text-xs text-[#de3d3d]">
                  Email is required.
                </p>
              )}
              {showEmailFormatError && (
                <p className="mt-1.5 text-xs text-[#de3d3d]">
                  Please enter a valid email address
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className={`mb-2 block text-sm font-semibold ${
                  isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"
                }`}
              >
                Password
              </label>
              <div
                className={`kh-input-shell flex h-[52px] items-center rounded-2xl border px-4 transition-all duration-200 ${
                  showPasswordError
                    ? "border-[#de3d3d] focus-within:border-[#de3d3d] focus-within:ring-2 focus-within:ring-[#de3d3d]/20"
                    : isDarkMode
                      ? "border-[#344662] bg-[#101a2a] focus-within:border-[#24b86b] focus-within:ring-2 focus-within:ring-[#24b86b]/20"
                      : "border-[#d5deea] bg-[#f4f8fc] focus-within:border-[#18a957] focus-within:ring-2 focus-within:ring-[#18a957]/15"
                }`}
              >
                <LockKeyhole
                  size={16}
                  className={isDarkMode ? "text-[#8ea5c2]" : "text-[#8b98ab]"}
                />
                <input
                  id="password"
                  name="loginPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, password: true }))
                  }
                  className={`kh-input h-full w-full bg-transparent pl-2.5 text-[15px] outline-none ${
                    isDarkMode
                      ? "text-[#f8fafc] placeholder:text-[#94a3b8]"
                      : "text-[#18202f] placeholder:text-[#8e97a7]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={`ml-2 transition-colors ${
                    isDarkMode
                      ? "text-[#8ea5c2] hover:text-[#d4deeb]"
                      : "text-[#97a1b0] hover:text-[#4c5f77]"
                  }`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {showPasswordError && (
                <p className="mt-1.5 text-xs text-[#de3d3d]">
                  Password is required.
                </p>
              )}

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="text-sm font-semibold text-[#18a354] transition-colors hover:text-[#138b46]"
                  onClick={() => navigate("/auth/forgot-password")}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#10a950] text-base font-semibold text-white shadow-[0_10px_24px_rgba(16,169,80,0.3)] transition-all duration-200 hover:-translate-y-px hover:bg-[#0f9b49] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1">
              {roleUi.switchOptions.map((option, index) => (
                <span key={option.role} className="inline-flex items-center gap-4">
                  {index > 0 && (
                    <span
                      className={`hidden sm:inline ${
                        isDarkMode ? "text-[#4b5f7d]" : "text-[#c5d0de]"
                      }`}
                      aria-hidden
                    >
                      |
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setLoginRole(option.role)}
                    className={roleSwitchButtonClass}
                  >
                    {option.label}
                  </button>
                </span>
              ))}
            </div>
          </form>
    </AuthLayout>
  );
}

export default Login;
