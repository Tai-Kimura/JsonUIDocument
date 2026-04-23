// Debug harness for the CodeBlock extension component.
// NOT a real screen — no spec governs this route. Delete or gate behind a flag
// before public deploy. Used during implementation to visually verify all prop
// combinations of the component spec at docs/components/json/codeblock.component.json.

"use client";

import { CodeBlock } from "@/components/extensions/CodeBlock";

const TS_SAMPLE = `// A tiny TypeScript sample.
import { useState } from "react";

interface CounterProps {
  initial?: number;
}

export function Counter({ initial = 0 }: CounterProps) {
  const [count, setCount] = useState<number>(initial);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      clicked {count} times
    </button>
  );
}
`;

const BASH_SAMPLE = `# install the CLI
npm install -g @jsonui/cli
jui init
jui g screen Home`;

const LONG_LINE = `const reallyLong = "this is a deliberately very very very very very very very very very very very very very long single line to demonstrate horizontal scrolling vs wrapLines behavior";`;

export default function CodeBlockDebugPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 p-8">
      <h1 className="text-2xl font-semibold">CodeBlock debug harness</h1>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-700">1. Minimal (language only)</h2>
        <CodeBlock code={`const x = 1;`} language="typescript" />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-700">
          2. With filename + line numbers + highlight
        </h2>
        <CodeBlock
          code={TS_SAMPLE}
          language="typescript"
          filename="src/components/Counter.tsx"
          showLineNumbers
          highlightLines={[3, 9]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-700">
          3. startLine offset (gutter starts at 42, highlight is still 1-indexed on code)
        </h2>
        <CodeBlock
          code={TS_SAMPLE}
          language="typescript"
          filename="excerpt.ts"
          showLineNumbers
          startLine={42}
          highlightLines={[1]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-700">4. Bash, not copyable</h2>
        <CodeBlock
          code={BASH_SAMPLE}
          language="bash"
          filename="shell"
          copyable={false}
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-700">5. wrapLines=false (default) — horizontal scroll</h2>
        <CodeBlock code={LONG_LINE} language="typescript" />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-700">6. wrapLines=true — soft wrap</h2>
        <CodeBlock code={LONG_LINE} language="typescript" wrapLines />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-700">
          7. maxHeight=120 — vertical scroll cap
        </h2>
        <CodeBlock
          code={TS_SAMPLE + TS_SAMPLE}
          language="typescript"
          filename="tall.ts"
          showLineNumbers
          maxHeight={120}
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-700">
          8. theme override — github-light
        </h2>
        <CodeBlock
          code={TS_SAMPLE}
          language="typescript"
          filename="light-theme.ts"
          showLineNumbers
          theme="github-light"
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-700">
          9. language=&quot;text&quot; — no highlighting, still renders gutter
        </h2>
        <CodeBlock
          code={"first line\nsecond line\nthird line"}
          language="text"
          showLineNumbers
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-700">10. onCopy analytics hook</h2>
        <CodeBlock
          code={`console.log("hello from onCopy");`}
          language="typescript"
          onCopy={(c) => console.log("[debug] onCopy fired:", c)}
        />
      </section>
    </div>
  );
}
