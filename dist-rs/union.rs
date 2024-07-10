#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, serde::Serialize, serde::Deserialize)]
pub enum UNumberLiteral{
#[serde(rename = "1")]
_1,
#[serde(rename = "2")]
_2,
}
impl std::fmt::Display for UNumberLiteral {
fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
match self {
Self::_1 => f.write_str("1"),
Self::_2 => f.write_str("2"),
}
}
}
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, serde::Serialize, serde::Deserialize)]
pub enum UStringLiteral{
#[serde(rename = "a")]
A,
#[serde(rename = "b")]
B,
}
impl std::fmt::Display for UStringLiteral {
fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
match self {
Self::A => f.write_str("a"),
Self::B => f.write_str("b"),
}
}
}
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, serde::Serialize, serde::Deserialize)]
pub enum UStringLiteralNumber{
#[serde(rename = "b")]
B,
#[serde(rename = "1a")]
_1a,
}
impl std::fmt::Display for UStringLiteralNumber {
fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
match self {
Self::B => f.write_str("b"),
Self::_1a => f.write_str("1a"),
}
}
}