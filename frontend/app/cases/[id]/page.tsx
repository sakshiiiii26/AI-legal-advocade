"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Plus, Loader, AlertCircle, Trash2, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CaseData {
  id: number;
  title: string;
  description: string;
  status: string;
  risk_level: string;
  summary?: string;
  strategy?: string;
  case_number?: string;
  created_at: string;
  updated_at: string;
}

interface SimilarCase {
  case_id: number;
  title: string;
  description: string;
  score: number;
  outcome?: string;
  summary?: string;
}

interface StrategyItem {
  name: string;
  description?: string;
  pros: string[];
  cons: string[];
}

interface TimelineEvent {
  type: string;
  date: string;
  description: string;
}

interface DocumentItem {
  id: number;
  filename: string;
  size_bytes: number;
  upload_date: string;
  case_id: number;
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.id;
  const [activeTab, setActiveTab] = useState("overview");
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [similarCases, setSimilarCases] = useState<SimilarCase[]>([]);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    fetchCaseData();
    fetchTimeline();
    fetchDocuments();
  }, [caseId]);

  const fetchCaseData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/cases/${caseId}`);
      setCaseData(data);

      if (data.strategy) {
        try {
          const parsed = JSON.parse(data.strategy);
          if (Array.isArray(parsed)) {
            setStrategies(parsed.map((s: any) => ({
              name: s.name || s.title || "Strategy",
              description: s.description || "",
              pros: Array.isArray(s.pros) ? s.pros : (s.advantages ? [s.advantages] : []),
              cons: Array.isArray(s.cons) ? s.cons : (s.disadvantages ? [s.disadvantages] : []),
            })));
          }
        } catch {
          const lines = data.strategy.split('\n').filter((l: string) => l.trim());
          if (lines.length > 0) {
            setStrategies([{
              name: "AI Recommended Strategy",
              description: data.strategy,
              pros: [],
              cons: [],
            }]);
          }
        }
      }

      fetchSimilarCases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const data = await apiFetch(`/cases/${caseId}/timeline`);
      setTimeline(data);
    } catch (err) {
      console.error("Failed to fetch timeline", err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await apiFetch(`/documents?case_id=${caseId}`);
      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  const fetchSimilarCases = async () => {
    try {
      const data = await apiFetch(`/cases/${caseId}/similar`);
      setSimilarCases(data);
    } catch {
      // Silently fail
    }
  };

  const handleAnalyze = async () => {
    if (!caseData) return;
    setIsAnalyzing(true);
    try {
      const data = await apiFetch(`/cases/analyze`, {
        method: "POST",
        body: JSON.stringify({
          title: caseData.title,
          description: caseData.description,
          case_id: parseInt(caseId),
        }),
      });
      
      if (data.similar_cases) {
        setSimilarCases(data.similar_cases.filter((sc: SimilarCase) => sc.case_id !== parseInt(caseId)));
      }
      if (data.strategies && Array.isArray(data.strategies)) {
        setStrategies(data.strategies.map((s: any) => ({
          name: typeof s === 'string' ? s : (s.name || "Strategy"),
          description: typeof s === 'string' ? "" : (s.description || ""),
          pros: typeof s === 'string' ? [s] : (s.pros || []),
          cons: typeof s === 'string' ? [] : (s.cons || []),
        })));
      }
      
      // Update case summary and strategies in backend too via PUT or wait for backend to do it
      // Actually backend /analyze doesn't save by default if called manually without background task
      // But we can just fetchCaseData to get latest state
      await fetchCaseData();
    } catch (err) {
      setError("Failed to analyze case");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadedFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("case_id", caseId);

      await apiFetch(`/documents/upload`, {
        method: "POST",
        body: formData,
      });
      setUploadedFile(null);
      import("sonner").then(({ toast }) => toast.success("Document uploaded"));
      fetchDocuments();
      fetchTimeline();
    } catch (err) {
      // toast is handled by apiFetch
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await apiFetch(`/documents/${docId}`, { method: "DELETE" });
      fetchDocuments();
      import("sonner").then(({ toast }) => toast.success("Document deleted"));
    } catch (err) {
      // error handled
    }
  };

  const handleDownloadDocument = (docId: number) => {
    window.open(`${API_BASE_URL}/documents/${docId}/download`, "_blank");
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setIsSavingNote(true);
    try {
      await apiFetch(`/cases/${caseId}/notes`, {
        method: "POST",
        body: JSON.stringify({ text: newNote }),
      });
      setNewNote("");
      fetchTimeline();
      import("sonner").then(({ toast }) => toast.success("Note added"));
    } catch (err) {
      // error handled
    } finally {
      setIsSavingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600 dark:text-gray-400">Loading case...</span>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error || "Case not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {caseData.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Case #{caseData.case_number || caseData.id}
            </p>
          </div>
          <div className="flex gap-2">
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
              caseData.status === "Active"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            }`}>
              {caseData.status}
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
              caseData.risk_level === "High"
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                : caseData.risk_level === "Medium"
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            }`}>
              {caseData.risk_level} Risk
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader className="w-4 h-4 mr-1 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "🔍 AI Analyze"
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">Risk Level</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{caseData.risk_level}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{caseData.status}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">Similar Cases</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{similarCases.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">Strategies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{strategies.length}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex">
          <TabsTrigger value="overview" className="rounded">Overview</TabsTrigger>
          <TabsTrigger value="strategy" className="rounded">Strategy</TabsTrigger>
          <TabsTrigger value="documents" className="rounded">Documents</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded">Timeline</TabsTrigger>
          <TabsTrigger value="notes" className="rounded">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-700 dark:text-gray-300">{caseData.description}</p>
              </div>
              {caseData.summary && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">AI Summary</h4>
                  <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    {caseData.summary}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Similar Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Similar Cases (RAG Retrieved)</CardTitle>
            </CardHeader>
            <CardContent>
              {similarCases.length > 0 ? (
                <div className="space-y-3">
                  {similarCases.map((sc) => (
                    <div key={sc.case_id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <a href={`/cases/${sc.case_id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                            {sc.title}
                          </a>
                          {sc.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{sc.description}</p>
                          )}
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded text-sm font-medium ml-3">
                          {(sc.score * 100).toFixed(0)}% similar
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 dark:text-gray-400 py-6">
                  No similar cases found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          {strategies.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {strategies.map((strategy, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    {strategy.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{strategy.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {strategy.pros.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">✓ Pros</h4>
                        <ul className="space-y-1">
                          {strategy.pros.map((pro, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {typeof pro === 'string' ? pro : JSON.stringify(pro)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {strategy.cons.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">✗ Cons</h4>
                        <ul className="space-y-1">
                          {strategy.cons.map((con, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {typeof con === 'string' ? con : JSON.stringify(con)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">No strategies generated yet.</p>
              </CardContent>
            </Card>
          )}
          
          {caseData.strategy && (
            <Card>
              <CardHeader>
                <CardTitle>Raw AI Strategy Output</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {caseData.strategy}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="w-full mb-4"
                />
                <Button
                  onClick={handleFileUpload}
                  disabled={!uploadedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <><Loader className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" />Upload Document</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Case Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{doc.filename}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.upload_date).toLocaleDateString()} • {(doc.size_bytes / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(doc.id)}>
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteDocument(doc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length > 0 ? (
                <div className="space-y-6">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      {idx !== timeline.length - 1 && (
                        <div className="absolute left-[5px] top-6 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
                      )}
                      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 z-10 ${
                        event.type === 'created' ? 'bg-green-500' :
                        event.type === 'document' ? 'bg-blue-500' :
                        event.type === 'note' ? 'bg-yellow-500' :
                        event.type === 'task' ? 'bg-orange-500' : 'bg-purple-500'
                      }`} />
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-900 dark:text-white">{event.description}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(event.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No events found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Add Case Note</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a new note..."
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                rows={4}
              />
              <Button onClick={handleSaveNote} disabled={isSavingNote || !newNote.trim()} className="mt-4">
                {isSavingNote ? "Saving..." : "Save Note"}
              </Button>
            </CardContent>
          </Card>
          
          {timeline.filter(e => e.type === 'note').length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Previous Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.filter(e => e.type === 'note').map((note, idx) => (
                    <div key={idx} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                      <p className="text-gray-900 dark:text-gray-100">{note.description.replace('Note added: ', '')}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(note.date).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
