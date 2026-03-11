"use client";

import React, { useEffect, useId, useMemo, useRef } from "react";
import { readFileAsDataUrl } from "./newsUtils";

declare global {
  interface Window {
    tinymce?: {
      get: (id: string) => TinyMceEditorInstance | null;
      init: (config: Record<string, unknown>) => void;
      remove: (selectorOrEditor: string | unknown) => void;
    };
  }
}

type TinyMceEditorInstance = {
  getContent: () => string;
  setContent: (content: string) => void;
  on: (event: string, callback: () => void) => void;
};

type TinyMceEditorProps = {
  value: string;
  onChange: (value: string) => void;
  height?: number;
};

const tinyScriptId = "tinymce-cdn-script";

export default function TinyMceEditor({ value, onChange, height = 420 }: TinyMceEditorProps) {
  const reactId = useId();
  const editorId = useMemo(() => `tiny-editor-${reactId.replace(/:/g, "")}`, [reactId]);
  const mountedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    mountedRef.current = true;

    const initEditor = () => {
      if (!window.tinymce) return;
      if (window.tinymce.get(editorId)) return;

      window.tinymce.init({
        selector: `#${editorId}`,
        license_key: "gpl",
        height,
        menubar: false,
        branding: false,
        plugins:
          "advlist autolink lists link image charmap preview searchreplace visualblocks code fullscreen insertdatetime media table help wordcount",
        toolbar:
          "undo redo | formatselect | bold italic underline | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image media link | removeformat code",
        content_style:
          "body { font-family: Poppins, sans-serif; font-size:14px; color:#E5E7EB; background:#111; } h1,h2,h3 { font-family: Cinzel, serif; color:#F5E6C8; } a { color:#D4AF37; }",
        skin: "oxide-dark",
        content_css: "dark",
        setup: (editor: TinyMceEditorInstance) => {
          editor.on("init", () => {
            editor.setContent(valueRef.current || "");
          });
          editor.on("change keyup undo redo", () => {
            onChangeRef.current(editor.getContent());
          });
        },
        file_picker_types: "image",
        file_picker_callback: (callback: (url: string, meta?: Record<string, string>) => void) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const dataUrl = await readFileAsDataUrl(file);
            callback(dataUrl, { title: file.name });
          };
          input.click();
        },
      });
    };

    if (!window.tinymce) {
      const existingScript = document.getElementById(tinyScriptId) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener("load", initEditor, { once: true });
      } else {
        const script = document.createElement("script");
        script.id = tinyScriptId;
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js";
        script.onload = initEditor;
        document.body.appendChild(script);
      }
    } else {
      initEditor();
    }

    return () => {
      mountedRef.current = false;
      if (window.tinymce?.get(editorId)) {
        window.tinymce.remove(`#${editorId}`);
      }
    };
  }, [editorId, height]);

  useEffect(() => {
    if (!mountedRef.current || !window.tinymce) return;
    const editor = window.tinymce.get(editorId);
    if (!editor) return;
    const current = editor.getContent();
    if (current !== value) {
      editor.setContent(value || "");
    }
  }, [editorId, value]);

  return <textarea id={editorId} defaultValue={value} />;
}
