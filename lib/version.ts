/** 当前应用版本（构建时由 Dockerfile ARG APP_VERSION 注入；本地为 dev） */
export const APP_VERSION = process.env.APP_VERSION || 'dev'

/** 展示用版本：完整 commit sha 截断为 7 位，语义版本原样展示 */
export const APP_VERSION_DISPLAY = /^[0-9a-f]{40}$/i.test(APP_VERSION)
  ? APP_VERSION.slice(0, 7)
  : APP_VERSION

/** 用于检查更新 / 自更新的镜像仓库（fork 可用 UPDATE_IMAGE 覆盖） */
export const IMAGE_REPO =
  process.env.UPDATE_IMAGE || 'ghcr.io/utopia123/goodcook'
