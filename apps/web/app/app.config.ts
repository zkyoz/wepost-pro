export default defineAppConfig({
  ui: {
    colors: { primary: "orange", secondary: "sage", neutral: "zinc" },
    button: {
      slots: { base: "font-semibold cursor-pointer rounded-lg" },
      defaultVariants: { size: "md" },
    },
  },
});
