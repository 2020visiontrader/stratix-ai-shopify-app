// @ts-ignore
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import React, { useEffect, useRef } from 'react';

interface GrapesEditorProps {
  initialHtml?: string;
  onSave: (data: { html: string; css: string }) => void;
}

const GrapesEditor: React.FC<GrapesEditorProps> = ({ initialHtml = '', onSave }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = grapesjs.init({
      container: editorRef.current,
      components: initialHtml,
      blockManager: {
        // Blocks will be loaded dynamically from API
      },
      storageManager: false,
      height: '80vh',
      fromElement: false,
      style: '.gjs-one-bg { background: #1E1B2E; }',
    });
    // Load blocks from API
    fetch('/api/theme/sections')
      .then(res => res.json())
      .then((blocks: string[]) => {
        blocks.forEach(block => {
          editor.BlockManager.add(block, {
            label: block.replace('.liquid', ''),
            content: `<div data-section="${block}">${block}</div>`,
          });
        });
      });
    // Save handler
    editor.on('storage:store', () => {
      const html = editor.getHtml();
      const css = editor.getCss();
      onSave({ html, css });
    });
    return () => {
      editor.destroy();
    };
  }, [initialHtml, onSave]);
  return <div ref={editorRef} style={{ height: '80vh', background: '#1E1B2E' }} />;
};

export default GrapesEditor; 