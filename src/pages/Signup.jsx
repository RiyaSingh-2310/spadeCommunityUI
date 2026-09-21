import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import heroLogo from "../assets/spade-community-logo-compact.png";
import {
  EMAIL_FIELD_MAX_LENGTH,
  NAME_FIELD_MAX_LENGTH,
  PASSWORD_FIELD_MAX_LENGTH,
  getEmailError,
} from "../modules/shared/utils/validation";

const AUTH_SHELL_CLASS =
  "kh-input-shell flex h-[52px] items-center rounded-2xl border border-[#d5deea] bg-[#f4f8fc] px-4 transition-all duration-200 focus-within:border-[#18a957] focus-within:ring-2 focus-within:ring-[#18a957]/15";

const AUTH_INPUT_CLASS =
  "kh-input h-full w-full bg-transparent text-[15px] text-[#18202f] outline-none placeholder:text-[#8f97a7]";

function Signup() {
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const emailError = useMemo(() => getEmailError(email), [email]);
  const shownEmailError = emailTouched ? emailError : "";

  const handleSubmit = (event) => {
    event.preventDefault();
    setEmailTouched(true);
    if (emailError) return;
  };

  return (
    <div className="min-h-screen bg-[#edf1f6] px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-5 flex flex-col items-center gap-2">
          <img src={heroLogo} alt="Spade Community logo" className="h-16 w-16 object-contain" />
          <p className="text-base font-semibold tracking-wider text-[#138842]">
            SPADE COMMUNITY
          </p>
        </div>

        <div className="w-full rounded-[20px] border border-[#e7ebf0] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.08)]">
          <h1 className="text-center text-[32px] font-bold text-[#151a23]">
            Create Account
          </h1>
          <p className="mb-6 mt-2 text-center text-[15px] text-[#7f8796]">
            Join the Spade Community
          </p>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2d3747]">
                  Full Name
                </label>
                <div className={AUTH_SHELL_CLASS}>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    maxLength={NAME_FIELD_MAX_LENGTH}
                    className={AUTH_INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2d3747]">
                  Email
                </label>
                <div
                  className={`${AUTH_SHELL_CLASS} ${
                    shownEmailError
                      ? "border-[#de3d3d] focus-within:border-[#de3d3d] focus-within:ring-[#de3d3d]/20"
                      : ""
                  }`}
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    maxLength={EMAIL_FIELD_MAX_LENGTH}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className={AUTH_INPUT_CLASS}
                  />
                </div>
                {shownEmailError ? (
                  <p className="mt-1 text-xs text-[#de3d3d]">{shownEmailError}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2d3747]">
                  Password
                </label>
                <div className={AUTH_SHELL_CLASS}>
                  <input
                    type="password"
                    placeholder="Create a password"
                    maxLength={PASSWORD_FIELD_MAX_LENGTH}
                    className={AUTH_INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2d3747]">
                  Confirm Password
                </label>
                <div className={AUTH_SHELL_CLASS}>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    maxLength={PASSWORD_FIELD_MAX_LENGTH}
                    className={AUTH_INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="h-[50px] w-full rounded-[14px] bg-[#0ea246] py-3 font-semibold text-white transition hover:bg-[#0c8f3e]"
            >
              Sign Up
            </button>

            <p className="text-center text-[#7f8796]">
              Already have an account?{" "}
              <Link to="/" className="font-medium text-[#199949] hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
