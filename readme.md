## dts2rs

convert typescript to rust

```bash
dts2rs ./examples --outdir=dist-rs
```

## rules

<table>
<tr>
  <th>dts</th>
  <th>rust</th>
</tr>
<tr>
  <td>
    <code class="language-typescript">v: string</code>
  </td>
  <td>
    <code class="language-rust">v: String</code>
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
    <code class="language-typescript">
export interface A{
  a: number
}
<br>
export interface B{
  a: A
}
    </code>
  </td>
  <td>
    <code class="language-rust">
pub struct A;
<br>
pub struct B{
  a: A
};
    </code>
  </td>
</tr>
</table>

## todo

- [ ] support any type
- [ ] custom convert function
- [ ] more number type
