export const TINYMCE_API_KEY =
  import.meta.env.VITE_TINYMCE_API_KEY ||
  "74nz0rvyzynmmg8392gqeer6nixxwjsawr42r8049ajgo968";

const TINYMCE_PLUGINS = [
  "lists",
  "link",
  "autolink",
  "fullscreen",
  "paste",
  "searchreplace",
  "table",
  "charmap",
  "directionality",
  "advlist",
  "code",
].join(" ");

const TINYMCE_TOOLBAR =
  "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | link | removeformat | fullscreen | htmlEmbed";

const CONTENT_STYLE =
  "body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 14px; margin: 8px; }";

/**
 * Shared TinyMCE init used by the admin RichTextEditor.
 * @param {{ isDarkMode?: boolean, placeholder?: string, height?: number, onBlur?: () => void }} options
 */
export function createTinyMceInit({
  isDarkMode = false,
  placeholder = "Enter content...",
  height = 240,
  onBlur,
} = {}) {
  return {
    height,
    menubar: false,
    branding: false,
    promotion: false,
    statusbar: false,
    resize: true,
    skin: isDarkMode ? "oxide-dark" : "oxide",
    content_css: isDarkMode ? "dark" : "default",
    plugins: TINYMCE_PLUGINS,
    toolbar: TINYMCE_TOOLBAR,
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
    content_style: CONTENT_STYLE,
    setup: (editor) => {
      editor.ui.registry.addButton("htmlEmbed", {
        icon: "sourcecode",
        tooltip: "Embed/HTML Source",
        onAction: () => {
          editor.execCommand("mceCodeEditor");
        },
      });

      if (onBlur) {
        editor.on("blur", () => onBlur());
      }
    },
  };
}
