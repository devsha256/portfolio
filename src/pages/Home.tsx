import { Seo } from '../components/Seo';
import { SITE } from '../domain/site';

export default function Home() {
  return (
    <section className="py-16">
      <Seo path="/" />
      <h1 className="text-5xl font-semibold tracking-tight">{SITE.name}</h1>
    </section>
  );
}
