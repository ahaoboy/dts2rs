import { parseTsFile } from "./parse"

export class Field {
  constructor(
    public struct: Struct,
    public key: string,
    public structId: string,
    public optional = true,
  ) { }
}

export class Struct {
  constructor(
    public id: string,
    public name: string,
    public file: File,
    public builtinName: string | undefined = undefined,
    public fields: Field[] = [],
  ) { }
}


export class LiteralUnion extends Struct {
  public literalList: string[] = []
}

export class BuiltinStruct extends Struct {

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
    public path: string,
    public structs: Struct[] = [],
    public imports: Import[] = [],
    public exports: Export[] = [],
  ) { }

  static fromPath(path: string): File {
    // const file = new File(path)

    return parseTsFile(path)
  }
}

// export class Project {
//   constructor(public files: File[]) {

//   }
// }
