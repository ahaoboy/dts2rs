import {
  InterfaceDeclaration,
  Project,
  SyntaxKind,
  ts,
  Type,
  TypeFlags,
} from "ts-morph"
import {
  ConstNumber,
  ConstString,
  EnumItem,
  EnumStruct,
  Export,
  Field,
  File,
  LiteralUnionStruct,
  NumberEnumItem,
  NumberStruct,
  ObjectStruct,
  StringEnumItem,
  StringField,
  StringStruct,
  Struct,
  UnknownStruct,
} from "./struct"
import { Case } from "change-case-all"
