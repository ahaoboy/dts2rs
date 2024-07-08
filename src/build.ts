import fs from 'node:fs'
import path from 'node:path'
import { parseTsFile } from './parse';
import type { Field, File, Struct } from './struct'
import { Case } from 'change-case-all';
import { ReservedKeywords, StrictKeywords } from './share';
export type Config = {
  derive: string[],
  outdir: string,
  convertType?: (field: Field) => string | undefined
}

export const BuiltInStruct: Record<string, string> = {
  'number': 'f32',
  'string': 'String',
  "boolean": 'bool',
  "{ [key: string]: string; }": "std::collections::HashMap<String, String>"
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

function toRust(file: File, list: File[], { derive, outdir }: Config) {
  let baseName = path.basename(file.path).replaceAll('-', '_')
  if (baseName === 'index.ts') {
    baseName = 'lib.rs'
  }
  const outPath = path.join(outdir, baseName).replaceAll('.ts', '.rs')

  const useList: Set<Struct> = new Set();
  const structList: string[] = []

  for (const st of file.structs) {

    if (st.builtinName) {
      structList.push(`pub type ${st.name} = ${BuiltInStruct[st.builtinName]};`)
      continue
    }

    const defaultDerive = ['Debug', 'Clone', "serde::Serialize", "serde::Deserialize"]
    const deriveCode = `#[derive(${[
      ...defaultDerive,
      ...derive
    ].join(', ')})]`
    const structCode: string[] = [
      deriveCode,
      `pub struct ${st.name}{`
    ]

    for (let { key, structId, optional } of st.fields) {
      key = key.replaceAll('"', '').replaceAll("'", "")
      let vecDim = 0
      while (structId.endsWith('[]')) {
        vecDim += 1
        structId = structId.slice(0, -2)
      }

      let ty = BuiltInStruct[structId]

      if (!ty) {
        const structTy = findStruct(structId, list);
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

      let snake_case = Case.snake(key);
      const field_serde: string[] = [
      ]
      if (snake_case !== key) {
        field_serde.push(`rename = "${key}"`)
      }
      if (optional) {
        field_serde.push('skip_serializing_if = "Option:: is_none"')
      }


      if (structId === 'any') {
        // TODO: support any
        structCode.push('//  not support any type');
        structCode.push(`//  pub ${snake_case}: ${ty},`);
        continue
      }


      const file_serde_str = field_serde.length ? `  #[serde(${field_serde.join(',')})]` : ""
      structCode.push(file_serde_str);

      const isKeywords = [
        ...Object.values(StrictKeywords),
        ...Object.values(ReservedKeywords)
      ].includes(snake_case)
      if (isKeywords) {
        snake_case = `r#${snake_case}`
      }

      structCode.push(`  pub ${snake_case}: ${ty},`);
    }

    structCode.push("}")
    structList.push(structCode.join('\n'))
  }

  const useCode = [...useList].map(i => {
    const depPath = i.file.path;
    const filePath = file.path;
    const relPath = path.relative(filePath, depPath)
    const modName = path.basename(relPath).replaceAll('.ts', '').replaceAll('-', '_')
    const structName = i.name;
    if (modName.length) {
      if (modName === 'index') {
        return `use crate::${structName};`;
      }
      return `use crate::${modName}::${structName};`;
    }

    return ''
  }).join('\n');


  const importCode = file.exports.map(i => {
    const modName = i.id.replaceAll('-', '_').replaceAll('.ts', '')
    return `pub mod ${modName};`;
  }).join('\n')

  const code = `
${useCode}

${importCode}

${structList.join('\n')}
  `.trim();

  fs.writeFileSync(outPath, code)
}

export function build(fileOrDir: string, config: Config) {
  const { outdir } = config;
  const isDir = fs.lstatSync(fileOrDir).isDirectory()
  const list = isDir ? fs.readdirSync(fileOrDir).map(i => path.join(fileOrDir, i)) : [fileOrDir]
  const files = list.map(parseTsFile)
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir)
  }
  for (const file of files) {
    toRust(file, files, config)
  }
}