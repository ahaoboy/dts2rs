#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, )]
pub struct B{

  pub b1: Box<B>,

  pub b2: Vec<Box<B>>,
}