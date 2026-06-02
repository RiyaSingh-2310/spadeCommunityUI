import { useMemo, useState } from "react";
import { Eye, EyeOff, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import TableCard from "../../components/admin/TableCard";

const demoUser = {
  name: "John Doe",
  email: "john@example.com",
};

function UserFormPage({ isDarkMode, mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";

  const [form, setForm] = useState(
    isEdit
      ? { ...demoUser, password: "Pass@123", confirmPassword: "Pass@123", image: "" }
      : { name: "", email: "", password: "", confirmPassword: "", image: "" }
  );
  const [preview, setPreview] = useState("");
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const mismatch = useMemo(
    () => form.password && form.confirmPassword && form.password !== form.confirmPassword,
    [form.password, form.confirmPassword]
  );
  const canSubmit =
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.password.trim().length > 0 &&
    form.confirmPassword.trim().length > 0 &&
    !mismatch;

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!form.name || !form.email || !form.password || !form.confirmPassword || mismatch) {
      return;
    }
    navigate("/users");
  };

  const inputClass = `h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${
    isDarkMode
      ? "border-[#344662] bg-[#101a2a] text-[#f8fafc] placeholder:text-[#8ea5c2]"
      : "border-[#d8e3ef] bg-white text-[#1f2b3d] placeholder:text-[#8b98ab]"
  }`;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={isEdit ? "Edit Admin User" : "Add Admin User"} isDarkMode={isDarkMode} />
      <TableCard title={isEdit ? `Editing User #${id}` : "User Details"} isDarkMode={isDarkMode}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={`mb-2 block text-sm font-semibold ${isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"}`}>
              Profile Image Upload
            </label>
            <div className="flex items-center gap-3">
              <div className={`h-14 w-14 overflow-hidden rounded-full border ${isDarkMode ? "border-[#344662]" : "border-[#d8e3ef]"}`}>
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#8ea5c2]">No Img</div>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#10a950] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f9b49]">
                <Upload size={14} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-2 block text-sm font-semibold ${isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"}`}>Name</label>
              <input placeholder="Enter Name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {touched && !form.name && <p className="mt-1 text-xs text-[#de3d3d]">Name is required.</p>}
            </div>
            <div>
              <label className={`mb-2 block text-sm font-semibold ${isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"}`}>Email</label>
              <input placeholder="Enter Email Address" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {touched && !form.email && <p className="mt-1 text-xs text-[#de3d3d]">Email is required.</p>}
            </div>
            <div>
              <label className={`mb-2 block text-sm font-semibold ${isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"}`}>New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter New Password"
                  className={`${inputClass} pr-10`}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-[#8ea5c2]" : "text-[#8b98ab]"}`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched && !form.password && <p className="mt-1 text-xs text-[#de3d3d]">Password is required.</p>}
            </div>
            <div>
              <label className={`mb-2 block text-sm font-semibold ${isDarkMode ? "text-[#d4deeb]" : "text-[#304157]"}`}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  className={`${inputClass} pr-10`}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-[#8ea5c2]" : "text-[#8b98ab]"}`}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched && !form.confirmPassword && <p className="mt-1 text-xs text-[#de3d3d]">Confirm Password is required.</p>}
              {touched && mismatch && <p className="mt-1 text-xs text-[#de3d3d]">Passwords must match.</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-11 rounded-xl bg-[#10a950] px-5 text-sm font-semibold text-white transition hover:bg-[#0f9b49] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#10a950]"
            >
              Submit
            </button>
            <button type="button" onClick={() => navigate("/users")} className={`h-11 rounded-xl px-5 text-sm font-semibold ${
              isDarkMode ? "bg-[#1f3047] text-[#e2e8f0]" : "bg-[#eef4fb] text-[#2f3b4d]"
            }`}>
              Cancel
            </button>
          </div>
        </form>
      </TableCard>
    </div>
  );
}

export default UserFormPage;
