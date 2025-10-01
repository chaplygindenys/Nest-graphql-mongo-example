// src/common/auth-ids.ts
export function getUserId(u: any): string | undefined {
  return u?.userId ?? u?.sub ?? u?._id ?? u?.id;
}
