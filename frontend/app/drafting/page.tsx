"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, Loader, AlertCircle, Mail } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ReactMarkdown from "react-markdown";

const tones = ["Formal", "Aggressive", "Neutral", "Persuasive"];

const draftTypes = [
  {
    id: "notice",
    title: "Legal Notice",
    description: "Formal legal notice for disputes",
    fields: [
      { name: "recipient_name", label: "Recipient Name", type: "text", required: true },
      { name: "recipient_address", label: "Recipient Address", type: "textarea", required: true },
      { name: "subject", label: "Subject Matter", type: "text", required: true },
      { name: "facts", label: "Case Facts", type: "textarea", required: true },
      { name: "demands", label: "Demands/Relief Sought", type: "textarea", required: true },
      { name: "deadline", label: "Response Deadline (days)", type: "number", required: false },
    ],
  },
  {
    id: "petition",
    title: "Petition",
    description: "Court petition for case filing",
    fields: [
      { name: "court_name", label: "Court Name", type: "text", required: true },
      { name: "petitioner_name", label: "Petitioner Name", type: "text", required: true },
      { name: "respondent_name", label: "Respondent Name", type: "text", required: true },
      { name: "case_facts", label: "Case Facts and Background", type: "textarea", required: true },
      { name: "legal_issues", label: "Legal Issues", type: "textarea", required: true },
      { name: "relief_sought", label: "Relief Sought", type: "textarea", required: true },
    ],
  },
  {
    id: "reply",
    title: "Reply",
    description: "Reply to petitions or notices",
    fields: [
      { name: "reply_to", label: "Reply To (Document Title)", type: "text", required: true },
      { name: "sender_name", label: "Sender Name", type: "text", required: true },
      { name: "sender_address", label: "Sender Address", type: "textarea", required: true },
      { name: "response_content", label: "Response Details", type: "textarea", required: true },
      { name: "counter_arguments", label: "Counter Arguments", type: "textarea", required: false },
    ],
  },
];

export default function DraftingPage() {
  const [selectedType, setSelectedType] = useState("");
  const [selectedTone, setSelectedTone] = useState("Formal");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentType = draftTypes.find((t) => t.id === selectedType);

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const canGenerate = () => {
    if (!selectedType || !currentType) return false;
    return currentType.fields
      .filter((f) => f.required)
      .every((f) => formData[f.name]?.trim());
  };

  const handleGenerateDraft = async () => {
    if (!canGenerate() || !currentType) return;

    setIsGenerating(true);
    setError(null);

    try {
      const caseDetails = currentType.fields
        .map((f) => `${f.label}: ${formData[f.name] || ""}`)
        .join("\n");

      const result = await apiFetch(`/drafts/generate`, {
        method: "POST",
        body: JSON.stringify({
          case_details: caseDetails,
          type: currentType.title,
          tone: selectedTone.toLowerCase(),
        }),
      });

      setDraft(result.draft_text || result.draft || "");
      import("sonner").then(({ toast }) => toast.success("Draft generated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDraft = () => {
    const element = document.createElement("a");
    const file = new Blob([draft], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `draft_${selectedType}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Legal Drafting</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Generate professional legal documents with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Document Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {draftTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id);
                    setFormData({});
                    setDraft("");
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedType === type.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-white">{type.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {type.description}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Tone Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tones.map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  className={`w-full p-2 rounded-lg border transition-colors ${
                    selectedTone === tone
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-sm">{tone}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateDraft}
            disabled={!canGenerate() || isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Draft"
            )}
          </Button>
        </div>

        {/* Form and Output */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dynamic Form */}
          {currentType && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentType.title} Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentType.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {field.label}
                      {field.required && <span className="text-red-600">*</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        className="w-full min-h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <Input
                        type={field.type}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Draft Output */}
          {(draft || selectedType) && (
            <Card className="h-96 flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Document</CardTitle>
                  {draft && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyDraft}
                        className={copied ? "bg-green-50" : ""}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadDraft}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const subject = encodeURIComponent(`${currentType?.title || 'Legal Document'} - LexAI`);
                          const body = encodeURIComponent(draft);
                          window.location.href = `mailto:?subject=${subject}&body=${body}`;
                        }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {draft ? (
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold">
                      <ReactMarkdown>{draft}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Fill in the form and click Generate to create your draft
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
