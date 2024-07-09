use crate::a::A;
use crate::b::B;




#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, )]
pub struct C{

  pub a: A,
  #[serde(rename = "B")]
  pub b: B,

  pub r#box: Box<C>,
}