import type { A } from "./base"
import type { B } from "./b"

export interface C {
  a: A
  B: B
  box: C
}
