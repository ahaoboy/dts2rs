import { Project, ts, TypeFlags } from "ts-morph"
import { Export, Field, File, LiteralUnion, Struct } from "./struct"

const hasExport = new Set<string>()
export function parseTsFile(filePath: string): File {
  const project = new Project({})

  const sourceFile = project.addSourceFileAtPath(filePath)
  const file = new File(filePath)

  for (const decl of sourceFile.getExportDeclarations()) {
    const filePath = decl.getModuleSpecifierSourceFile()?.getBaseName()
    if (filePath) {
      file.exports.push(new Export(filePath, file))
    }
  }

  sourceFile.getExportedDeclarations().forEach((declarations, name) => {
    for (const declaration of declarations) {
      const structId = declaration.getType().getText()
      if (ts.isInterfaceDeclaration(declaration.compilerNode)) {
        const interfaceDeclaration = declaration.asKindOrThrow(
          ts.SyntaxKind.InterfaceDeclaration,
        )

        const fileName = declaration.getSourceFile().getBaseName()

        if (file.exports.find((i) => i.id === fileName)) {
          continue
        }

        const struct = new Struct(structId, name, file)

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
            const text = propertyType.getText()
            const filed = new Field(struct, propertyName, text, isOptional)
            struct.fields.push(filed)
          }
        }
      }

      if (ts.isTypeAliasDeclaration(declaration.compilerNode)) {
        if (declaration.getType().compilerType.flags === TypeFlags.Union) {
          if (hasExport.has(structId)) {
            continue
          }
          const struct = new LiteralUnion(structId, name, file, "string")
          file.structs.push(struct)
          hasExport.add(structId)

          const list = declaration.getType().getUnionTypes().map(i => i.getLiteralValue()?.toString()).filter(i => i !== undefined)
          if (list.length) {
            struct.literalList = list
          }
        }
      }
    }
  })

  return file
}
