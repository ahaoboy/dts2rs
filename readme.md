## dts2rs

convert typescript to rust

```bash
dts2rs ./examples --outdir=dist-rs
```

## rules

### string/number/boolean
```ts
s: string
n: number
b: boolean
```
```rs
s: String
n: f32
b: bool
```

### Optional

```ts
v?: number | null
```

```rs
v: Option<f32>
```

### Array
```ts
v: boolean[]
```
```rs
v: Vec<bool>
```

### struct
```ts
export interface A{
  a: number
}
export interface B{
  a: A
}
```

```rs
pub struct A;
pub struct B{
  a: A
};
```
### HashMap
```ts
export interface A{
  a: { [key: string]: string; }
}
```

```rs
pub struct A{
  a: std::collections::HashMap<String, String>
}
```

## Who's Using dts2rs?
- [serde-jellyfin](https://github.com/ahaoboy/serde-jellyfin)

## todo

- [ ] support any type
- [ ] custom convert function
- [ ] more number type
