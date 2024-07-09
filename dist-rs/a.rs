#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, )]
pub struct A{
  #[serde(skip_serializing_if = "Option:: is_none")]
  pub a1: Option<f32>,

  pub a2: String,

  pub a3: bool,
}
pub const A: &str = "a";
pub const B: &str = "b";
pub type AA = String;