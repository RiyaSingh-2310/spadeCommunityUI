export const TINYMCE_API_KEY =
  import.meta.env.VITE_TINYMCE_API_KEY ||
  "74nz0rvyzynmmg8392gqeer6nixxwjsawr42r8049ajgo968";

const TINYMCE_PLUGINS = [
  "lists",
  "link",
  "autolink",
  "fullscreen",
  "searchreplace",
  "table",
  "charmap",
  "directionality",
  "advlist",
  "code",
].join(" ");

export const TINYMCE_TOOLBAR_EXPAND = "editorExpand";

export const TINYMCE_TOOLBAR_FULL =
  "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | link | table | tabledelete tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | removeformat | fullscreen | htmlEmbed";

/** Full formatting toolbar with expand/collapse at the end. */
export const TINYMCE_TOOLBAR_FULL_WITH_EXPAND = `${TINYMCE_TOOLBAR_FULL} | ${TINYMCE_TOOLBAR_EXPAND}`;

/**
 * First-line collapsed toolbar: formatting controls (left) matching the compact
 * toolbar screenshot, with expand control as its own trailing group.
 */
export const TINYMCE_TOOLBAR_COMPACT =
  "bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist";

/** Collapsed editor: compact formatting + expand on the same toolbar row. */
export const TINYMCE_TOOLBAR_COLLAPSED = `${TINYMCE_TOOLBAR_COMPACT} | ${TINYMCE_TOOLBAR_EXPAND}`;

const TINYMCE_TOOLBAR = TINYMCE_TOOLBAR_FULL;

const CONTENT_STYLE =
  "body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 14px; margin: 8px; }";

/**
 * Pins the expand control to the far right of the first toolbar row while
 * formatting controls stay left-aligned on that same row.
 */
const COLLAPSED_TOOLBAR_ALIGN_STYLE_ID = "rich-text-editor-collapsed-toolbar-align";
const COLLAPSED_TOOLBAR_ALIGN_CSS = `
.rich-text-editor--collapsed .tox-editor-header {
  position: relative;
}
.rich-text-editor--collapsed .tox-editor-header .tox-toolbar,
.rich-text-editor--collapsed .tox-editor-header .tox-toolbar__primary {
  width: 100% !important;
  box-sizing: border-box !important;
  padding-right: 2.5rem !important;
}
.rich-text-editor--collapsed .tox-editor-header .tox-toolbar > .tox-toolbar__group:last-child,
.rich-text-editor--collapsed .tox-editor-header .tox-toolbar__primary > .tox-toolbar__group:last-child {
  position: absolute !important;
  top: 50%;
  right: 0.35rem;
  transform: translateY(-50%);
  margin: 0 !important;
}
`;

function ensureCollapsedToolbarAlignStyles() {
  if (typeof document === "undefined") return;
  let style = document.getElementById(COLLAPSED_TOOLBAR_ALIGN_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = COLLAPSED_TOOLBAR_ALIGN_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = COLLAPSED_TOOLBAR_ALIGN_CSS;
}

function alignCollapsedExpandControl(editor) {
  ensureCollapsedToolbarAlignStyles();
  const container = editor.getContainer?.();
  if (!container) return;
  const header = container.querySelector(".tox-editor-header");
  const toolbar =
    container.querySelector(".tox-toolbar__primary") ||
    container.querySelector(".tox-toolbar");
  if (!header || !toolbar) return;

  header.style.position = "relative";
  toolbar.style.boxSizing = "border-box";
  toolbar.style.paddingRight = "2.5rem";

  const groups = [...toolbar.children].filter((el) =>
    el.classList?.contains("tox-toolbar__group")
  );
  const lastGroup = groups[groups.length - 1];
  if (!lastGroup) return;
  lastGroup.style.position = "absolute";
  lastGroup.style.top = "50%";
  lastGroup.style.right = "0.35rem";
  lastGroup.style.transform = "translateY(-50%)";
  lastGroup.style.margin = "0";
}

/**
 * Shared TinyMCE init used by the admin RichTextEditor.
 * @param {{
 *   isDarkMode?: boolean,
 *   placeholder?: string,
 *   height?: number,
 *   toolbar?: string | false,
 *   menubar?: string | false,
 *   resize?: boolean,
 *   contentPaddingRight?: number,
 *   onBlur?: () => void,
 *   onToggleExpand?: () => void,
 *   expandActive?: boolean,
 *   alignExpandEnd?: boolean,
 * }} options
 */
export function createTinyMceInit({
  isDarkMode = false,
  placeholder = "Enter content...",
  height = 300,
  toolbar = TINYMCE_TOOLBAR,
  menubar,
  resize = true,
  contentPaddingRight,
  onBlur,
  onToggleExpand,
  expandActive = false,
  alignExpandEnd = false,
} = {}) {
  const isCollapsedToolbar = toolbar === TINYMCE_TOOLBAR_COLLAPSED;
  const resolvedMenubar =
    menubar !== undefined
      ? menubar
      : toolbar === false ||
          toolbar === TINYMCE_TOOLBAR_COMPACT ||
          isCollapsedToolbar
        ? false
        : "table";

  const contentStyle =
    contentPaddingRight != null
      ? `${CONTENT_STYLE} body { padding-right: ${contentPaddingRight}px; }`
      : CONTENT_STYLE;

  return {
    height,
    menubar: resolvedMenubar,
    branding: false,
    promotion: false,
    statusbar: false,
    resize,
    toolbar_mode: isCollapsedToolbar || alignExpandEnd ? "scrolling" : "wrap",
    auto_focus: false,
    skin: isDarkMode ? "oxide-dark" : "oxide",
    content_css: isDarkMode ? "dark" : "default",
    plugins: TINYMCE_PLUGINS,
    toolbar,
    menu: {
      table: {
        title: "Table",
        items:
          "inserttable | cell row column | advtablesort | tableprops deletetable",
      },
    },
    block_formats:
      "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6",
    font_family_formats:
      "Inter=Inter,sans-serif; Arial=arial,helvetica,sans-serif; Georgia=georgia,palatino,serif; Times New Roman=times new roman,times,serif; Courier New=courier new,courier,monospace",
    font_size_formats: "8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt",
    placeholder,
    paste_as_text: false,
    verify_html: false,
    valid_elements: "*[*]",
    extended_valid_elements:
      "script[type|src|language|defer|async],iframe[src|frameborder|style|scrolling|class|width|height|name|align|id|title|allow|allowfullscreen|loading|referrerpolicy]",
    valid_children: "+body[style|script|iframe|div|span|p]",
    content_style: contentStyle,
    setup: (editor) => {
      editor.ui.registry.addButton("htmlEmbed", {
        icon: "sourcecode",
        tooltip: "Embed/HTML Source",
        onAction: () => {
          editor.execCommand("mceCodeEditor");
        },
      });

      if (onToggleExpand) {
        editor.ui.registry.addToggleButton("editorExpand", {
          icon: expandActive ? "chevron-up" : "chevron-down",
          tooltip: expandActive ? "Collapse editor" : "Expand editor",
          onAction: () => onToggleExpand(),
          onSetup: (api) => {
            api.setActive(Boolean(expandActive));
            return () => {};
          },
        });
      }

      if (alignExpandEnd) {
        editor.on("init", () => {
          alignCollapsedExpandControl(editor);
          // TinyMCE can reflow the scrolling toolbar after first paint.
          requestAnimationFrame(() => alignCollapsedExpandControl(editor));
        });
      }

      if (onBlur) {
        editor.on("blur", () => onBlur());
      }
    },
  };
}
