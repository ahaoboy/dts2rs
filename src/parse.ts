import { Project, ts, TypeFlags } from "ts-morph"
import { Export, Field, File, Struct } from "./struct"

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
      if (ts.isInterfaceDeclaration(declaration.compilerNode)) {
        const interfaceDeclaration = declaration.asKindOrThrow(
          ts.SyntaxKind.InterfaceDeclaration,
        )

        const structId = declaration.getType().getText()
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
            member.getText().includes("null")
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
          const structId = declaration.getType().getText()
          const struct = new Struct(structId, name, file, "string")
          file.structs.push(struct)
        }

        //
      }
    }
  })

  return file
}
