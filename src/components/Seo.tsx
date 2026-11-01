import { SITE } from '../domain/site';

type SeoProps = {
  title?: string;
  description?: string;
  path: string;
  type?: 'website' | 'article';
};

/** React 19 hoists these tags into <head>; one component keeps every page's meta consistent. */
export function Seo({ title, description = SITE.description, path, type = 'website' }: SeoProps) {
  const fullTitle = title ? `${title} | ${SITE.name}` : SITE.title;
  const url = `${window.location.origin}${path}`;
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary" />
    </>
  );
}
