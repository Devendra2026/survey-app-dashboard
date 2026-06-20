/** @see https://react.doctor/docs/configuration/config-files — false-positive rationale in .react-doctor/false-positives.md */
import { defineConfig } from "react-doctor/api";

export default defineConfig({
  ignore: {
    files: ["convex/_generated/**"],
    overrides: [
      {
        files: ["convex/**"],
        rules: ["deslop/unused-file"],
      },
      {
        files: ["components/ui/**"],
        rules: ["deslop/unused-file"],
      },
      {
        files: ["hooks/use-mobile.ts", "lib/qc/build-demand-notice-document.ts"],
        rules: ["deslop/unused-file"],
      },
      {
        files: ["convex/_generated/**"],
        rules: ["deslop/unused-export"],
      },
    ],
  },
});
