import { Project, SyntaxKind, ts, Type, TypeFlags } from "ts-morph"
import { Case } from "change-case-all"
import { getEnumId, getEnumItemId } from "./share"
import fs from "node:fs"
import path from "node:path"

export const BuiltInStruct: Record<string, string> = {
  number: "f32",
  string: "String",
  boolean: "bool",
  any: "serde_json::Value",
  null: "()",
  undefined: "()",
  "{ [key: string]: string; }": "std::collections::HashMap<String, String>",
}


export class Field {
  constructor(
    public struct: Struct,
    public key: string,
    public ty: Type<ts.Type>,
    public optional = true,
  ) { }
  getTypeName(): undefined | string {
    return undefined
  }
  getKey() {
    return this.key
  }
  toRustCode() {
    const ty = this.getTypeName() || this.struct.file.builder.tsStringTypeToRustType(this.ty.getText() || "", this.struct, this.optional)
    return `pub ${this.getKey()}: ${ty};`
  }
}

export class StringField extends Field {
  getTypeName() {
    return "string"
  }
}
export class NumberField extends Field {
  getTypeName() {
    return "number"
  }
}

export class BoolField extends Field {
  getTypeName() {
    return "boolean"
  }
}

export class UndefinedField extends Field {
  getTypeName() {
    return "undefined"
  }
}
export class NullField extends Field {
  getTypeName() {
    return "null"
  }
}

export abstract class Struct {
  constructor(
    public file: File,
    public name: string,
    public ty: Type<ts.Type>,
  ) { }

  get id() {
    return this.ty.getText()
  }

  abstract toRustCode(): string
}

export class ConstString extends Struct {
  toRustCode(): string {
    return `const ${this.name}: &str = ${this.ty.getText()};`
  }
}
export class ConstNumber extends Struct {
  toRustCode(): string {
    return `const ${this.name} = ${this.ty.getText()};`
  }
}

export class ConstNone extends Struct {
  toRustCode(): string {
    return `const ${this.name} = None;`
  }
}
export class ConstEmpty extends Struct {
  toRustCode(): string {
    return `const ${this.name} = ();`
  }
}
export class StringStruct extends Struct {
  toRustCode(): string {
    return `pub type ${this.name} = String;`
  }
}
export class NumberStruct extends Struct {
  toRustCode(): string {
    return `pub type ${this.name} = f32;`
  }
}

export class BoolStruct extends Struct {
  toRustCode(): string {
    return `pub type ${this.name} = bool;`
  }
}

export class HashMapStruct extends Struct {
  constructor(
    public file: File,
    public name: string,
    public ty: Type<ts.Type>,
    public key: string,
    public value: string
  ) {
    super(file, name, ty)
  }

  toRustCode(): string {
    const k = this.key
    const v = this.value
    return `pub type ${this.name} = std::collections::HashMap<${this.key}, ${this.value}>;`
  }
}
export class ObjectStruct extends Struct {
  constructor(
    public file: File,
    public name: string,
    public ty: Type<ts.Type>,
    public fields: Field[] = [],
  ) {
    super(file, name, ty)
  }

  toRustCode(): string {
    const code = [
      "#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, serde::Serialize, serde::Deserialize)]",
      `pub struct ${this.name}{`,
      ...this.fields.map((i) => i.toRustCode()),
      "}",
    ]

    return code.join("\n")
  }
}

export abstract class EnumItem {
  constructor(
    public enumStruct: EnumStruct,
    public value: Type<ts.Type>,
  ) { }

  abstract toRustCode(): string
}
export class StringEnumItem extends EnumItem {
  toRustCode(): string {
    return `${Case.pascal(this.value.getText())},`
  }
}
export class NumberEnumItem extends EnumItem {
  toRustCode(): string {
    return `${Case.pascal(this.value.getText())},`
  }
}

export class EnumStruct extends Struct {
  items: EnumItem[] = []
  rustType = ""
  toRustCode(): string {
    const structName = getEnumId(this.name)
    const isString = this.items.every((i) => i instanceof StringEnumItem)
    console.log("isString:", isString)
    const isNumber = this.items.every((i) => i instanceof NumberEnumItem)
    const itemCode: string[] = []
    const displayItems: string[] = []
    for (const i of this.items) {
      const rawName = i.value.getLiteralValue()?.toString() || ""
      const pascalName = getEnumItemId(Case.pascal(rawName))
      const nameList: string[] = []
      if (pascalName !== rawName) {
        nameList.push(`#[serde(rename = "${rawName}")]`)
      }
      nameList.push(`${pascalName},`)
      itemCode.push(nameList.join("\n"))
      displayItems.push(`Self::${pascalName} => f.write_str("${rawName}"),`)
    }

    const displayCode: string[] = [
      `impl std::fmt::Display for ${structName} {`,
      "fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {",
      "match self {",
      ...displayItems,
      "}",
      "}",
      "}",
    ]
    return [
      "#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, serde::Serialize, serde::Deserialize)]",
      `pub enum ${structName}{`,
      ...itemCode,
      "}",
      ...displayCode,
    ].join("\n")
  }
}

export class LiteralUnionStruct extends Struct {
  public literalList: string[] = []

  isString() {
    return this.ty.getUnionTypes().every((i) => i.isStringLiteral())
  }

  toRustCode(): string {
    console.log(this.isString())
    return "LiteralUnion"
  }
}

export class BuiltinStruct extends Struct {
  toRustCode(): string {
    return "BuiltinStruct"
  }
}
export class UnknownStruct extends Struct {
  toRustCode(): string {
    return "UnknownStruct"
  }
}
export class Export {
  constructor(
    public id: string,
    public file: File,
  ) { }
}
export class Import {
  constructor(
    public id: string,
    public file: File,
  ) { }
}

export class File {
  constructor(
    public builder: Builder,
    public path: string,
    public structs: Struct[] = [],
    public imports: Import[] = [],
    public exports: Export[] = [],
  ) { }
}

export type Config = {
  derive: string[]
  outdir: string
  convertType?: (field: Field) => string | undefined
}
export class Builder {
  files: File[] = []
  hasExport = new Set<string>()
  project: Project
  constructor(
    public pathList: string[],
    public config: Config,
  ) {
    this.project = new Project({})

  }

  build() {
    for (const p of this.pathList) {
      this.parseTsFile(p)
    }

    const { outdir } = this.config
    if (!fs.existsSync(outdir)) {
      fs.mkdirSync(outdir)
    }

    for (const f of this.files) {
      this.buildRustCode(f)
    }
  }
  findStruct(structId: string): Struct | undefined {
    for (const file of this.files) {
      for (const st of file.structs) {
        if (st.id === structId) {
          return st
        }
      }
    }
    return undefined
  }

  buildRustCode(file: File) {
    let baseName = path.basename(file.path).replaceAll("-", "_")
    if (baseName === "index.ts") {
      baseName = "lib.rs"
    }
    const { outdir } = this.config
    const outPath = path.join(outdir, baseName).replaceAll(".ts", ".rs")

    const useList: Set<Struct> = new Set()
    const structList: string[] = []

    for (const st of file.structs) {
      structList.push(st.toRustCode())
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
  parseTsFile(filePath: string) {
    const checker = this.project.getTypeChecker()
    const StringTy = checker.compilerObject.getStringType()
    const NumberTy = checker.compilerObject.getNumberType()
    const BoolTy = checker.compilerObject.getBooleanType()
    const isString = (ty: ts.Type) =>
      checker.compilerObject.isTypeAssignableTo(ty, StringTy)
    const isNumber = (ty: ts.Type) =>
      checker.compilerObject.isTypeAssignableTo(ty, NumberTy)
    const isBool = (ty: ts.Type) =>
      checker.compilerObject.isTypeAssignableTo(ty, BoolTy)
    const isLiteral = (ty: Type) =>
      ty.getUnionTypes().every((i) => i.isLiteral())

    const sourceFile = this.project.addSourceFileAtPath(filePath)
    const file = new File(this, filePath)

    for (const decl of sourceFile.getExportDeclarations()) {
      const filePath = decl.getModuleSpecifierSourceFile()?.getBaseName()
      if (filePath) {
        file.exports.push(new Export(filePath, file))
      }
    }

    sourceFile.getExportedDeclarations().forEach((declarations, name) => {
      for (const declaration of declarations) {
        const declTy = declaration.getType()
        const declCo = declTy.compilerType
        const structId = declTy.getText()

        if (
          ts.isInterfaceDeclaration(declaration.compilerNode) ||
          ts.isTypeAliasDeclaration(declaration.compilerNode)
        ) {
          const fileName = declaration.getSourceFile().getBaseName()
          if (file.exports.find((i) => i.id === fileName)) {
            continue
          }
          const kind = declaration.getKind()
          console.log("filepath ", kind)
          // const interfaceDeclaration = declaration.asKindOrThrow(
          //   ts.SyntaxKind.InterfaceDeclaration,
          // )
          if (kind === SyntaxKind.InterfaceDeclaration) {
            const interfaceDeclaration = declaration.asKindOrThrow(kind)
            const struct = new ObjectStruct(file, name, declTy)
            file.structs.push(struct)
            for (const member of interfaceDeclaration.getMembers()) {
              let isOptional = false
              if (
                member.getText().includes("?:") ||
                member.getText().includes("null") ||
                member.getText().includes("undefined")
              ) {
                isOptional = true
              }

              if (ts.isPropertySignature(member.compilerNode)) {
                const propertySignature = member.asKindOrThrow(
                  ts.SyntaxKind.PropertySignature,
                )
                const propertyName = propertySignature.getName()
                const propertyType = propertySignature.getType()

                if (propertyType.isLiteral()) {
                  if (
                    checker.compilerObject.isTypeAssignableTo(
                      propertyType.compilerType,
                      StringTy,
                    )
                  ) {

                    console.log('======', propertyName)
                    const filed = new StringField(
                      struct,
                      propertyName,
                      propertyType,
                      isOptional,
                    )
                    struct.fields.push(filed)
                  } else {
                    const filed = new Field(
                      struct,
                      propertyName,
                      propertyType,
                      isOptional,
                    )
                    struct.fields.push(filed)
                  }
                } else {
                  const filed = new Field(
                    struct,
                    propertyName,
                    propertyType,
                    isOptional,
                  )
                  struct.fields.push(filed)
                }
              }
            }
          }
          if (declTy.compilerType.flags === TypeFlags.Union) {
            if (this.hasExport.has(structId)) {
              continue
            }
            if (isLiteral(declTy)) {
              const items: EnumItem[] = []
              const enumStruct = new EnumStruct(file, name, declTy)
              for (const union of declTy.getUnionTypes()) {
                if (isString(declCo)) {
                  items.push(new StringEnumItem(enumStruct, union))
                } else if (isNumber(declCo)) {
                  items.push(new NumberEnumItem(enumStruct, union))
                }
              }

              enumStruct.items = items
              file.structs.push(enumStruct)

              this.hasExport.add(structId)
              continue
            }

            if (isString(declCo)) {
            }

            const field = []
            // const struct = new Struct(file, name, file)
            // for (const union of declaration.getType().getUnionTypes()) {
            //   const props = union.getProperties()
            //   console.log(filePath, structId, props.length)
            //   // console.log(interfaceDeclaration?.getMembers().length)
            //   for (const prop of props) {
            //     const key = prop.getName()
            //     const v = prop.getValueDeclaration()?.getType()
            //     console.log(key, v)
            //   }
            // }
            // file.structs.push(new UnknownStruct(structId, name, file, "unknown"))
            // hasExport.add(structId)
            // continue
          }





          if (kind === SyntaxKind.TypeAliasDeclaration) {

            for (const arg of declaration.getType().getAliasTypeArguments()) {
              console.log('arg', arg.getText())
            }

            const aliasType = declTy.getTargetType()
            const isRecord = aliasType?.getText() === 'Record<K, T>'
            if (isRecord) {
              if (aliasType?.getText().includes("Record<string, string>")) {
                const hm = new HashMapStruct(file, name, declTy, 'String', "String")
                file.structs.push(hm)
                this.hasExport.add(structId)
              } else {
                const hm = new HashMapStruct(file, name, declTy, 'any', "any")
                file.structs.push(hm)
                this.hasExport.add(structId)
              }
            }
            console.log('alias: ', structId, declaration.getFullText(), declaration.getType().isObject(), declaration.compilerNode.name.text)
          }
        }
      }
    })

    this.files.push(file)
    return file
  }



  tsStringTypeToRustType(structId: string, self: Struct, optional = false) {
    let vecDim = 0
    let name = structId
    while (name.endsWith("[]")) {
      vecDim += 1
      name = name.slice(0, -2)
    }

    while (name.startsWith("Array<") && name.endsWith(">")) {
      vecDim += 1
      name = name.slice(6, -1)
    }

    if (BuiltInStruct[name]) {
      return BuiltInStruct[name]
    }

    const st = this.findStruct(name)

    if (!st) {
      throw new Error(`not found struct: ${name}`)
    }

    name = st.name
    if (st.id === name) {
      name = `Box<${name}>`
    }
    while (vecDim) {
      structId = `Vec<${name}>`
      vecDim--
    }

    if (optional) {
      name = `Option<${name}>`
    }
    return name
  }
}
