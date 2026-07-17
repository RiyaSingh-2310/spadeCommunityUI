import { Link } from "react-router-dom";
import heroLogo from "../assets/hero.png";
import {
  EMAIL_FIELD_MAX_LENGTH,
  NAME_FIELD_MAX_LENGTH,
  PASSWORD_FIELD_MAX_LENGTH,
} from "../modules/shared/utils/validation";

function Signup() {
  return (
    <div className="min-h-screen bg-[#edf1f6] px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-5 flex flex-col items-center gap-2">
          <img src={heroLogo} alt="Spade Community logo" className="h-14 w-14" />
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

          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2d3747]">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  maxLength={NAME_FIELD_MAX_LENGTH}
                  className="h-[50px] w-full rounded-[14px] border border-[#d9dee7] bg-[#f2f5f9] px-4 text-[15px] text-[#151a23] outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2d3747]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  maxLength={EMAIL_FIELD_MAX_LENGTH}
                  className="h-[50px] w-full rounded-[14px] border border-[#d9dee7] bg-[#f2f5f9] px-4 text-[15px] text-[#151a23] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2d3747]">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Create a password"
                  maxLength={PASSWORD_FIELD_MAX_LENGTH}
                  className="h-[50px] w-full rounded-[14px] border border-[#d9dee7] bg-[#f2f5f9] px-4 text-[15px] text-[#151a23] outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2d3747]">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  maxLength={PASSWORD_FIELD_MAX_LENGTH}
                  className="h-[50px] w-full rounded-[14px] border border-[#d9dee7] bg-[#f2f5f9] px-4 text-[15px] text-[#151a23] outline-none"
                />
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
