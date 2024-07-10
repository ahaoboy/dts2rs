import fs from "node:fs"
import path from "node:path"
import { Builder, Config } from "./struct"
import { typoSort } from "./share"

export async function build(fileOrDir: string, config: Config) {
  const isDir = fs.lstatSync(fileOrDir).isDirectory()
  const list = isDir
    ? fs.readdirSync(fileOrDir).map((i) => path.join(fileOrDir, i))
    : [fileOrDir]

  const absolutePathList = list.map((i) => path.resolve(i))
  const sortedList = await typoSort(absolutePathList)

  const assets = new Builder(sortedList, config)
  assets.build()
  return assets
}
