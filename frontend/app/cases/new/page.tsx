"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Upload, FileText, CheckCircle2, Loader, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface StepProps {
  data: Record<string, unknown>;
  onDataChange: (key: string, value: unknown) => void;
}

const Step1_CaseDetails: React.FC<StepProps> = ({ data, onDataChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Case Title *
        </label>
        <Input
          placeholder="e.g., Smith vs. ABC Corporation"
          value={(data.title as string) || ""}
          onChange={(e) => onDataChange("title", e.target.value)}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Case Description *
        </label>
        <textarea
          placeholder="Provide a detailed description of the case..."
          value={(data.description as string) || ""}
          onChange={(e) => onDataChange("description", e.target.value)}
          className="w-full min-h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Case Number (Optional)
          </label>
          <Input
            placeholder="e.g., case-2024-001"
            value={(data.case_number as string) || ""}
            onChange={(e) => onDataChange("case_number", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Risk Level
          </label>
          <select
            value={(data.risk_level as string) || "Medium"}
            onChange={(e) => onDataChange("risk_level", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const Step2_Documents: React.FC<StepProps> = ({
  data,
  onDataChange,
}) => {
  const uploadedFiles = (data.uploaded_files as Array<{ file: File; id: number }>) || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newFiles = uploadedFiles.concat(
      files.map((f, i) => ({ file: f, id: Date.now() + i }))
    );
    onDataChange("uploaded_files", newFiles);
  };

  const handleRemoveFile = (id: number) => {
    const newFiles = uploadedFiles.filter((f) => f.id !== id);
    onDataChange("uploaded_files", newFiles);
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          Upload Legal Documents
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Support for PDF, DOC, DOCX, JPG, PNG, TIFF - Max 50MB per file
        </p>

        <label className="inline-block">
          <div className={`inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium cursor-pointer transition-colors hover:bg-muted`}>
            <Upload className="w-4 h-4 mr-2" />
            Browse Files
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Selected Files ({uploadedFiles.length})
          </p>
          <div className="space-y-2">
            {uploadedFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {item.file.name}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFile(item.id)}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 dark:text-gray-400">
        💡 Upload all relevant legal documents: court filings, agreements, evidence, proofs, contracts,
        notices, etc.
      </p>
    </div>
  );
};

const Step3_Notes: React.FC<StepProps> = ({ data, onDataChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Initial Notes (Optional)
        </label>
        <textarea
          placeholder="Add any additional notes about this case..."
          value={(data.notes as string) || ""}
          onChange={(e) => onDataChange("notes", e.target.value)}
          className="w-full min-h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Summary (AI will auto-generate, optional override)
        </label>
        <textarea
          placeholder="Case summary..."
          value={(data.summary as string) || ""}
          onChange={(e) => onDataChange("summary", e.target.value)}
          className="w-full min-h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
};

const Step4_Review: React.FC<StepProps> = ({ data }) => {
  const uploadedFiles = (data.uploaded_files as Array<{ file: File }>) || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Case Details</h3>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Title</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{data.title as string}</p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">Description</p>
            <p className="text-sm text-gray-900 dark:text-white">{data.description as string}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Risk Level</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{data.risk_level as string}</p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">Case Number</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {(data.case_number as string) || "—"}
              </p>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Documents to Upload ({uploadedFiles.length})
              </p>
              <ul className="text-sm text-gray-900 dark:text-white space-y-1">
                {uploadedFiles.map((f, i) => (
                  <li key={i}>• {f.file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          ✓ Click "Create Case" to save this case and AI will analyze it for you.
        </p>
      </div>
    </div>
  );
};

export default function NewCasePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    case_number: "",
    risk_level: "Medium",
    notes: "",
    summary: "",
    uploaded_files: [] as Array<{ file: File; id: number }>,
  });

  const canProceed = () => {
    if (step === 1) {
      return !!formData.title && !!formData.description;
    }
    return true;
  };

  const handleDataChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateCase = async () => {
    if (!formData.title || !formData.description) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const casePayload = {
        title: formData.title,
        description: formData.description,
        case_number: formData.case_number || null,
        risk_level: formData.risk_level,
        status: "Active",
        summary: formData.summary || undefined,
      };

      const newCase = await apiFetch("/cases", {
        method: "POST",
        body: JSON.stringify(casePayload),
      });

      // Upload documents if any
      if (formData.uploaded_files.length > 0) {
        for (const item of formData.uploaded_files) {
          if (item.file.size > 50 * 1024 * 1024) {
            throw new Error(`File ${item.file.name} exceeds 50MB limit`);
          }
          const fileFormData = new FormData();
          fileFormData.append("file", item.file);
          fileFormData.append("case_id", newCase.id.toString());
          await apiFetch("/documents/upload", {
            method: "POST",
            body: fileFormData,
          });
        }
      }
      
      // Add initial note if provided
      if (formData.notes) {
        await apiFetch(`/cases/${newCase.id}/notes`, {
          method: "POST",
          body: JSON.stringify({ text: formData.notes }),
        });
      }

      // Redirect to the new case
      router.push(`/cases/${newCase.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Case Details" },
    { number: 2, title: "Documents" },
    { number: 3, title: "Notes" },
    { number: 4, title: "Review" },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Case</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Follow the steps below to create and analyze a new legal case.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                  step >= s.number
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {s.number}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    step > s.number
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          {steps.map((s) => (
            <span key={s.number}>{s.title}</span>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Step {step}: {steps[step - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && <Step1_CaseDetails data={formData} onDataChange={handleDataChange} />}
          {step === 2 && (
            <Step2_Documents
              data={formData}
              onDataChange={handleDataChange}
            />
          )}
          {step === 3 && <Step3_Notes data={formData} onDataChange={handleDataChange} />}
          {step === 4 && <Step4_Review data={formData} onDataChange={handleDataChange} />}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1 || isSubmitting}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="flex-1" />

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCreateCase}
            disabled={isSubmitting || !canProceed()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Create Case
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
