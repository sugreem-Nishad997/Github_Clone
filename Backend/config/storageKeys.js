function getRepositoryCommitsPrefix(ownerId, repoName) {
  return `repos/${encodeURIComponent(String(ownerId))}/${encodeURIComponent(repoName)}/commits/`;
}

export { getRepositoryCommitsPrefix };
