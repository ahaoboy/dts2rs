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
    <code class="language-typescript">v: number</code>
  </td>
  <td>
    <code class="language-rust">v: f32</code>
  </td>
</tr>
<tr>
  <td>
    <code class="language-typescript">v?: number | null</code>
  </td>
  <td>
    <code class="language-rust">v: Option&lt;f32&gt;</code>
  </td>
</tr>
<tr>
  <td>
    <code class="language-typescript">v: boolean[]</code>
  </td>
  <td>
    <code class="language-rust">v: Vec&lt;bool&gt;</code>
  </td>
</tr>
<tr>
  <td>
    <code class="language-typescript">export interface A{
  a: number
}
export interface B{
  a: A
}</code>
  </td>
  <td>
    <code class="language-rust">pub struct A;
pub struct B{
  a: A
};</code>
  </td>
</tr>
</table>

## todo

- [ ] support any type
- [ ] custom convert function
- [ ] more number type
