import fs from "node:fs"
import path from "node:path"
import { parseTsFile } from "./parse"
import { LiteralUnion, type Field, type File, type Struct } from "./struct"
import { Case } from "change-case-all"
import { ReservedKeywords, StrictKeywords } from "rs-keywords"
import { parse, init } from 'es-module-lexer';
import { graphSequencer } from '@pnpm/deps.graph-sequencer'
export type Config = {
  derive: string[]
  outdir: string
  convertType?: (field: Field) => string | undefined
}
export const BuiltInStruct: Record<string, string> = {
  number: "f32",
  string: "String",
  boolean: "bool",
  "{ [key: string]: string; }": "std::collections::HashMap<String, String>",
}

function findStruct(structId: string, files: File[]): Struct | undefined {
  for (const file of files) {
    for (const st of file.structs) {
      if (st.id === structId) {
        return st
      }
    }
  }

  return undefined
}

function toRust(
  file: File,
  list: File[],
  { derive, outdir, convertType }: Config,
) {
  let baseName = path.basename(file.path).replaceAll("-", "_")
  if (baseName === "index.ts") {
    baseName = "lib.rs"
  }
  const outPath = path.join(outdir, baseName).replaceAll(".ts", ".rs")

  const useList: Set<Struct> = new Set()
  const structList: string[] = []

  for (const st of file.structs) {
    if (st instanceof LiteralUnion) {
      for (const s of st.literalList) {
        const literName = Case.constant(s)
        const literValue = s
        structList.push(`pub const ${literName}: &str = "${literValue}";`)
      }
    }

    if (st.builtinName) {
      structList.push(`pub type ${st.name} = ${BuiltInStruct[st.builtinName]};`)
      continue
    }

    const defaultDerive = [
      "Debug",
      "Clone",
      "serde::Serialize",
      "serde::Deserialize",
    ]
    const deriveCode = `#[derive(${[...defaultDerive, ...derive].join(", ")})]`
    const structCode: string[] = [deriveCode, `pub struct ${st.name}{`]

    for (const field of st.fields) {
      let { key, structId, optional } = field
      key = key.replaceAll('"', "").replaceAll("'", "")
      let vecDim = 0
      while (structId.endsWith("[]")) {
        vecDim += 1
        structId = structId.slice(0, -2)
      }

      let ty = BuiltInStruct[structId]

      if (!ty) {
        const structTy = findStruct(structId, list)
        if (structTy) {
          ty = structTy.name
          useList.add(structTy)
        }
      }

      if (ty === st.name) {
        ty = `Box<${ty}>`
      }

      while (vecDim) {
        ty = `Vec<${ty}>`
        vecDim--
      }

      if (optional) {
        ty = `Option<${ty}>`
      }

      let snake_case = Case.snake(key)
      const field_serde: string[] = []
      if (snake_case !== key) {
        field_serde.push(`rename = "${key}"`)
      }
      if (optional) {
        field_serde.push('skip_serializing_if = "Option:: is_none"')
      }

      if (structId === "any") {
        // TODO: support any
        structCode.push("//  not support any type")
        structCode.push(`//  pub ${snake_case}: ${ty},`)
        continue
      }

      const file_serde_str = field_serde.length
        ? `  #[serde(${field_serde.join(",")})]`
        : ""
      structCode.push(file_serde_str)

      const isKeywords = [
        ...Object.values(StrictKeywords),
        ...Object.values(ReservedKeywords),
      ].includes(snake_case)
      if (isKeywords) {
        snake_case = `r#${snake_case}`
      }
      ty = convertType?.(field) ?? ty
      structCode.push(`  pub ${snake_case}: ${ty},`)
    }

    structCode.push("}")
    structList.push(structCode.join("\n"))
  }

  const useCode = [...useList]
    .map((i) => {
      const depPath = i.file.path
      const filePath = file.path
      const relPath = path.relative(filePath, depPath)
      const modName = path
        .basename(relPath)
        .replaceAll(".ts", "")
        .replaceAll("-", "_")
      const structName = i.name
      if (modName.length) {
        if (modName === "index") {
          return `use crate::${structName};`
        }
        return `use crate::${modName}::${structName};`
      }

      return ""
    })
    .join("\n")

  const importCode = file.exports
    .map((i) => {
      const modName = i.id.replaceAll("-", "_").replaceAll(".ts", "")
      return `pub mod ${modName};`
    })
    .join("\n")

  const code = `
${useCode}

${importCode}

${structList.join("\n")}
  `.trim()

  fs.writeFileSync(outPath, code)
}

function resolveTsMod(dir: string, mod: string) {
  const tsPath = path.resolve(path.join(dir, `${mod}.ts`));

  if (fs.existsSync(tsPath)) {
    return tsPath
  }

  const dtsPath = path.resolve(path.join(dir, `${mod}.d.ts`));
  if (fs.existsSync(dtsPath)) {
    return dtsPath
  }
  return
}

async function typoSort(list: string[]): Promise<string[]> {
  await init;
  const nodes: Record<string, number> = {}
  const nodeNameMap: Record<number, string> = {}
  let nodeId = 0;
  const graph = new Map<number, number[]>()

  for (const i of list) {

    if (typeof nodes[i] === 'undefined') {
      graph.set(nodeId, [])
      nodes[i] = nodeId
      nodeNameMap[nodeId] = i
      nodeId++
    }
    const fromId = nodes[i]

    const source = fs.readFileSync(i, 'utf8');
    const [imports,] = parse(source);

    const dir = path.dirname(i)
    for (const dep of imports) {
      if (!dep.n) {
        continue
      }
      const depPath = resolveTsMod(dir, dep.n)
      if (!depPath) {
        continue
      }
      if (typeof nodes[depPath] === 'undefined') {
        nodes[depPath] = nodeId
        nodeNameMap[nodeId] = depPath
        graph.set(nodeId, [])
        nodeId++
      }
      const toId = nodes[depPath]
      const edge = graph.get(fromId) || [];
      edge.push(toId)
      graph.set(fromId, edge)
    }
  }

  const sorted = graphSequencer(graph)
  const s = sorted.chunks.flat().map(i => nodeNameMap[i])
  return s
}

export async function build(fileOrDir: string, config: Config) {
  const { outdir } = config
  const isDir = fs.lstatSync(fileOrDir).isDirectory()
  const list = isDir
    ? fs.readdirSync(fileOrDir).map((i) => path.join(fileOrDir, i))
    : [fileOrDir]

  const absolutePathList = list.map(i => path.resolve(i))
  const sortedList = await typoSort(absolutePathList)
  const files = sortedList.map(parseTsFile)
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir)
  }

  for (const file of files) {
    toRust(file, files, config)
  }
}
