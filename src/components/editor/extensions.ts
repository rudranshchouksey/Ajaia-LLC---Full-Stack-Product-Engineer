import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

/**
 * Editor schema. TipTap v3's StarterKit bundles Underline and Link; Underline
 * is disabled there and registered explicitly, and Link is off (no link UI in scope).
 */
export function getExtensions(placeholder = "Start writing…") {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      underline: false,
      link: false,
    }),
    Underline,
    Placeholder.configure({ placeholder }),
  ];
}
