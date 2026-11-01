import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders post bodies. Raw HTML in Markdown is dropped (skipHtml), so a post can never inject markup.
 * Default export so pages can lazy-load it and keep react-markdown out of the main bundle.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}
