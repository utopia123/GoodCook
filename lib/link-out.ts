/**
 * 站外搜索跳转（仅客户端使用）
 *
 * 手机上优先唤起对应 App 的搜索页；唤不起来再回退网页。
 * 回退一律用同页跳转或同一次点击里开窗，避免被浏览器当弹窗拦截。
 */

function isMobile() {
  return /iphone|ipad|ipod|android/.test(navigator.userAgent.toLowerCase())
}

/** 依次尝试多个 App scheme；全部失败才回退网页 */
function openAppWithFallback(schemes: string[], webUrl: string) {
  if (!isMobile()) {
    window.open(webUrl, '_blank', 'noopener,noreferrer')
    return
  }

  let left = false
  const markLeft = () => {
    left = true
  }
  document.addEventListener('visibilitychange', markLeft)
  window.addEventListener('blur', markLeft)
  window.addEventListener('pagehide', markLeft)

  const cleanup = () => {
    document.removeEventListener('visibilitychange', markLeft)
    window.removeEventListener('blur', markLeft)
    window.removeEventListener('pagehide', markLeft)
  }

  let index = 0
  const attempt = () => {
    if (left || document.visibilityState === 'hidden') {
      cleanup()
      return
    }
    if (index >= schemes.length) {
      cleanup()
      window.location.href = webUrl
      return
    }
    window.location.href = schemes[index++]
    window.setTimeout(attempt, 1300)
  }
  attempt()
}

export function xhsWebUrl(kw: string) {
  // 小红书网页版搜索未登录会 404，改用 Bing 站内检索
  return `https://www.bing.com/search?q=${encodeURIComponent(`site:xiaohongshu.com ${kw}`)}`
}

export function biliWebUrl(kw: string) {
  return `https://search.bilibili.com/all?keyword=${encodeURIComponent(kw)}`
}

export function searchBing(kw: string) {
  window.open(
    `https://www.bing.com/search?q=${encodeURIComponent(kw)}`,
    '_blank',
    'noopener,noreferrer',
  )
}

export function searchXhs(kw: string) {
  openAppWithFallback(
    [`xhsdiscover://search/result?keyword=${encodeURIComponent(kw)}`],
    xhsWebUrl(kw),
  )
}

export function searchBili(kw: string) {
  openAppWithFallback(
    [`bilibili://search?keyword=${encodeURIComponent(kw)}`],
    biliWebUrl(kw),
  )
}
