/* ============================================================
   站点内容配置 —— 你只需要改这个文件
   ------------------------------------------------------------
   - SITE  : 站点的名字 / 角色 / 联系方式（首页、关于、页脚共用）
   - PROJECTS: 三个作品项目。每个项目的：
       id      项目唯一标识（用于 project.html?id=xxx）
       title   中文标题
       subtitle 英文/副标题（可选，留空字符串 "" 即可）
       category 分类（如：品牌设计 / 产品设计 / 可视化）
       year    年份
       role    你的角色
       cover   封面图（默认取 images 第一张，可单独改）
       images  该项目全部图片（详情页画廊按此顺序展示）
       desc    项目简介（支持用 \n 分段）
   图片路径已按 assets/<项目>/ 组织好，无需改动。
   ============================================================ */

const SITE = {
  name: "Lynn Zhuang",
  role: "UI/UX设计师 · AIGC / 产品 / 动效",
  email: "1729965094@qq.com",
  socials: [
    { label: "Behance", url: "#" },
    { label: "Instagram", url: "#" },
    { label: "小红书", url: "#" },
    { label: "微信", url: "#" }
  ],
  intro: "我擅长将复杂的业务逻辑，转化为清晰、克制、有秩序的设计体验。\n\n以下是我近期的作品。"
};

const PROJECTS = [
  {
    id: "aes",
    title: "顾问查询系统",
    subtitle: "AES Project",
    category: "B端系统",
    year: "2026",
    role: "UX/UI设计师",
    scope: "29 个页面",
    cover: "assets/AES/1.png",
    images: [
      "assets/AES/1.png",
      "assets/AES/2.gif",
      "assets/AES/3.png",
      "assets/AES/4.png",
      "assets/AES/5.png"
    ],
    desc: "## 项目背景\n原系统存在信息层级混乱、布局效率低、视觉规范不统一等问题，影响顾问日常的信息查询与业务操作。\n\n本次改版围绕「信息更清晰、操作更高效、视觉更统一」三大目标，对系统进行全面的 UI/UX 优化。\n\n## 项目结果\n29 个页面完成重构，统一组件与视觉规范；通过首页数据可视化、信息架构优化及响应式设计，提升核心信息的可读性与操作效率，实现从「功能可用」到「体验优化」的升级。"
  },
  {
    id: "ocr",
    title: "OCR Platform",
    subtitle: "OCR Project",
    category: "B端系统",
    year: "2025",
    role: "UX/UI设计师",
    scope: "58 个页面",
    cover: "assets/OCR/1.png",
    images: [
      "assets/OCR/1.png",
      "assets/OCR/2.png",
      "assets/OCR/33.gif",
      "assets/OCR/3.png",
      "assets/OCR/4.png",
      "assets/OCR/5.png",
      "assets/OCR/6.png",
      "assets/OCR/7.png"
    ],
    desc: "## 项目背景\n传统纸质保单依赖人工录入，耗时且易出错，难以满足高效、规模化的信息处理需求。项目通过 OCR 将纸质信息数字化，并与内部系统对接，优化核保人员的信息录入流程。\n\n## 我的角色\nUI/UX Designer\n利用 AI 辅助全链路分析，将业务需求快速转化为用户流程、功能架构与交互原型，并完成 UI 设计与体验优化，提升设计效率与产品使用效率。"
  },
  {
    id: "cpf",
    title: "Macau CPF Application",
    subtitle: "CPF Project",
    category: "B端系统",
    year: "2026",
    role: "UX/UI设计师",
    scope: "84 个页面",
    cover: "assets/cpf/1.png",
    images: [
      "assets/cpf/1.png",
      "assets/cpf/2.png",
      "assets/cpf/3.png",
      "assets/cpf/4.png",
      "assets/cpf/5.png",
      "assets/cpf/6.png",
      "assets/cpf/7.png",
      "assets/cpf/8.png"
    ],
    desc: "## 项目背景\n现有保险业务系统缺少澳门强积金（CPF）业务流程，申请过程中涉及大量表单信息及业务规则，依赖人工录入与校验，操作链路较长，业务处理效率有待提升。\n\n本次项目将强积金业务整合至现有 SMART 系统。通过 AI 辅助分析官方表单及业务规则，结合现有系统能力，重新梳理业务流程与信息架构，优化申请、填写、校验及提交等核心环节。\n\n## 项目结果\n完成 84 个页面的 UX/UI 设计，构建完整的强积金线上申请流程。\n\n通过表单信息重组、分步填写、字段校验及交互优化，降低复杂业务的操作成本；同时结合 OCR 自动识别与电子签署能力，减少人工录入与重复操作，推动强积金业务从传统人工处理向数字化流程转型。\n\n项目最终形成一套规范、清晰、可落地的强积金业务解决方案，并与现有 SMART 系统实现业务能力衔接。"
  }
];
