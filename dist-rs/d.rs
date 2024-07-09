#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, )]
pub struct JSONTypeSource{

  pub kind: undefined,
}
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, )]
pub struct SchemaTypeSource{

  pub kind: undefined,
}
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, )]
pub struct GraphQLTypeSource{

  pub kind: undefined,
}
pub type TypeSource = String;