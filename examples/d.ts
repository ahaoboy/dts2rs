export interface JSONTypeSource {
  kind: "json"
}

export interface SchemaTypeSource {
  kind: "schema"
}

export interface GraphQLTypeSource {
  kind: "graphql"
}

export type TypeSource = GraphQLTypeSource | JSONTypeSource | SchemaTypeSource
