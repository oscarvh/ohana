module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/editar");
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });

  eleventyConfig.addCollection("canciones", (api) =>
    api.getFilteredByGlob("src/content/canciones/*.md")
       .sort((a, b) => (a.data.orden ?? 999) - (b.data.orden ?? 999))
  );

  return {
    dir: { input: "src", includes: "_includes", output: "_site" },
    pathPrefix: "/ohana/"
  };
};
