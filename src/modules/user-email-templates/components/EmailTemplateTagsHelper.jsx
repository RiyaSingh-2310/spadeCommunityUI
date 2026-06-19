import { USER_EMAIL_TEMPLATE_TAGS_LABEL } from "../constants/availableTags";

function EmailTemplateTagsHelper() {
  return (
    <div className="space-y-1">
      <p className="admin-text-subtle text-xs font-semibold">Available Tags:</p>
      <p className="admin-text-muted text-xs leading-relaxed">
        Tags : {USER_EMAIL_TEMPLATE_TAGS_LABEL}
      </p>
    </div>
  );
}

export default EmailTemplateTagsHelper;
