import React from 'react';
import { Editor, Viewer } from '@bytemd/react';
import zhHans from "bytemd/lib/locales/zh_Hans.json";  //引入基础中文包
import gfm from "@bytemd/plugin-gfm"; // 支持自动链接文字，删除线，表，任务列表
import gfm_zh from "@bytemd/plugin-gfm/lib/locales/zh_Hans.json";
import highlight from "@bytemd/plugin-highlight-ssr"; // 高亮代码块（与 SSR 兼容）
import mediumZoom from "@bytemd/plugin-medium-zoom"; // 像中一样缩放图像
import "bytemd/dist/index.min.css";
import "highlight.js/styles/vs.css";
import "github-markdown-css";

import "./index.css";

const plugins = [gfm({ locale: gfm_zh }), highlight(), mediumZoom()]

export interface IMDEditor {
  content: string,
  setContent: (value: any) => void
}

export interface IMDViewer {
  content: string
}

export function MDEditor(props: IMDEditor) {
  const { content, setContent } = props;
  return (
    <Editor
      locale={zhHans}
      value={content}
      plugins={plugins}  //markdown中用到的插件，如表格、数学公式、流程图
      onChange={(v: any) => setContent(v)}
      uploadImages={async (files: any) => {
        return files.map((file: any) => ({
          title: file.name,
          url: URL.createObjectURL(file)
        }));
      }}
    />
  )
}

export function MDViewer(props: IMDViewer) {
  return (
    <Viewer
      value={props.content}
      plugins={plugins}
    />
  )
}
