"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Upload,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  File,
  Info,
  Plus,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UploadResult {
  row: number
  medicineId?: number
  name?: string
  isNew?: boolean
  status: string
  message: string
}

interface UploadResponse {
  success: boolean
  totalRows: number
  successCount: number
  failureCount: number
  createdCount?: number
  results: UploadResult[]
}

export function BulkMedicineUploadV2() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResponse | null>(null)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [allowCreate, setAllowCreate] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDownloadTemplate = async (version: "v1" | "v2" = "v2") => {
    setDownloadingTemplate(true)
    try {
      const endpoint = version === "v2" 
        ? "/api/distributor/inventory/download-template-v2"
        : "/api/distributor/inventory/download-template"

      const response = await fetch(endpoint)

      if (!response.ok) {
        toast({
          title: "Download failed",
          description: "Failed to download template",
          variant: "destructive",
        })
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `medicines_upload_template_${version}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: `${version === "v2" ? "Enhanced" : "Basic"} template downloaded successfully`,
      })
    } catch (error) {
      console.error("Error downloading template:", error)
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      })
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles?.[0]) {
      setFile(droppedFiles[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("allowCreate", allowCreate ? "true" : "false")

      const response = await fetch("/api/distributor/inventory/bulk-upload-v2", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "Upload failed",
          description: error.error || "Upload failed",
          variant: "destructive",
        })
        return
      }

      const result: UploadResponse = await response.json()
      setUploadResults(result)
      setFile(null)

      const successMessage =
        result.successCount === result.totalRows
          ? "All medicines uploaded successfully!"
          : `${result.successCount} of ${result.totalRows} medicines uploaded. ${result.failureCount} failed.`

      toast({
        title: "Upload completed",
        description: successMessage,
        variant: result.failureCount === 0 ? "default" : "destructive",
      })
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: error?.message || "Upload failed",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setUploadResults(null)
    setAllowCreate(true)
  }

  const closeDialog = () => {
    setOpen(false)
    setTimeout(resetUpload, 200)
  }

  const previewSummary = () => {
    if (!uploadResults) return

    const created = uploadResults.results.filter((r) => r.isNew)
    const updated = uploadResults.results.filter((r) => r.status === "success" && !r.isNew)
    const failed = uploadResults.results.filter((r) => r.status === "error")

    return { created, updated, failed }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Bulk Upload V2
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Medicines (Enhanced)</DialogTitle>
          <DialogDescription>Upload medicines with auto-creation and image support</DialogDescription>
        </DialogHeader>

        {!uploadResults ? (
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="guide">Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary hover:bg-gray-50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium mb-1">Drag and drop your CSV or Excel file here</p>
                  <p className="text-sm text-gray-500">or click to select a file</p>
                  {file && <p className="text-sm text-green-600 mt-2">Selected: {file.name}</p>}
                </div>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex gap-2">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-blue-900">New Features</p>
                        <ul className="text-blue-800 space-y-1">
                          <li>- Auto-create new medicines not in database</li>
                          <li>- Upload medicine images (base64 encoded)</li>
                          <li>- Support for manufacturer, category, description fields</li>
                          <li>- Preview before uploading to database</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                  <Checkbox
                    id="allowCreate"
                    checked={allowCreate}
                    onCheckedChange={(checked) => setAllowCreate(checked === true)}
                  />
                  <label htmlFor="allowCreate" className="flex-1 cursor-pointer text-sm">
                    <span className="font-medium">Allow creating new medicines</span>
                    <p className="text-gray-600">
                      If enabled, medicines not found in database will be created automatically
                    </p>
                  </label>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Download the template and fill it with your medicine data. The enhanced template
                  supports auto-creation of new medicines and image uploads.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  onClick={() => handleDownloadTemplate("v2")}
                  disabled={downloadingTemplate}
                  className="w-full gap-2"
                  size="lg"
                  variant="default"
                >
                  {downloadingTemplate ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Enhanced Template (V2)
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleDownloadTemplate("v1")}
                  disabled={downloadingTemplate}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {downloadingTemplate ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Basic Template (V1)
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t my-4" />

              <div className="space-y-2">
                <h3 className="font-semibold">Template Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sheet 1: Example data with real-world formats</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sheet 2: Detailed instructions for each column</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Support for image uploads (base64 format)</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Auto-creation of new medicines if enabled</span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <div className="space-y-4 text-sm">
                <div className="space-y-2">
                  <h3 className="font-semibold">Required Columns</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>- <span className="font-medium">medicine_name</span> OR <span className="font-medium">medicine_id</span></li>
                    <li>- <span className="font-medium">batch_number</span></li>
                    <li>- <span className="font-medium">expiry_date</span> (DD-MM-YYYY format)</li>
                    <li>- <span className="font-medium">mrp</span> (selling price)</li>
                    <li>- <span className="font-medium">quantity</span></li>
                    <li>- <span className="font-medium">unit_price</span> (cost per unit)</li>
                  </ul>
                </div>

                <div className="border-t my-4" />

                <div className="space-y-2">
                  <h3 className="font-semibold">For New Medicine Creation</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>- <span className="font-medium">generic_name</span></li>
                    <li>- <span className="font-medium">strength</span> (e.g., 500mg)</li>
                    <li>- <span className="font-medium">form</span> (Tablet, Capsule, etc.)</li>
                    <li>- <span className="font-medium">manufacturer</span></li>
                    <li>- <span className="font-medium">category</span></li>
                    <li>- <span className="font-medium">description</span></li>
                    <li>- <span className="font-medium">image_base64</span> (optional image)</li>
                  </ul>
                </div>

                <div className="border-t my-4" />

                <div className="space-y-2">
                  <h3 className="font-semibold">Image Upload Support</h3>
                  <p className="text-gray-600">
                    Include base64 encoded image data in the image_base64 column. Images will be automatically
                    uploaded to Cloudinary and linked to the medicine.
                  </p>
                </div>

                <div className="border-t my-4" />

                <div className="space-y-2">
                  <h3 className="font-semibold">Date Format</h3>
                  <p className="text-gray-600">
                    Use DD-MM-YYYY format for expiry_date and mfg_date. Example: 31-12-2025
                  </p>
                </div>

                <div className="border-t my-4" />

                <div className="space-y-2">
                  <h3 className="font-semibold">Duplicate Handling</h3>
                  <p className="text-gray-600">
                    If the same medicine batch exists, the quantity will be updated instead of creating a duplicate.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Rows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{uploadResults.totalRows}</div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-900">Successful</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">{uploadResults.successCount}</div>
                </CardContent>
              </Card>
              {uploadResults.createdCount ? (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-900">Created</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-700">{uploadResults.createdCount}</div>
                  </CardContent>
                </Card>
              ) : null}
              <Card className={uploadResults.failureCount > 0 ? "border-red-200 bg-red-50" : "border-gray-200"}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm ${uploadResults.failureCount > 0 ? "text-red-900" : ""}`}>
                    Failed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${uploadResults.failureCount > 0 ? "text-red-700" : ""}`}>
                    {uploadResults.failureCount}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Upload Details</h3>
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50">
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadResults.results.map((result, idx) => (
                      <TableRow key={idx} className={result.status === "error" ? "bg-red-50" : "bg-green-50"}>
                        <TableCell className="font-mono text-sm">{result.row}</TableCell>
                        <TableCell className="text-sm">
                          <div>
                            {result.name || "N/A"}
                            {result.isNew && <Badge className="ml-2 bg-blue-600">New</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {result.status === "success" ? (
                            <Badge className="bg-green-600">Success</Badge>
                          ) : (
                            <Badge variant="destructive">Error</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{result.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Button onClick={() => closeDialog()} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
