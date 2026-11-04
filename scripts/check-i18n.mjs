/**
 * 词条一致性检查：中英 key 必须完全一致，且同文件内不得重复。
 * 用于 CI / 本地 lint，防止新增文案只写一边导致界面显示原始 key。
 */
import { readFileSync } from 'node:fs'

const SRC = new URL('../lib/i18n/dictionaries.ts', import.meta.url)
const text = readFileSync(SRC, 'utf8')

function section(startMarker) {
  const start = text.indexOf(startMarker)
  if (start < 0) throw new Error(`未找到区块: ${startMarker}`)
  const end = text.indexOf('\n}', start)
  return text.slice(start, end)
}

function keysOf(block) {
  const keys = []
  for (const m of block.matchAll(/^\s*'([^']+)':/gm)) keys.push(m[1])
  return keys
}

const zh = keysOf(section("const zh: Messages = {"))
const en = keysOf(section("const en: Messages = {"))

const dup = (list) => list.filter((k, i) => list.indexOf(k) !== i)
const dups = [...new Set([...dup(zh), ...dup(en)])]
const missingInEn = zh.filter((k) => !en.includes(k))
const missingInZh = en.filter((k) => !zh.includes(k))

let failed = false
if (dups.length) {
  console.error('✗ 重复词条:', dups.join(', '))
  failed = true
}
if (missingInEn.length) {
  console.error('✗ 英文缺失:', missingInEn.join(', '))
  failed = true
}
if (missingInZh.length) {
  console.error('✗ 中文缺失:', missingInZh.join(', '))
  failed = true
}
if (failed) process.exit(1)
console.log(`✓ 词条一致（zh ${zh.length} / en ${en.length}）`)
