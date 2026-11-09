"use strict";
/*
 * Electron IPC는 구조화 복제(structured clone)로 값을 넘깁니다. 웹소켓(JSON) 위에서 같은 값을
 * 오가게 하려고 바이트 배열·날짜·Map·Set·undefined 등을 표시해서 담습니다.
 * 같은 규칙이 web/shim/electron-shim.js 안에도 있습니다 (둘을 같이 고칠 것).
 */
const TYPED = ["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array"];

function encode(v, seen = new WeakSet()) {
  if (v === undefined) return { $t: "u" };
  if (v === null || typeof v === "boolean" || typeof v === "string") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : { $t: "n", v: String(v) };
  if (typeof v === "bigint") return { $t: "bi", v: v.toString() };
  if (typeof v === "function" || typeof v === "symbol") return { $t: "u" };
  if (seen.has(v)) return null;
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return { $t: "Uint8Array", d: Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString("base64") };
  if (v instanceof ArrayBuffer) return { $t: "ab", d: Buffer.from(v).toString("base64") };
  if (ArrayBuffer.isView(v)) {
    const name = v.constructor && v.constructor.name;
    if (TYPED.includes(name)) return { $t: name, d: Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString("base64") };
    return { $t: "Uint8Array", d: Buffer.from(v.buffer, v.byteOffset, v.byteLength).toString("base64") };
  }
  if (v instanceof Date) return { $t: "date", v: v.getTime() };
  if (v instanceof Error) return { $t: "err", name: v.name, message: v.message };
  if (v instanceof RegExp) return { $t: "re", s: v.source, f: v.flags };
  seen.add(v);
  if (v instanceof Map) return { $t: "map", v: [...v].map(([k, x]) => [encode(k, seen), encode(x, seen)]) };
  if (v instanceof Set) return { $t: "set", v: [...v].map((x) => encode(x, seen)) };
  if (Array.isArray(v)) return v.map((x) => encode(x, seen));
  const out = {};
  for (const k of Object.keys(v)) {
    const x = v[k];
    if (typeof x === "function" || typeof x === "symbol") continue;
    out[k] = encode(x, seen);
  }
  if (Object.prototype.hasOwnProperty.call(out, "$t")) return { $t: "obj", v: out };
  return out;
}

function decode(v) {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(decode);
  if (typeof v.$t === "string") {
    switch (v.$t) {
      case "u": return undefined;
      case "n": return Number(v.v);
      case "bi": return BigInt(v.v);
      case "ab": { const b = Buffer.from(v.d, "base64"); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); }
      case "date": return new Date(v.v);
      case "err": { const e = new Error(v.message); e.name = v.name; return e; }
      case "re": return new RegExp(v.s, v.f);
      case "map": return new Map(v.v.map(([k, x]) => [decode(k), decode(x)]));
      case "set": return new Set(v.v.map(decode));
      case "obj": { const o = {}; for (const k of Object.keys(v.v)) o[k] = decode(v.v[k]); return o; }
      default:
        if (TYPED.includes(v.$t)) {
          const b = Buffer.from(v.d, "base64");
          const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
          if (v.$t === "Uint8Array") return Buffer.from(ab); // 메인 코드는 Buffer를 기대하는 경우가 많음
          return new globalThis[v.$t](ab);
        }
    }
  }
  const o = {};
  for (const k of Object.keys(v)) o[k] = decode(v[k]);
  return o;
}

module.exports = { encode, decode };
