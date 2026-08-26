# Custom Agent Rules & Project Protocol

## 🚀 Automatic Version Code Increment Protocol
- **Version Number Updates (`src/config/version.ts`)**:
  - Whenever ANY page, tool, backend code, bug fix, styling, or feature modification is made, you MUST automatically increment the version code (e.g. `v1.02` → `v1.03` → `v1.04` → `v1.05`).
  - Keep `APP_VERSION` in `src/config/version.ts` as the single source of truth so that all pages, tools, and badges immediately reflect the updated version code.

## 📁 Automatic Documentation Protocol
- **`FOLDER_STRUCTURE.md` Maintenance**:
  - Whenever any files or folders are added, modified, renamed, or deleted, you MUST automatically update `FOLDER_STRUCTURE.md`.
  - Ensure `FOLDER_STRUCTURE.md` contains the updated file tree, workflow diagrams, page descriptions, and folder purpose guide so the user can easily understand what each file does.

