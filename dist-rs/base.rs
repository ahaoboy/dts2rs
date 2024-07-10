#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, serde::Serialize, serde::Deserialize)]
pub struct A{
pub a1: f32;
pub a2: String;
pub a3: bool;
pub a4: serde_json::Value;
pub a5: ();
pub a6: ();
pub '7a': String;
pub "a8": String;
}
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, serde::Serialize, serde::Deserialize)]
pub enum Aa{
#[serde(rename = "a")]
A,
#[serde(rename = "b")]
B,
}
impl std::fmt::Display for Aa {
fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
match self {
Self::A => f.write_str("a"),
Self::B => f.write_str("b"),
}
}
}