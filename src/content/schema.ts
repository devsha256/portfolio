import { z } from 'zod';

export const Credential = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  authority: z.string().min(1),
  date: z.iso.date(),
  credentialId: z.string().optional(),
  image: z.string().regex(/^\/img\//),
  link: z.url().optional(),
  proof: z.url(),
});
export type Credential = z.infer<typeof Credential>;

const CredentialList = z.array(Credential);

/** Validates bundled JSON once and orders it newest first for display. */
export function credentialsFrom(data: unknown): Credential[] {
  return CredentialList.parse(data).sort((a, b) => b.date.localeCompare(a.date));
}
