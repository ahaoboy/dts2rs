import type { A } from "./a"
import type { B } from "./b"

export interface C {
  a: A
  B: B
  box: C
}
