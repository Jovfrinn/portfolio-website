function getPublishedProjects(portfolio) {
  return portfolio.projects.filter((p) => p.published).sort((a, b) => a.order - b.order);
}

function findProjectBySlug(portfolio, slug) {
  const published = getPublishedProjects(portfolio);
  return published.find((p) => p.slug === slug) || null;
}

function getAdjacentProjects(portfolio, slug) {
  const published = getPublishedProjects(portfolio);
  const index = published.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? published[index - 1] : null,
    next: index < published.length - 1 ? published[index + 1] : null,
  };
}

module.exports = { getPublishedProjects, findProjectBySlug, getAdjacentProjects };
