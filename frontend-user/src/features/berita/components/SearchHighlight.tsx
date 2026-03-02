'use client';
/**
 * SearchHighlight — wraps matched substrings in <mark> tags.
 * Usage: <SearchHighlight text={title} query={searchQuery} />
 */
interface Props { text: string; query: string; }

export default function SearchHighlight({ text, query }: Props) {
    if (!query.trim()) return <>{text}</>;
    try {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part)
                        ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">{part}</mark>
                        : <span key={i}>{part}</span>
                )}
            </>
        );
    } catch {
        return <>{text}</>;
    }
}
