import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

function Breadcrumbs({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav className="admin-text-muted mt-2 flex flex-wrap items-center gap-1 text-xs">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span className="inline-flex items-center gap-1" key={`${item.label}-${index}`}>
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="admin-text-muted font-medium transition-colors hover:text-[var(--admin-foreground)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="admin-text font-medium">{item.label}</span>
            )}
            {!isLast && (
              <ChevronRight size={12} className="admin-text-subtle" />
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
