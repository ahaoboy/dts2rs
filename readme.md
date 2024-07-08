## dts2rs

convert typescript to rust

```bash
dts2rs ./examples --outdir=dist-rs
```

## rules

<table style="width: 100%;">
<tr style="width: 100%;">
  <th style="width: 50%;">dts</th>
  <th style="width: 50%;">rust</th>
</tr>
<tr style="width: 100%;">
  <td style="width: 50%;">
<pre lang="typescript">
v: string
</pre>
  </td>
  <td style="width: 50%;">
<pre lang="rust">
v: String
</pre>
  </td>
</tr>
<tr>
  <td>
    <pre lang="typescript">v: number</pre>
  </td>
  <td>
    <pre lang="rust">v: f32</pre>
  </td>
</tr>
<tr>
  <td>
    <pre lang="typescript">v?: number | null</pre>
  </td>
  <td>
    <pre lang="rust">v: Option&lt;f32&gt;</pre>
  </td>
</tr>
<tr>
  <td>
    <pre lang="typescript">v: boolean[]</pre>
  </td>
  <td>
    <pre lang="rust">v: Vec&lt;bool&gt;</pre>
  </td>
</tr>
<tr>
  <td>
    <pre lang="typescript">
export interface A{
  a: number
}
export interface B{
  a: A
}</pre>
  </td>
  <td>
    <pre lang="rust">
pub struct A;

pub struct B{
  a: A
};</pre>
  </td>
</tr>
</table>

## todo

- [ ] support any type
- [ ] custom convert function
- [ ] more number type
