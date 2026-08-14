"use client";

import { useState } from "react";
import { Download, Share2, Copy, Check, FileText, Mail, Printer, Sparkles } from "lucide-react";
import { ActionItemData } from "./ActionItemsList";

interface SummaryData {
  executive_summary?: string;
  key_topics?: string[];
  decisions?: string[];
}

interface ExportShareMenuProps {
  meeting: {
    id: string;
    title: string;
    created_at: string;
    status: string;
    duration_seconds?: number | null;
  };
  summary?: SummaryData | null;
  actionItems?: ActionItemData[];
  transcript?: string | null;
}

export function ExportShareMenu({
  meeting,
  summary,
  actionItems = [],
  transcript,
}: ExportShareMenuProps) {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");

  const formattedDate = new Date(meeting.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Construct structured Markdown text
  const generateMarkdown = () => {
    let md = `# ${meeting.title || "Meeting Summary"}\n`;
    md += `*Date: ${formattedDate}*\n\n`;

    if (summary?.executive_summary) {
      md += `## Executive Summary\n${summary.executive_summary}\n\n`;
    }

    if (summary?.key_topics && summary.key_topics.length > 0) {
      md += `## Key Topics\n`;
      summary.key_topics.forEach((topic) => {
        md += `- ${topic}\n`;
      });
      md += `\n`;
    }

    if (summary?.decisions && summary.decisions.length > 0) {
      md += `## Key Decisions\n`;
      summary.decisions.forEach((dec) => {
        md += `- ${dec}\n`;
      });
      md += `\n`;
    }

    if (actionItems && actionItems.length > 0) {
      md += `## Action Items\n`;
      actionItems.forEach((item) => {
        const check = item.is_completed ? "[x]" : "[ ]";
        const desc = item.description || item.task || "Task";
        const owner = item.owner_name || item.assignee ? ` (@${item.owner_name || item.assignee})` : "";
        const due = item.due_date ? ` [Due: ${item.due_date}]` : "";
        md += `- ${check} ${desc}${owner}${due}\n`;
      });
      md += `\n`;
    }

    if (transcript) {
      md += `## Full Transcript\n${transcript}\n\n`;
    }

    md += `---\n*Generated with BreviAI*\n`;
    return md;
  };

  // Construct Plain Text
  const generatePlainText = () => {
    let txt = `${meeting.title || "Meeting Summary"}\n`;
    txt += `Date: ${formattedDate}\n`;
    txt += `=========================================\n\n`;

    if (summary?.executive_summary) {
      txt += `EXECUTIVE SUMMARY:\n${summary.executive_summary}\n\n`;
    }

    if (summary?.key_topics && summary.key_topics.length > 0) {
      txt += `KEY TOPICS:\n`;
      summary.key_topics.forEach((t, i) => (txt += `  ${i + 1}. ${t}\n`));
      txt += `\n`;
    }

    if (summary?.decisions && summary.decisions.length > 0) {
      txt += `DECISIONS:\n`;
      summary.decisions.forEach((d, i) => (txt += `  ${i + 1}. ${d}\n`));
      txt += `\n`;
    }

    if (actionItems && actionItems.length > 0) {
      txt += `ACTION ITEMS:\n`;
      actionItems.forEach((a, i) => {
        const desc = a.description || a.task || "";
        const status = a.is_completed ? "[DONE]" : "[TODO]";
        txt += `  ${i + 1}. ${status} ${desc}\n`;
      });
      txt += `\n`;
    }

    if (transcript) {
      txt += `TRANSCRIPT:\n${transcript}\n`;
    }

    return txt;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const md = generateMarkdown();
    const safeTitle = (meeting.title || "meeting").toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadFile(md, `${safeTitle}-recap.md`, "text/markdown;charset=utf-8");
  };

  const handleExportText = () => {
    const txt = generatePlainText();
    const safeTitle = (meeting.title || "meeting").toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadFile(txt, `${safeTitle}-recap.txt`, "text/plain;charset=utf-8");
  };

  const handleExportJSON = () => {
    const data = {
      meeting,
      summary,
      action_items: actionItems,
      transcript,
      exported_at: new Date().toISOString(),
      generator: "BreviAI",
    };
    const safeTitle = (meeting.title || "meeting").toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadFile(
      JSON.stringify(data, null, 2),
      `${safeTitle}-recap.json`,
      "application/json"
    );
  };

  const handleCopyMarkdown = async () => {
    const md = generateMarkdown();
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Meeting Notes: ${meeting.title || "Meeting"}`);
    const body = encodeURIComponent(generatePlainText());
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    setShowShareModal(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Copy quick button */}
      <button
        type="button"
        onClick={handleCopyMarkdown}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6D7C7] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#6E584C] hover:bg-[#F6EEE5] hover:text-[#22150E] shadow-sm transition-colors"
        title="Copy Markdown to Clipboard"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied!" : "Copy MD"}
      </button>

      {/* Share / Email Modal Trigger */}
      <button
        type="button"
        onClick={() => setShowShareModal(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6D7C7] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#6E584C] hover:bg-[#F6EEE5] hover:text-[#22150E] shadow-sm transition-colors"
        title="Share or Email Notes"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>

      {/* Export Options Dropdown or Buttons */}
      <div className="relative inline-block text-left group">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#B85414] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#9C430C] transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>

        <div className="absolute right-0 mt-1 w-44 origin-top-right rounded-xl border border-[#E6D7C7] bg-[#FFFFFF] shadow-lg py-1 z-50 hidden group-hover:block hover:block">
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-[#22150E] hover:bg-[#F6EEE5]"
          >
            <FileText className="w-3.5 h-3.5 text-[#B85414]" />
            Markdown (.md)
          </button>
          <button
            type="button"
            onClick={handleExportText}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-[#22150E] hover:bg-[#F6EEE5]"
          >
            <FileText className="w-3.5 h-3.5 text-[#8A7264]" />
            Plain Text (.txt)
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-[#22150E] hover:bg-[#F6EEE5]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97724]" />
            JSON Data (.json)
          </button>
          <div className="my-1 border-t border-[#F0E4D6]" />
          <button
            type="button"
            onClick={handlePrint}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-[#22150E] hover:bg-[#F6EEE5]"
          >
            <Printer className="w-3.5 h-3.5 text-[#6E584C]" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6D7C7] pb-3">
              <h3 className="text-base font-bold text-[#22150E] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#B85414]" />
                Share Meeting Notes
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-xs text-[#8A7264] hover:text-[#22150E]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6E584C]">
              Email these meeting notes and action items directly to your team members or copy the link.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#22150E]">Recipient Email (Optional)</label>
              <input
                type="email"
                placeholder="teammate@company.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E6D7C7] text-xs text-[#22150E] focus:outline-none focus:ring-2 focus:ring-[#B85414]"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleEmailShare}
                className="w-full py-2.5 rounded-lg bg-[#B85414] hover:bg-[#9C430C] text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Open in Email Client
              </button>

              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="w-full py-2 rounded-lg border border-[#E6D7C7] text-xs font-semibold text-[#6E584C] hover:bg-[#F6EEE5] transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied to Clipboard!" : "Copy Full Notes (Markdown)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
