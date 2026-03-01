module.exports = function (eleventyConfig) {

  // ── Passthrough copy ──
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/admin");

  // ── Collections ──

  // Work: sorted by displayOrder
  eleventyConfig.addCollection("work", function (collectionApi) {
    return collectionApi.getFilteredByTag("work").sort((a, b) => {
      return (a.data.displayOrder || 0) - (b.data.displayOrder || 0);
    });
  });

  // Featured work: filtered and sorted by featuredOrder
  eleventyConfig.addCollection("featuredWork", function (collectionApi) {
    return collectionApi.getFilteredByTag("work")
      .filter(item => item.data.featured)
      .sort((a, b) => {
        return (a.data.featuredOrder || 0) - (b.data.featuredOrder || 0);
      });
  });

  // Blog (future)
  eleventyConfig.addCollection("blog", function (collectionApi) {
    return collectionApi.getFilteredByTag("post").sort((a, b) => {
      return b.date - a.date;
    });
  });

  // ── Filters ──

  // Pad a number with leading zeros: {{ 1 | padStart(2) }} → "01"
  eleventyConfig.addFilter("padStart", function (num, size) {
    return String(num).padStart(size, "0");
  });

  // ── Config ──
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
