function TableCard({ title, children, isDarkMode }) {
  return (
    <section
      className={`rounded-3xl border p-4 transition-all duration-300 sm:p-5 ${
        isDarkMode
          ? "border-[#283b58] bg-[#131f31] shadow-[0_16px_35px_rgba(2,6,23,0.3)]"
          : "border-[#dce7f3] bg-white shadow-[0_10px_26px_rgba(17,36,65,0.08)]"
      }`}
    >
      {title && (
        <h2
          className={`mb-4 text-lg font-semibold ${
            isDarkMode ? "text-[#f8fafc]" : "text-[#233247]"
          }`}
        >
          {title}
        </h2>
      )}
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export default TableCard;
