"use client";
// DocSamplePreview.tsx
//
// Renders a hand-pasted static HTML snapshot of the /learn/hello-world spec
// as rendered by `jsonui-doc generate spec` inside a sandboxed iframe.
// The HTML payload is a string constant baked in at author time — no
// build-time dependency on the Python CLI.
//
// To refresh the snapshot:
//   jsonui-doc generate spec docs/screens/json/learn/hello-world.spec.json \
//     -o /tmp/hello-world-sample.html --format html
// layouts_directory auto-detects from jui.config.json, so --layouts-dir is
// not needed — the <section id="structure"> block is populated with the
// imported Layout JSON tree automatically.
// Then re-run the agent pipeline that re-materializes this file, or paste
// the file contents verbatim into RAW_HTML (remembering to escape ` and ${).
//
// Spec: docs/components/json/doc-sample-preview.component.json

import React from "react";

const RAW_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LearnHelloWorld - Hello World</title>
    <style>
        :root {
            --primary-color: #2563eb;
            --bg-color: #f8fafc;
            --text-color: #1e293b;
            --border-color: #e2e8f0;
            --code-bg: #f1f5f9;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background: var(--bg-color);
            padding: 2rem;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 { color: var(--text-color); margin-bottom: 1.5rem; font-size: 2rem; }
        h2 { color: var(--text-color); margin: 2rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--border-color); }
        h3 { color: var(--text-color); margin: 1.5rem 0 0.75rem; }
        h4 { color: #64748b; margin: 1rem 0 0.5rem; }
        section { margin-bottom: 2rem; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem; text-align: left; border: 1px solid var(--border-color); }
        th { background: var(--bg-color); font-weight: 600; }
        tr:hover { background: #f8fafc; }
        code { background: var(--code-bg); padding: 0.2em 0.4em; border-radius: 4px; font-family: 'SF Mono', Monaco, monospace; font-size: 0.9em; }
        pre { background: var(--code-bg); padding: 1rem; border-radius: 8px; overflow-x: auto; font-family: 'SF Mono', Monaco, monospace; font-size: 0.9em; line-height: 1.5; }
        .meta-table { width: auto; }
        .meta-table th { background: transparent; border: none; padding: 0.25rem 1rem 0.25rem 0; }
        .meta-table td { border: none; padding: 0.25rem 0; }
        .component-type { background: var(--bg-color); color: var(--text-color); padding: 0.2em 0.5em; border-radius: 4px; font-size: 0.85em; border: 1px solid var(--border-color); }
        .platform-badge { display: inline-block; padding: 0.15em 0.5em; margin-right: 0.25em; border-radius: 3px; font-size: 0.75em; font-weight: 600; }
        .platform-ios { background: #dbeafe; color: #1e40af; }
        .platform-android { background: #dcfce7; color: #166534; }
        .platform-web { background: #fef3c7; color: #92400e; }
        .platform-override { opacity: 0.75; font-style: italic; }
        /* ViewModel / event-handler collapsible sections */
        details.vm-section { margin: 1rem 0; }
        details.vm-section > summary {
            cursor: pointer;
            font-size: 1.15em;
            font-weight: 600;
            padding: 0.4rem 0.5rem;
            border-left: 3px solid var(--border-color);
            background: var(--code-bg);
            border-radius: 0 4px 4px 0;
            user-select: none;
            margin-bottom: 0.5rem;
            list-style: none;
            display: flex;
            align-items: center;
            gap: 0.4em;
        }
        details.vm-section > summary::-webkit-details-marker { display: none; }
        details.vm-section > summary::before {
            content: "\\25B6";
            font-size: 0.75em;
            transition: transform 0.15s ease;
            display: inline-block;
            color: var(--text-color);
            opacity: 0.5;
        }
        details.vm-section[open] > summary::before {
            transform: rotate(90deg);
        }
        details.vm-section > summary:hover { border-left-color: #3b82f6; }
        .count-badge {
            display: inline-block;
            padding: 0.1em 0.55em;
            border-radius: 10px;
            background: var(--bg-color);
            color: var(--text-color);
            font-size: 0.78em;
            font-weight: 500;
            border: 1px solid var(--border-color);
            margin-left: auto;
        }
        .flag-chip {
            display: inline-block;
            padding: 0.1em 0.45em;
            margin-right: 0.25em;
            border-radius: 3px;
            font-size: 0.75em;
            font-weight: 500;
            background: var(--bg-color);
            color: var(--text-color);
            border: 1px solid var(--border-color);
        }
        .flag-observable { background: #ede9fe; color: #5b21b6; border-color: #ddd6fe; }
        .flag-optional   { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        .flag-readonly   { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
        .section-intro   { color: #64748b; font-size: 0.9em; margin: 0.25rem 0 0.5rem; }
        .layout-tree { background: #1e293b; color: #e2e8f0; padding: 1.5rem; }
        .display-logic { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .notes { color: #64748b; font-style: italic; margin-top: 0.5rem; }
        .http-method { padding: 0.2em 0.5em; border-radius: 4px; font-weight: 600; font-size: 0.85em; }
        .method-get { background: #22c55e; color: white; }
        .method-post { background: #3b82f6; color: white; }
        .method-put { background: #f59e0b; color: white; }
        .method-patch { background: #8b5cf6; color: white; }
        .method-delete { background: #ef4444; color: white; }
        .json { background: #1e293b; color: #e2e8f0; }
        .mermaid { background: white; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; margin: 1rem 0; }
        ul { margin: 0.5rem 0; padding-left: 1.5rem; }
        li { margin: 0.25rem 0; }
        .custom-component-name { background: #fef3c7; color: #92400e; padding: 0.2em 0.5em; border-radius: 4px; font-weight: 600; font-size: 0.9em; }
        .component-link { color: var(--primary-color); text-decoration: none; }
        .component-link:hover { text-decoration: underline; }
        .swatch { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
        .swatch > i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; border: 1px solid rgba(0,0,0,0.15); background-clip: padding-box; flex-shrink: 0; }
        .swatch > code { background: var(--code-bg); padding: 0.1em 0.35em; font-size: 0.85em; }
        .swatch-hex { color: #64748b; font-family: 'SF Mono', Monaco, monospace; font-size: 0.8em; }
        .style-rows { display: flex; flex-direction: column; gap: 0.2rem; }
        .style-row { display: flex; gap: 0.5rem; align-items: flex-start; line-height: 1.5; flex-wrap: wrap; }
        .style-key { color: #64748b; font-weight: 600; font-size: 0.7rem; min-width: 56px; text-transform: uppercase; letter-spacing: 0.04em; padding-top: 0.15rem; flex-shrink: 0; }
        .style-lbl { color: #94a3b8; font-size: 0.75rem; margin-right: 2px; }
        .bind-cell { display: flex; flex-direction: column; gap: 3px; font-size: 0.8rem; line-height: 1.6; }
        .bind-badge { display: inline-block; padding: 0 0.4em; border-radius: 3px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; vertical-align: baseline; }
        .bind-event { background: #fef3c7; color: #92400e; }
        .bind-data { background: #dbeafe; color: #1e40af; }
        .tree-table-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 1.5rem 0 0.5rem; }
        .tree-table-header h3 { margin: 0; }
        .tree-controls button { font: inherit; font-size: 0.8rem; padding: 0.25em 0.75em; margin-left: 0.4rem; border: 1px solid var(--border-color); background: white; color: var(--text-color); border-radius: 4px; cursor: pointer; }
        .tree-controls button:hover { background: var(--bg-color); border-color: #94a3b8; }
        .tree-col { white-space: nowrap; }
        .tree-indent { display: inline-block; vertical-align: middle; }
        .tree-toggle { display: inline-block; width: 16px; text-align: center; cursor: pointer; color: #64748b; font-size: 0.7em; transition: transform 0.15s ease; user-select: none; margin-right: 4px; }
        .tree-toggle:hover { color: var(--primary-color); }
        .tree-toggle.expanded { transform: rotate(90deg); }
        .tree-spacer { display: inline-block; width: 16px; margin-right: 4px; }
        tr.tree-group > td { background: #f8fafc; font-weight: 600; }
        tr.tree-group .tree-group-name { color: var(--text-color); }
        tr.tree-group .tree-group-count { display: inline-block; margin-left: 0.4rem; padding: 0.05em 0.5em; background: var(--border-color); color: #475569; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
        
    </style>
</head>
<body>

<div class="container">
<h1>LearnHelloWorld - Hello World</h1>
<section id="overview">
<h2>Overview</h2>
<p>Learn &gt; Hello World. The five-minute first-screen tutorial. Beginners (audience A) land here from the home hero CTA (/learn/hello-world) and must see text on screen within 5 minutes on at least one of Swift / Kotlin / React. Page is one vertical ScrollView whose per-platform quickstart section is an inline tab switcher driven by activeTab + a Collection of tab headers (T6 pattern, not a root TabView). v1 seeds all content statically in the ViewModel; a DocContentRepository can be added later without changing the public ViewModel contract.</p>
<table class="meta-table">
<tr><th>Created</th><td>2026-04-22</td></tr>
<tr><th>Updated</th><td>2026-04-22</td></tr>
</table>
</section>
<section id="structure">
<h2>Screen Structure</h2>
<div class="tree-wrapper" data-initial-depth="2">
<div class="tree-table-header">
<h3>UI Components</h3>
<div class="tree-controls"><button type="button" class="tree-expand-all">Expand all</button><button type="button" class="tree-collapse-all">Collapse all</button></div>
</div>
<table class="tree-table">
<thead><tr><th>Component</th><th>ID</th><th>Platform</th><th>Description</th><th>Bindings</th><th>Notes</th></tr></thead>
<tbody>
<tr data-row-id="1" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:0px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">View</span></td>
<td><code>learn_hello_world_root</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=matchParent</div><div class="style-row"><span class="style-key">Colors</span><span class="style-lbl">bg:</span><span class="swatch"><i style="background:#F9FAFB"></i><code>#F9FAFB</code></span></div><div class="style-row"><span class="style-key">Shape</span>dir=vertical</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1" data-parent-id="1" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:16px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">Scroll</span></td>
<td><code>learn_hello_world_scroll</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent weight=1</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-1" data-parent-id="1-1" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:32px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">View</span></td>
<td><code>learn_hello_world_header</code></td>
<td>-</td>
<td>-</td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-1-1" data-parent-id="1-1-1" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">View</span></td>
<td><code>-</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Shape</span>dir=horizontal</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-1-1-1" data-parent-id="1-1-1-1">
<td class="tree-col"><span class="tree-indent" style="width:64px"></span><span class="tree-spacer"></span><span class="component-type">Collection</span></td>
<td><code>learn_hello_world_breadcrumb</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>H=wrapContent weight=1</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>items</code> ↔ <code>breadcrumbItems</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-1-2" data-parent-id="1-1-1">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>learn_hello_world_title</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=16</div><div class="style-row"><span class="style-key">Colors</span><span class="style-lbl">fg:</span><span class="swatch"><i style="background:#0B1220"></i><code>#0B1220</code></span></div><div class="style-row"><span class="style-key">Font</span>36</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-1-3" data-parent-id="1-1-1">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>learn_hello_world_lead</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=16</div><div class="style-row"><span class="style-key">Colors</span><span class="style-lbl">fg:</span><span class="swatch"><i style="background:#475467"></i><code>#475467</code></span></div><div class="style-row"><span class="style-key">Font</span>18</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-2" data-parent-id="1-1" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:32px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">View</span></td>
<td><code>learn_hello_world_prereqs</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Colors</span><span class="style-lbl">bg:</span><span class="swatch"><i style="background:#FFFFFF"></i><code>#FFFFFF</code></span></div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-2-1" data-parent-id="1-1-2">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>-</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-2-2" data-parent-id="1-1-2">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>-</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-2-3" data-parent-id="1-1-2">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Collection</span></td>
<td><code>learn_hello_world_prereq_collection</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=32</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>items</code> ↔ <code>prerequisites</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3" data-parent-id="1-1" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:32px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">View</span></td>
<td><code>learn_hello_world_quickstart</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Colors</span><span class="style-lbl">bg:</span><span class="swatch"><i style="background:#F9FAFB"></i><code>#F9FAFB</code></span></div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-1" data-parent-id="1-1-3">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>-</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-2" data-parent-id="1-1-3">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>-</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-3" data-parent-id="1-1-3">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>-</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=24</div><div class="style-row"><span class="style-key">Colors</span><span class="style-lbl">fg:</span><span class="swatch"><i style="background:#475467"></i><code>#475467</code></span></div><div class="style-row"><span class="style-key">Font</span>14</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-4" data-parent-id="1-1-3">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Collection</span></td>
<td><code>learn_hello_world_common_steps</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=12</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>items</code> ↔ <code>commonSteps</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-5" data-parent-id="1-1-3">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>-</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=32</div><div class="style-row"><span class="style-key">Colors</span><span class="style-lbl">fg:</span><span class="swatch"><i style="background:#475467"></i><code>#475467</code></span></div><div class="style-row"><span class="style-key">Font</span>14</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-6" data-parent-id="1-1-3">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Collection</span></td>
<td><code>learn_hello_world_tab_collection</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=12</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>items</code> ↔ <code>platformTabs</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-7" data-parent-id="1-1-3" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">View</span></td>
<td><code>platform_panel_swift</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=24</div><div class="style-row"><span class="style-key">Shape</span>dir=vertical</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>visibility</code> ↔ <code>swiftPanelVisibility</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-7-1" data-parent-id="1-1-3-7">
<td class="tree-col"><span class="tree-indent" style="width:64px"></span><span class="tree-spacer"></span><span class="component-type">Collection</span></td>
<td><code>learn_hello_world_swift_steps</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>items</code> ↔ <code>swiftSteps</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-8" data-parent-id="1-1-3" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">View</span></td>
<td><code>platform_panel_kotlin</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=24</div><div class="style-row"><span class="style-key">Shape</span>dir=vertical</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>visibility</code> ↔ <code>kotlinPanelVisibility</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-8-1" data-parent-id="1-1-3-8">
<td class="tree-col"><span class="tree-indent" style="width:64px"></span><span class="tree-spacer"></span><span class="component-type">Collection</span></td>
<td><code>learn_hello_world_kotlin_steps</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>items</code> ↔ <code>kotlinSteps</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-9" data-parent-id="1-1-3" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">View</span></td>
<td><code>platform_panel_react</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=24</div><div class="style-row"><span class="style-key">Shape</span>dir=vertical</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>visibility</code> ↔ <code>reactPanelVisibility</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-3-9-1" data-parent-id="1-1-3-9">
<td class="tree-col"><span class="tree-indent" style="width:64px"></span><span class="tree-spacer"></span><span class="component-type">Collection</span></td>
<td><code>learn_hello_world_react_steps</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>items</code> ↔ <code>reactSteps</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-4" data-parent-id="1-1" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:32px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">View</span></td>
<td><code>learn_hello_world_next</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Colors</span><span class="style-lbl">bg:</span><span class="swatch"><i style="background:#FFFFFF"></i><code>#FFFFFF</code></span></div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-4-1" data-parent-id="1-1-4">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>-</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-4-2" data-parent-id="1-1-4">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>-</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent</div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-4-3" data-parent-id="1-1-4">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Collection</span></td>
<td><code>learn_hello_world_next_collection</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Margins</span>tm=32</div></div></td>
<td><div class="bind-cell"><div><span class="bind-badge bind-data">bind</span> <code>items</code> ↔ <code>nextSteps</code></div></div></td>
<td>-</td>
</tr>
<tr data-row-id="1-1-5" data-parent-id="1-1" data-has-children="true">
<td class="tree-col"><span class="tree-indent" style="width:32px"></span><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="component-type">View</span></td>
<td><code>learn_hello_world_footer</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Colors</span><span class="style-lbl">bg:</span><code>chrome_fill</code></div></div></td>
<td>-</td>
<td>-</td>
</tr>
<tr data-row-id="1-1-5-1" data-parent-id="1-1-5">
<td class="tree-col"><span class="tree-indent" style="width:48px"></span><span class="tree-spacer"></span><span class="component-type">Label</span></td>
<td><code>-</code></td>
<td>-</td>
<td><div class="style-rows"><div class="style-row"><span class="style-key">Size</span>W=matchParent H=wrapContent</div><div class="style-row"><span class="style-key">Colors</span><span class="style-lbl">fg:</span><span class="swatch"><i style="background:#94A3B8"></i><code>#94A3B8</code></span></div><div class="style-row"><span class="style-key">Font</span>12</div></div></td>
<td>-</td>
<td>-</td>
</tr>
</tbody></table>
</div>
<h3>Layout Structure</h3>
<pre class="layout-tree">
learn_hello_world_root
└── learn_hello_world_scroll
</pre>
</section>
<section id="dataflow">
<h2>Data Flow</h2>
<pre class="mermaid">
flowchart TD
    VIEW[LearnHelloWorldView] --> VM[LearnHelloWorldViewModel]
    VM -- breadcrumbItems --> VIEW
    VM -- prerequisites --> VIEW
    VM -- platformTabs --> VIEW
    VM -- activeTab --> VIEW
    VM -- nextSteps --> VIEW
    VIEW -- onAppear --> VM
    VIEW -- onSelectTab(id) --> VM
    VIEW -- onNavigate(url) --> VM
</pre>
<h3>ViewModel</h3>
<details class="vm-section" open><summary class="vm-section-header">Methods <span class="count-badge">3</span></summary>
<table>
<thead><tr><th>Signature</th><th>Platforms</th><th>Description</th></tr></thead>
<tbody>
<tr><td><code>onAppear()</code></td><td><em title="Imported into all platforms">all</em></td><td>Seed breadcrumbItems (2 rows: Learn › Hello World), prerequisites (3 required tools), commonSteps (5 cross-platform steps rendered above the tab switcher), platformTabs (Swift / Kotlin / React — each with a short platform-specific [QuickstartStep] list for VM + run + live-reload), and nextSteps (2–3 follow-up cards) from module-scope static catalogs. Every string is resolved through StringManager with the learn_hello_world_ prefix. activeTab is left at its initial &#x27;react&#x27; value.</td></tr>
<tr><td><code>onSelectTab(id: String)</code></td><td><em title="Imported into all platforms">all</em></td><td>Set \`activeTab\` to the tapped PlatformTab.id (&#x27;swift&#x27; | &#x27;kotlin&#x27; | &#x27;react&#x27;). The displayLogic block derives three *PanelVisibility strings from activeTab so exactly one platform&#x27;s steps are visible at a time; the VM doesn&#x27;t set those explicitly — the generated component does via the layout&#x27;s visibility bindings.</td></tr>
<tr><td><code>onNavigate(url: String)</code></td><td><em title="Imported into all platforms">all</em></td><td>router.push(url). Hit by NextStepLink and BreadcrumbItem taps.</td></tr>
</tbody></table>
</details>
<details class="vm-section" open><summary class="vm-section-header">Vars <span class="count-badge">9</span></summary>
<table>
<thead><tr><th>Declaration</th><th>Flags</th><th>Platforms</th><th>Description</th></tr></thead>
<tbody>
<tr><td><code>var breadcrumbItems: Array(BreadcrumbItem)</code></td><td><span class="flag-chip flag-observable">observable</span></td><td><em title="Imported into all platforms">all</em></td><td>2-row breadcrumb.</td></tr>
<tr><td><code>var prerequisites: Array(Prerequisite)</code></td><td><span class="flag-chip flag-observable">observable</span></td><td><em title="Imported into all platforms">all</em></td><td>3 required-tool rows rendered above the tabs.</td></tr>
<tr><td><code>var commonSteps: Array(QuickstartStep)</code></td><td><span class="flag-chip flag-observable">observable</span></td><td><em title="Imported into all platforms">all</em></td><td>5 cross-platform steps rendered above the platform tabs.</td></tr>
<tr><td><code>var platformTabs: Array(PlatformTab)</code></td><td><span class="flag-chip flag-observable">observable</span></td><td><em title="Imported into all platforms">all</em></td><td>3 tab-header rows; each owns its own *platform-specific* steps list (ViewModel + run + live-reload).</td></tr>
<tr><td><code>var activeTab: String</code></td><td><span class="flag-chip flag-observable">observable</span></td><td><em title="Imported into all platforms">all</em></td><td>Currently visible tab id. Defaults to &#x27;react&#x27; (the web-shipping platform).</td></tr>
<tr><td><code>var nextSteps: Array(NextStepLink)</code></td><td><span class="flag-chip flag-observable">observable</span></td><td><em title="Imported into all platforms">all</em></td><td>2–3 follow-up tutorial cards below the platform panels.</td></tr>
<tr><td><code>var swiftPanelVisibility: String</code></td><td><span class="flag-chip flag-observable">observable</span></td><td><em title="Imported into all platforms">all</em></td><td>Derived visibility from displayLogic; set by the layout&#x27;s binding, not the VM.</td></tr>
<tr><td><code>var kotlinPanelVisibility: String</code></td><td><span class="flag-chip flag-observable">observable</span></td><td><em title="Imported into all platforms">all</em></td><td>Same as above.</td></tr>
<tr><td><code>var reactPanelVisibility: String</code></td><td><span class="flag-chip flag-observable">observable</span></td><td><em title="Imported into all platforms">all</em></td><td>Same as above.</td></tr>
</tbody></table>
</details>
</section>
<section id="state">
<h2>State Management</h2>
<details class="vm-section" open><summary class="vm-section-header">UI Data Variables <span class="count-badge">12</span></summary>
<table>
<thead><tr><th>Variable</th><th>Type</th><th>Description</th><th>Notes</th></tr></thead>
<tbody>
<tr><td><code>breadcrumbItems</code></td><td>[BreadcrumbItem]</td><td>Two-entry breadcrumb row: Learn / Hello World. Seeded by onAppear.</td><td>-</td></tr>
<tr><td><code>prerequisites</code></td><td>[Prerequisite]</td><td>Three required-tool rows (Node, macOS or JDK, a browser) rendered above the platform tabs. Seeded by onAppear.</td><td>-</td></tr>
<tr><td><code>commonSteps</code></td><td>[QuickstartStep]</td><td>Steps that are identical across Swift / Kotlin / React: install the CLI, create a platform project (prose-only pointer), run \`jui init\` with the right flag, author the layout, \`jui build\` + \`jui verify --fail-on-diff\`. Rendered above the platform tabs so readers only see platform-specific commands once they pick their stack.</td><td>-</td></tr>
<tr><td><code>platformTabs</code></td><td>[PlatformTab]</td><td>Tab-header data for the inline platform switcher. Exactly three entries: Swift / Kotlin / React. Each entry carries its own ordered [QuickstartStep] list of *platform-specific* steps only (ViewModel wiring + running the app + live-reload via \`jui hotload listen\` for mobile); the common install / init / author / build steps live in \`commonSteps\`.</td><td>-</td></tr>
<tr><td><code>activeTab</code></td><td>String</td><td>Id of the currently selected platform tab (&#x27;swift&#x27; | &#x27;kotlin&#x27; | &#x27;react&#x27;). Defaults to &#x27;react&#x27; because the documentation site itself ships web-only (platforms: [&#x27;web&#x27;]) and React is the fastest route to a running Hello World for a web-only reader. Bound by visibility expressions in the layout to reveal exactly one platform&#x27;s steps.</td><td>-</td></tr>
<tr><td><code>nextSteps</code></td><td>[NextStepLink]</td><td>Two to three follow-up tutorial cards rendered below the platform tabs (Guides index, First screen, Data binding basics). Seeded by onAppear.</td><td>-</td></tr>
<tr><td><code>swiftPanelVisibility</code></td><td>String</td><td>(from binding)</td><td>-</td></tr>
<tr><td><code>swiftSteps</code></td><td>String</td><td>(from binding)</td><td>-</td></tr>
<tr><td><code>kotlinPanelVisibility</code></td><td>String</td><td>(from binding)</td><td>-</td></tr>
<tr><td><code>kotlinSteps</code></td><td>String</td><td>(from binding)</td><td>-</td></tr>
<tr><td><code>reactPanelVisibility</code></td><td>String</td><td>(from binding)</td><td>-</td></tr>
<tr><td><code>reactSteps</code></td><td>String</td><td>(from binding)</td><td>-</td></tr>
</tbody></table>
</details>
<details class="vm-section" open><summary class="vm-section-header">View-local Event Handlers <span class="count-badge">3</span></summary>
<p class="section-intro">Handlers kept inside the View layer. ViewModel public API lives under <code>dataFlow.viewModel</code>.</p>
<table>
<thead><tr><th>Handler</th><th>Description</th><th>Notes</th></tr></thead>
<tbody>
<tr><td><code>onAppear</code></td><td>Populate breadcrumbItems, prerequisites, commonSteps (5 cross-platform steps: install / create-platform / jui init / author / build+verify), platformTabs (each with a short platform-specific [QuickstartStep] list covering VM + run + live-reload), and nextSteps with the static v1 catalog. All user-visible strings inside those catalogs are @string/... keys so localization flows through StringManager.</td><td>-</td></tr>
<tr><td><code>onSelectTab</code></td><td>Switch the inline platform switcher (T6 pattern). Sets activeTab to &#x27;swift&#x27; | &#x27;kotlin&#x27; | &#x27;react&#x27;. The tab-header Collection binds each row&#x27;s onClick to this handler; the bound id comes from the row&#x27;s PlatformTab.id.</td><td>-</td></tr>
<tr><td><code>onNavigate</code></td><td>Handle taps on a NextStepLink card or an in-page breadcrumb entry. The bound URL is supplied per row by Collection binding.</td><td>-</td></tr>
</tbody></table>
</details>
<h3>Display Logic</h3>
<pre class="display-logic">
activeTab == &#x27;swift&#x27;:
  - platform_panel_swift: visible [variable: swiftPanelVisibility]

activeTab == &#x27;kotlin&#x27;:
  - platform_panel_kotlin: visible [variable: kotlinPanelVisibility]

activeTab == &#x27;react&#x27;:
  - platform_panel_react: visible [variable: reactPanelVisibility]

</pre>
</section>
<section id="actions">
<h2>User Actions</h2>
<table>
<thead><tr><th>Action</th><th>Processing</th><th>Destination</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>Select a platform tab (Swift / Kotlin / React)</td><td>onSelectTab(id) is invoked with the bound PlatformTab.id. ViewModel sets activeTab, and the displayLogic entries flip the matching platform_panel_* visibility.</td><td>-</td><td>-</td></tr>
<tr><td>Copy a code example</td><td>Handled inside the CodeBlock converter itself (built-in copy button). The optional onCopy event on CodeBlock is not wired here; copying does not depend on it.</td><td>-</td><td>-</td></tr>
<tr><td>Tap a Next step card</td><td>onNavigate(url) is invoked with the bound NextStepLink.url from the Collection row.</td><td>-</td><td>-</td></tr>
<tr><td>Tap the Learn breadcrumb</td><td>onNavigate(url) is invoked with BreadcrumbItem.url (&#x27;/learn&#x27;).</td><td>-</td><td>-</td></tr>
</tbody></table>
</section>
<section id="validation">
<h2>Validation</h2>
</section>
<section id="transitions">
<h2>Transitions</h2>
<table>
<thead><tr><th>Condition</th><th>Destination</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>url is any spec-mapped URL</td><td>Target spec screen resolved from url</td><td>-</td></tr>
</tbody></table>
</section>
<section id="files">
<div class="tree-wrapper" data-initial-depth="0">
<div class="tree-table-header">
<h2>Related Files</h2>
<div class="tree-controls"><button type="button" class="tree-expand-all">Expand all</button><button type="button" class="tree-collapse-all">Collapse all</button></div>
</div>
<table class="tree-table">
<thead><tr><th>Type</th><th>File Path</th><th>Notes</th></tr></thead>
<tbody>
<tr class="tree-group" data-row-id="1" data-has-children="true"><td colspan="3"><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="tree-group-name">Layout</span><span class="tree-group-count">1</span></td></tr>
<tr data-row-id="1-1" data-parent-id="1"><td class="tree-col"><span class="tree-indent" style="width:16px"></span><span class="tree-spacer"></span><code>Layout</code></td><td><code>docs/screens/layouts/learn/hello-world.json</code></td><td>Hello World layout. Single ScrollView at the root with breadcrumb, title, lead, prerequisites Collection, inline platform tab switcher (T6 pattern), three platform panels (one visible at a time via displayLogic), and Next steps Collection.</td></tr>
<tr class="tree-group" data-row-id="2" data-has-children="true"><td colspan="3"><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="tree-group-name">ViewModel</span><span class="tree-group-count">1</span></td></tr>
<tr data-row-id="2-1" data-parent-id="2"><td class="tree-col"><span class="tree-indent" style="width:16px"></span><span class="tree-spacer"></span><code>ViewModel</code></td><td><code>jsonui-doc-web/src/viewmodels/LearnHelloWorldViewModel.ts</code></td><td>Generated by jui g project. Exposes currentLanguage, breadcrumbItems, prerequisites, platformTabs, activeTab, nextSteps; implements onAppear / onSelectTab / onNavigate / onToggleLanguage.</td></tr>
<tr class="tree-group" data-row-id="3" data-has-children="true"><td colspan="3"><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="tree-group-name">View</span><span class="tree-group-count">1</span></td></tr>
<tr data-row-id="3-1" data-parent-id="3"><td class="tree-col"><span class="tree-indent" style="width:16px"></span><span class="tree-spacer"></span><code>View</code></td><td><code>jsonui-doc-web/src/app/learn/hello-world/page.tsx</code></td><td>Next.js App Router page. Dynamic-imports the generated LearnHelloWorldView (thin wrapper; navigation lives in jsonui-navigation-web).</td></tr>
<tr class="tree-group" data-row-id="4" data-has-children="true"><td colspan="3"><span class="tree-toggle" role="button" aria-label="toggle">▶</span><span class="tree-group-name">Model</span><span class="tree-group-count">1</span></td></tr>
<tr data-row-id="4-1" data-parent-id="4"><td class="tree-col"><span class="tree-indent" style="width:16px"></span><span class="tree-spacer"></span><code>Model</code></td><td><code>jsonui-doc-web/src/models/QuickstartStep.ts</code></td><td>Generated TypeScript type for QuickstartStep and the four other custom types declared in dataFlow.customTypes.</td></tr>
</tbody></table>
</div>
</section>
<section id="notes">
<h2>Notes</h2>
<ul>
<li>This is the target of the home hero CTA. KPI from docs/plans/00-overview.md §5: a reader must reach &#x27;text on screen&#x27; within 5 minutes on at least one of Swift / Kotlin / React.</li>
<li>TabView rule deviation (docs/plans/17-spec-templates.md §T8): the three platform variants are content within a single topic, not separate top-level sections. The spec therefore uses the T6 inline-tab pattern (activeTab: String + Collection + cellClasses: [&#x27;cells/tab_header&#x27;]) inside a root ScrollView rather than a root TabView. Home already hosts the site-level TabView; this page sits inside one of its tabs.</li>
<li>metadata.platforms = [&#x27;web&#x27;] mirrors the documentation-site deployment surface (jui.config.json only registers the web platform). The *content* inside the three tabs still covers Swift / Kotlin / React because those are what the reader is learning about, not what this page is rendered to.</li>
<li>Standard components + CodeBlock only. CodeBlock is the one custom type referenced (registered in .jsonui-doc-rules.json and specified at docs/components/json/codeblock.component.json).</li>
<li>All user-visible strings flow through @string/learn_hello_world_* keys into Resources/strings.json for en+ja localization. No paragraph exceeds ~100 chars, so docs/content/{en,ja}/ is not needed for v1; if later copy grows past that, the implementer can migrate paragraphs to docs/content/{en,ja}/learn/hello-world.json without changing this spec.</li>
<li>v1 seeds breadcrumbItems / prerequisites / platformTabs / nextSteps in onAppear with hardcoded @string/... keys. Adding a DocContentRepository later is a pure additive change and does not alter the ViewModel&#x27;s public contract.</li>
<li>activeTab defaults to &#x27;react&#x27; because web-only readers (the default audience of this site) can reach a running Hello World fastest via rjui + Next.js; Swift and Kotlin tabs still render their CodeBlocks identically and are one click away.</li>
<li>QuickstartStep.code is optional because Step 5 (&#x27;What you should see&#x27;) is a prose-only step without a CodeBlock; all other steps will carry code + language + filename at layout authoring time.</li>
</ul>
</section>
</div>

<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
</script>


<script>
(function() {
  function initWrapper(wrapper) {
    const table = wrapper.querySelector('table.tree-table');
    if (!table) return;
    const expanded = new Set();
    const initialDepth = parseInt(wrapper.dataset.initialDepth || '2', 10);
    function rowById(id) { return table.querySelector('tr[data-row-id="' + id + '"]'); }
    function visible(tr) {
      let pid = tr.dataset.parentId;
      while (pid) {
        if (!expanded.has(pid)) return false;
        const p = rowById(pid);
        pid = p ? p.dataset.parentId : null;
      }
      return true;
    }
    function apply() {
      table.querySelectorAll('tr[data-parent-id]').forEach(tr => {
        tr.style.display = visible(tr) ? '' : 'none';
      });
    }
    function updateChevrons() {
      table.querySelectorAll('tr[data-has-children] .tree-toggle').forEach(t => {
        const id = t.closest('tr').dataset.rowId;
        t.classList.toggle('expanded', expanded.has(id));
      });
    }
    function expandAll() {
      table.querySelectorAll('tr[data-has-children]').forEach(tr => expanded.add(tr.dataset.rowId));
      apply(); updateChevrons();
    }
    function collapseAll() { expanded.clear(); apply(); updateChevrons(); }
    // Initial: expand rows whose depth is < initialDepth (row-id dashes < initialDepth)
    table.querySelectorAll('tr[data-has-children]').forEach(tr => {
      const depth = (tr.dataset.rowId.match(/-/g) || []).length;
      if (depth < initialDepth) expanded.add(tr.dataset.rowId);
    });
    table.querySelectorAll('tr[data-has-children] .tree-toggle').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.closest('tr').dataset.rowId;
        if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
        apply(); updateChevrons();
      });
    });
    wrapper.querySelectorAll('.tree-expand-all').forEach(b => b.addEventListener('click', expandAll));
    wrapper.querySelectorAll('.tree-collapse-all').forEach(b => b.addEventListener('click', collapseAll));
    apply(); updateChevrons();
  }
  function init() {
    document.querySelectorAll('.tree-wrapper').forEach(initWrapper);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>

</body>
</html>
`;

export interface DocSamplePreviewProps {
  className?: string;
  id?: string;
  // Children are ignored — DocSamplePreview is a leaf component per spec.
  // Accepted to keep the converter-generated prop shape stable.
  children?: React.ReactNode;
}

export const DocSamplePreview: React.FC<DocSamplePreviewProps> = ({
  className,
  id,
}) => (
  <iframe
    id={id}
    title="Sample generated HTML from jsonui-doc"
    srcDoc={RAW_HTML}
    className={`doc-sample-preview${className ? " " + className : ""}`}
    // `allow-scripts` is required so the inline scripts (mermaid diagram
    // renderer + tree-table toggle) inside the srcDoc execute. Without it
    // the preview shows raw HTML with no JS-driven chrome — the tree is
    // stuck collapsed and the mermaid <pre> never turns into a diagram.
    // Deliberately *omit* `allow-same-origin` so the iframe cannot reach
    // into this document, and *omit* `allow-top-navigation` so nothing in
    // the sample can redirect the user. That's the minimum surface the
    // static snapshot needs.
    sandbox="allow-scripts"
  />
);

export default DocSamplePreview;
