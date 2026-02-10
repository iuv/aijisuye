import { GitHubDataStore } from './githubApi'
import { LocalDataStore } from './localDataStore'

export function createDataStore(accessToken, owner, repo) {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

  if (isDevMode) {
    const dataPath = import.meta.env.VITE_DEV_DATA_PATH || './dev-data'
    console.log('[Data Store] Using Local DataStore (Development Mode)')
    console.log('[Data Store] Data path:', dataPath)
    return new LocalDataStore(dataPath)
  } else {
    console.log('[Data Store] Using GitHub DataStore (Production Mode)')
    console.log('[Data Store] Repository:', `${owner}/${repo}`)
    return new GitHubDataStore(accessToken, owner, repo)
  }
}

/**
 * 为指定用户创建数据存储
 * @param {string} accessToken - GitHub access token
 * @param {string} username - GitHub 用户名
 * @returns {GitHubDataStore}
 */
export function createUserDataStore(accessToken, username) {
  const repoName = import.meta.env.VITE_GITHUB_REPO_NAME || 'jisuye-ext-data'
  return createDataStore(accessToken, username, repoName)
}
