import Cac from "cac"
import { build } from "./build"

const cli = Cac("dts2rs")

cli
  .command("build <dir>",)
  .option("--derive <type>", 'derive', {
    default: '',
  }).option('--outdir <type>', 'output files dir', {
    default: '.',
  })
  .action(
    (dir, opt) => {
      const derive = opt.derive.split(',') || []
      const outdir = opt.outdir.trim()
      build(dir, {
        derive,
        outdir
      })
    }
  )

cli.help()

cli.parse()