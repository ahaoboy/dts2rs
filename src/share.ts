import { graphSequencer } from "@pnpm/deps.graph-sequencer"
import { Case } from "change-case-all"
import { init, parse } from "es-module-lexer"
import path from "node:path"
import fs from "node:fs"
export function isValidIdentifier(str: string): boolean {
  console.log("isValidIdentifier", str)
  // 检查第一个字符是否为字母或下划线
  if (!str[0].match(/^[a-zA-Z_]/)) {
    return false
  }

  // 检查剩余字符是否为字母、数字或下划线
  for (let i = 1; i < str.length; i++) {
    if (!str[i].match(/^[a-zA-Z0-9_]/)) {
      return false
    }
  }

  // 如果所有检查都通过，则字符串是有效的标识符
  return true
}

export function getEnumItemId(s: string) {
  const id = Case.pascal(s)
  if (!id.match(/^[a-zA-Z_]/)) {
    return `_${id}`
  }
  return id
}

export function getEnumId(s: string) {
  const id = Case.pascal(s)
  if (!id.match(/^[a-zA-Z_]/)) {
    return `_${id}`
  }
  return id
}

function resolveTsMod(dir: string, mod: string) {
  const tsPath = path.resolve(path.join(dir, `${mod}.ts`))

  if (fs.existsSync(tsPath)) {
    return tsPath
  }

  const dtsPath = path.resolve(path.join(dir, `${mod}.d.ts`))
  if (fs.existsSync(dtsPath)) {
    return dtsPath
  }
  return
}

export async function typoSort(list: string[]): Promise<string[]> {
  await init
  const nodes: Record<string, number> = {}
  const nodeNameMap: Record<number, string> = {}
  let nodeId = 0
  const graph = new Map<number, number[]>()

  for (const i of list) {
    if (typeof nodes[i] === "undefined") {
      graph.set(nodeId, [])
      nodes[i] = nodeId
      nodeNameMap[nodeId] = i
      nodeId++
    }
    const fromId = nodes[i]

    const source = fs.readFileSync(i, "utf8")
    const [imports] = parse(source)

    const dir = path.dirname(i)
    for (const dep of imports) {
      if (!dep.n) {
        continue
      }
      const depPath = resolveTsMod(dir, dep.n)
      if (!depPath) {
        continue
      }
      if (typeof nodes[depPath] === "undefined") {
        nodes[depPath] = nodeId
        nodeNameMap[nodeId] = depPath
        graph.set(nodeId, [])
        nodeId++
      }
      const toId = nodes[depPath]
      const edge = graph.get(fromId) || []
      edge.push(toId)
      graph.set(fromId, edge)
    }
  }

  const sorted = graphSequencer(graph)
  const s = sorted.chunks.flat().map((i) => nodeNameMap[i])
  return s
}
