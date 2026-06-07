"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Search, Loader, AlertCircle, CheckCircle2, Eye, ShieldCheck, Download, Trash2 } from "lucide-react";
import { apiFetch, API_BASE_URL } from "@/lib/api";

interface Document {
  id: number;
  filename: string;
  sha256_hash: string;
  upload_date: string;
  size_bytes?: number;
  summary?: string;
  key_clauses?: string;
  risk_points?: string;
  case_id?: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string>("");
  const [summarizing, setSummarizing] = useState<number | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const verifyInputRef = useRef<HTMLInputElement>(null);
  const [docToVerify, setDocToVerify] = useState<number | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await apiFetch("/documents");
      const normalizedData = data.map((d: any) => ({
        ...d,
        filename: d.filename || d.file_name,
        upload_date: d.upload_date || d.uploaded_at,
      }));
      setDocuments(normalizedData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) {
      setUploadError("No files selected");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      for (const file of files) {
        const fileFormData = new FormData();
        fileFormData.append("file", file);
        if (caseId) fileFormData.append("case_id", caseId);

        await apiFetch(`/documents/upload`, {
          method: "POST",
          body: fileFormData,
        });
      }
      import("sonner").then(({ toast }) => toast.success("Documents uploaded"));
      fetchDocuments();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      // toast is handled by apiFetch
    } finally {
      setUploading(false);
    }
  };

  const handleSummarizeDocument = async (docId: number) => {
    setSummarizing(docId);

    try {
      const summary = await apiFetch(`/documents/summarize`, {
        method: "POST",
        body: JSON.stringify({ document_id: docId }),
      });

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                summary: summary.summary,
                key_clauses: summary.key_clauses,
                risk_points: summary.risk_points,
              }
            : doc
        )
      );
    } catch (err) {
      // error handled
    } finally {
      setSummarizing(null);
    }
  };

  const handleVerifySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!docToVerify) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setVerifying(docToVerify);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await apiFetch(`/documents/verify?document_id=${docToVerify}`, {
        method: "POST",
        body: formData,
      });

      import("sonner").then(({ toast }) => {
        if (response.verified) {
          toast.success("Document Verified", { description: "The hash matches the original uploaded document." });
        } else {
          toast.error("Verification Failed", { description: "The document hash does not match the original record." });
        }
      });
    } catch (err) {
      // error handled
    } finally {
      setVerifying(null);
      setDocToVerify(null);
      if (verifyInputRef.current) {
        verifyInputRef.current.value = "";
      }
    }
  };

  const triggerVerify = (docId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocToVerify(docId);
    if (verifyInputRef.current) {
      verifyInputRef.current.click();
    }
  };

  const handleDeleteDocument = async (docId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await apiFetch(`/documents/${docId}`, { method: "DELETE" });
      fetchDocuments();
      import("sonner").then(({ toast }) => toast.success("Document deleted"));
    } catch (err) {
      // error handled
    }
  };

  const handleDownloadDocument = (docId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`${API_BASE_URL}/documents/${docId}/download`, "_blank");
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document AI</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Upload, analyze, and extract insights from legal documents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Case ID
              </label>
              <Input
                type="number"
                placeholder="Enter case ID (optional)"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Drag and drop or click to upload
              </p>
              <label className="inline-block">
                <div className={`inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium cursor-pointer transition-colors hover:bg-muted ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Browse Files
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported: PDF, DOC, DOCX, JPG, PNG, TIFF (max 50MB)
            </p>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <input
            ref={verifyInputRef}
            type="file"
            className="hidden"
            onChange={handleVerifySelect}
          />

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">No documents uploaded yet</p>
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSummarizeDocument(doc.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {doc.filename}
                          </h4>
                          {doc.summary && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(doc.upload_date).toLocaleDateString()}
                          {doc.size_bytes ? ` • ${(doc.size_bytes / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => triggerVerify(doc.id, e)}
                          disabled={verifying === doc.id}
                        >
                          {verifying === doc.id ? (
                            <Loader className="w-4 h-4 animate-spin text-orange-500" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-orange-500" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleDownloadDocument(doc.id, e)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSummarizeDocument(doc.id);
                          }}
                          disabled={summarizing === doc.id}
                        >
                          {summarizing === doc.id ? (
                            <Loader className="w-4 h-4 animate-spin text-blue-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-blue-500" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {doc.summary && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Summary
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {doc.summary}
                          </p>
                        </div>
                        {doc.key_clauses && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Key Clauses
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {doc.key_clauses}
                            </p>
                          </div>
                        )}
                        {doc.risk_points && (
                          <div>
                            <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                              Risk Points
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                              {doc.risk_points}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
