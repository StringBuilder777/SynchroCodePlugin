const fs = require('fs');
const path = 'src/components/collaborative/CollaborativeChat.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Remove the broken FileEditor definition
const brokenStart = 'function FileEditor({ fileName, serverContent, isMyLock, onChange }: { fileName: string, serverContent: string, isMyLock: boolean, onChange: (fileName: string, content: string) => void }) {';
const brokenEnd = 'export function CollaborativeChat';

const startIndex = content.indexOf(brokenStart);
const endIndex = content.indexOf(brokenEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const prefix = content.substring(0, startIndex);
    const suffix = content.substring(endIndex);
    
    const correctFileEditor = `function FileEditor({ fileName, serverContent, isMyLock, onChange }: { fileName: string, serverContent: string, isMyLock: boolean, onChange: (fileName: string, content: string) => void }) {
  const [localContent, setLocalContent] = useState(serverContent);

  useEffect(() => {
    if (!isMyLock) {
      setLocalContent(serverContent);
    }
  }, [serverContent, isMyLock]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(e.target.value);
    onChange(fileName, e.target.value);
  };

  return (
    <textarea
      className={\`w-full min-h-[200px] whitespace-pre break-all border border-zinc-800 p-2 rounded bg-zinc-900/50 font-mono text-[11px] leading-relaxed custom-scrollbar outline-none resize-y \${isMyLock ? 'text-zinc-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50' : 'text-zinc-400 opacity-80 cursor-not-allowed'}\`}
      value={isMyLock ? localContent : serverContent}
      readOnly={!isMyLock}
      onChange={handleChange}
      spellCheck={false}
    />
  );
}

`;
    content = prefix + correctFileEditor + suffix;
}

// 2. Now replace the textarea inside CollaborativeChat mapping
const mappingTextarea = /<textarea\s+className=\{`w-full min-h-\[200px\] whitespace-pre break-all border border-zinc-800 p-2 rounded bg-zinc-900\/50 font-mono text-\[11px\] leading-relaxed custom-scrollbar outline-none resize-y \$\{isMyLock \? 'text-zinc-200 focus:border-emerald-500\/50 focus:ring-1 focus:ring-emerald-500\/50' : 'text-zinc-400 opacity-80 cursor-not-allowed'\}\`\}\s+value=\{content\}\s+readOnly=\{!isMyLock\}\s+onChange=\{\(e\) => updateContent\(fileName, e\.target\.value\)\}\s+spellCheck=\{false\}\s+\/>/;

content = content.replace(mappingTextarea, `<FileEditor
                  fileName={fileName}
                  serverContent={content}
                  isMyLock={isMyLock}
                  onChange={updateContent}
                />`);

fs.writeFileSync(path, content);
console.log("Fixed CollaborativeChat.tsx and injected FileEditor correctly");
